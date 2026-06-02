/**
 * Serviço de analytics operacional: orquestra RPC de rollups + amostra de plantões
 * em janelas temporais fixas (sem scans ad-hoc gigantes no cliente).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import {
  buildKpiValueMap,
  buildPeriodShiftRollup,
  mergeConfirmationRateFromEvents,
  parseEventRollups,
  type EventRollups,
  type KpiValueMap,
} from "@/lib/operations/analytics/kpi-aggregators";
import {
  buildOperationalSummary,
  buildWorkforceSummary,
} from "@/lib/operations/analytics/operational-summaries";
import {
  addUtcDays,
  groupSumByWeek,
  lastN,
  pctDelta,
  utcDayKey,
  utcDayKeysBetween,
  type NumericTrendPoint,
} from "@/lib/operations/analytics/trend-adapters";
import {
  aggregateShiftWindow,
  type ShiftWindowSample,
} from "@/lib/operations/metrics/operational-metrics-factory";
import { buildOperationalScoringForAnalyticsPayload } from "@/lib/operations/scoring/analytics-payload-scoring";
import type { OperationalScoringResult } from "@/lib/operations/scoring/types";
import { operationalRecommendationsFromAnalyticsInput } from "@/lib/operations/recommendations/recommendation-adapters";
import type { OperationalRecommendationBundle } from "@/lib/operations/recommendations/types";

const PRIMARY_DAYS = 28;
const COMPARE_DAYS = 28;
const SHIFT_ANALYTICS_LIMIT = 4000;

const SHIFT_SELECT = `
  id, starts_at, status,
  assignments:shift_assignments!shift_assignments_tenant_shift_fk ( assignment_status )
`;

export type OperationalAnalyticsSnapshot = {
  asOf: string;
  primary: { fromISO: string; toISO: string; dayKeys: string[] };
  compare: { fromISO: string; toISO: string; dayKeys: string[] };
  kpis: {
    primary: KpiValueMap;
    compare: KpiValueMap;
    deltaPct: Partial<Record<keyof KpiValueMap, number | null>>;
  };
  trends: {
    dailyCoveragePct: NumericTrendPoint[];
    dailyPressureScore: NumericTrendPoint[];
    weeklySwapRequests: NumericTrendPoint[];
    miniCoverage: NumericTrendPoint[];
    miniPressure: NumericTrendPoint[];
  };
  summaries: {
    operational: string;
    workforce: string;
  };
  meta: {
    cappedShiftsSample: boolean;
    primaryRollup: EventRollups;
    compareRollup: EventRollups;
  };
  scoring: OperationalScoringResult;
  recommendations: OperationalRecommendationBundle;
};

function filterShiftRowsForDay(rows: ShiftWindowSample[], dayKey: string): ShiftWindowSample[] {
  const out: ShiftWindowSample[] = [];
  for (const r of rows) {
    if (r.status === "cancelled") continue;
    if (utcDayKey(r.starts_at) !== dayKey) continue;
    out.push(r);
  }
  return out;
}

function dailyAggregatesForKeys(
  rows: ShiftWindowSample[],
  dayKeys: readonly string[],
): ReturnType<typeof aggregateShiftWindow>[] {
  const aggs: ReturnType<typeof aggregateShiftWindow>[] = [];
  for (const dayKey of dayKeys) {
    const dayRows = filterShiftRowsForDay(rows, dayKey);
    const evalMs = new Date(dayKey + "T23:59:59.999Z").getTime();
    aggs.push(aggregateShiftWindow(dayRows, evalMs, false, evalMs));
  }
  return aggs;
}

function splitRowsByPeriod(
  rows: ShiftWindowSample[],
  primaryFromMs: number,
  primaryToMs: number,
  compareFromMs: number,
): { primary: ShiftWindowSample[]; compare: ShiftWindowSample[] } {
  const primary: ShiftWindowSample[] = [];
  const compare: ShiftWindowSample[] = [];
  for (const r of rows) {
    if (r.status === "cancelled") continue;
    const t = Date.parse(r.starts_at);
    if (Number.isNaN(t)) continue;
    if (t >= primaryFromMs && t < primaryToMs) primary.push(r);
    else if (t >= compareFromMs && t < primaryFromMs) compare.push(r);
  }
  return { primary, compare };
}

export async function loadOperationalAnalyticsSnapshot(
  ctx: ServiceCtx,
): Promise<OperationalAnalyticsSnapshot> {
  assertCan(ctx.role, "shifts:read");

  const now = new Date();
  const todayKey = utcDayKey(now.toISOString());
  const primaryStartKey = addUtcDays(todayKey, -PRIMARY_DAYS + 1);
  const primaryEndExclusiveKey = addUtcDays(todayKey, 1);
  const primaryFromMs = Date.parse(primaryStartKey + "T00:00:00.000Z");
  const primaryToMs = Date.parse(primaryEndExclusiveKey + "T00:00:00.000Z");

  const compareStartKey = addUtcDays(primaryStartKey, -COMPARE_DAYS);
  const compareFromMs = Date.parse(compareStartKey + "T00:00:00.000Z");

  const primaryFromISO = new Date(primaryFromMs).toISOString();
  const primaryToISO = new Date(primaryToMs).toISOString();
  const compareFromISO = new Date(compareFromMs).toISOString();

  const primaryDayKeys = utcDayKeysBetween(primaryStartKey, primaryEndExclusiveKey);
  const compareDayKeys = utcDayKeysBetween(compareStartKey, primaryStartKey);

  const [rollPrimaryRes, rollCompareRes, shiftsRes, pendingRes] = await Promise.all([
    ctx.client.rpc("get_operational_analytics_event_rollups", {
      p_from: primaryFromISO,
      p_to: primaryToISO,
    }),
    ctx.client.rpc("get_operational_analytics_event_rollups", {
      p_from: compareFromISO,
      p_to: primaryFromISO,
    }),
    ctx.client
      .from("shifts")
      .select(SHIFT_SELECT)
      .eq("tenant_id", ctx.tenantId)
      .gte("starts_at", compareFromISO)
      .lt("starts_at", primaryToISO)
      .order("starts_at", { ascending: true })
      .limit(SHIFT_ANALYTICS_LIMIT)
      .returns<ShiftWindowSample[]>(),
    ctx.client
      .from("shift_assignments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("assignment_status", "pending"),
  ]);

  if (rollPrimaryRes.error) throw mapPostgresError(rollPrimaryRes.error);
  if (rollCompareRes.error) throw mapPostgresError(rollCompareRes.error);
  if (shiftsRes.error) throw mapPostgresError(shiftsRes.error);
  if (pendingRes.error) throw mapPostgresError(pendingRes.error);

  const shiftRows = shiftsRes.data ?? [];
  const capped = shiftRows.length >= SHIFT_ANALYTICS_LIMIT;

  const { primary: primaryRows, compare: compareRows } = splitRowsByPeriod(
    shiftRows,
    primaryFromMs,
    primaryToMs,
    compareFromMs,
  );

  const rollPrimary = parseEventRollups(rollPrimaryRes.data);
  const rollCompare = parseEventRollups(rollCompareRes.data);

  const primaryAggs = dailyAggregatesForKeys(primaryRows, primaryDayKeys);
  const compareAggs = dailyAggregatesForKeys(compareRows, compareDayKeys);

  const shiftPrimary = mergeConfirmationRateFromEvents(
    buildPeriodShiftRollup({ dailyAggregates: primaryAggs, dayKeys: primaryDayKeys }),
    rollPrimary.event_totals,
  );
  const shiftCompare = mergeConfirmationRateFromEvents(
    buildPeriodShiftRollup({ dailyAggregates: compareAggs, dayKeys: compareDayKeys }),
    rollCompare.event_totals,
  );

  const pendingNow = pendingRes.count ?? 0;

  const kpPrimary = buildKpiValueMap({
    shiftRollup: shiftPrimary,
    rollups: rollPrimary,
    pendingAssignmentsNow: pendingNow,
  });
  const kpCompare = buildKpiValueMap({
    shiftRollup: shiftCompare,
    rollups: rollCompare,
    pendingAssignmentsNow: null,
  });

  const deltaPct: OperationalAnalyticsSnapshot["kpis"]["deltaPct"] = {};
  for (const k of Object.keys(kpPrimary) as (keyof KpiValueMap)[]) {
    const a = kpPrimary[k];
    const b = kpCompare[k];
    if (a == null || b == null) {
      deltaPct[k] = null;
      continue;
    }
    deltaPct[k] = pctDelta(a, b);
  }

  const dailySwaps: { dayKey: string; value: number }[] = [];
  const byDaySwap = new Map<string, number>();
  for (const row of rollPrimary.daily_event_counts) {
    if (row.event_type !== "swap_requested") continue;
    byDaySwap.set(row.bucket, (byDaySwap.get(row.bucket) ?? 0) + row.c);
  }
  for (const dk of primaryDayKeys) {
    dailySwaps.push({ dayKey: dk, value: byDaySwap.get(dk) ?? 0 });
  }

  const weeklySwapRequests = groupSumByWeek(dailySwaps);

  const dailyCoveragePct: NumericTrendPoint[] = shiftPrimary.dailyCoverage.map((d) => ({
    key: d.dayKey,
    value: d.coveragePct,
  }));
  const dailyPressureScore: NumericTrendPoint[] = shiftPrimary.dailyPressure.map((d) => ({
    key: d.dayKey,
    value: d.score,
  }));

  const opSummary = buildOperationalSummary({
    primaryDays: PRIMARY_DAYS,
    avgCoveragePct: shiftPrimary.avgCoveragePct,
    avgConfirmationRatePct: shiftPrimary.avgConfirmationRatePct,
    swapsRequested: rollPrimary.event_totals.swap_requested ?? 0,
    avgPressureScore: shiftPrimary.avgPressureScore,
  });
  const wfSummary = buildWorkforceSummary({
    avgAvailabilityWindows: rollPrimary.availability_window_avg,
    assignmentsCreated: rollPrimary.event_totals.assignment_created ?? 0,
    avgShiftsWithoutCoveragePerDay: shiftPrimary.avgShiftsWithoutCoveragePerDay,
  });

  const scoring = buildOperationalScoringForAnalyticsPayload({
    asOf: now.toISOString(),
    primary: { dayKeys: primaryDayKeys },
    kpis: {
      primary: kpPrimary,
      deltaPct,
    },
    trends: {
      miniCoverage: lastN(dailyCoveragePct, 7),
      miniPressure: lastN(dailyPressureScore, 7),
    },
  });

  const miniCoverage = lastN(dailyCoveragePct, 7);
  const miniPressure = lastN(dailyPressureScore, 7);
  const recommendations = operationalRecommendationsFromAnalyticsInput({
    asOf: now.toISOString(),
    kpis: kpPrimary,
    scoring,
    miniCoverage,
    miniPressure,
  });

  return {
    asOf: now.toISOString(),
    primary: {
      fromISO: primaryFromISO,
      toISO: primaryToISO,
      dayKeys: primaryDayKeys,
    },
    compare: {
      fromISO: compareFromISO,
      toISO: primaryFromISO,
      dayKeys: compareDayKeys,
    },
    kpis: {
      primary: kpPrimary,
      compare: kpCompare,
      deltaPct,
    },
    trends: {
      dailyCoveragePct,
      dailyPressureScore,
      weeklySwapRequests,
      miniCoverage,
      miniPressure,
    },
    summaries: {
      operational: opSummary,
      workforce: wfSummary,
    },
    meta: {
      cappedShiftsSample: capped,
      primaryRollup: rollPrimary,
      compareRollup: rollCompare,
    },
    scoring,
    recommendations,
  };
}
