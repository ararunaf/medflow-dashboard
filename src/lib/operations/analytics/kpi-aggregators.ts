/**
 * Agregadores de KPI a partir de rollups de eventos + agregados de plantões.
 */
import type { OperationalKpiId } from "@/lib/operations/analytics/kpi-registry";
import type { ShiftWindowAggregate } from "@/lib/operations/metrics/operational-metrics-factory";
import { operationalPressureNumeric } from "@/lib/operations/metrics/status-helpers";

function pressureScoreFromShiftAgg(agg: ShiftWindowAggregate): number {
  const coveragePct =
    agg.shiftsTotalInWindow === 0
      ? 100
      : Math.round((agg.shiftsConfirmedInWindow / agg.shiftsTotalInWindow) * 1000) / 10;
  return operationalPressureNumeric({
    openShifts: agg.shiftsOpenUnassigned,
    pendingSwaps: 0,
    pendingAssignments: agg.assignmentBuckets.pending,
    coverageGapPercent: 100 - coveragePct,
    conflicts: agg.operationalConflictShifts,
  });
}

export type EventTotals = Partial<Record<string, number>>;

export type LatencyBlock = { avg_seconds: number | null; sample_size: number };

export type EventRollups = {
  daily_event_counts: { bucket: string; event_type: string; c: number }[];
  event_totals: EventTotals;
  assignment_confirmation: LatencyBlock;
  swap_approval: LatencyBlock;
  availability_window_avg: number | null;
};

export function parseEventRollups(raw: unknown): EventRollups {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const dailyRaw = o.daily_event_counts;
  const daily_event_counts: EventRollups["daily_event_counts"] = [];
  if (Array.isArray(dailyRaw)) {
    for (const row of dailyRaw) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const bucket = typeof r.bucket === "string" ? r.bucket : "";
      const event_type = typeof r.event_type === "string" ? r.event_type : "";
      const c = typeof r.c === "number" ? r.c : Number(r.c);
      if (!bucket || !event_type || !Number.isFinite(c)) continue;
      daily_event_counts.push({ bucket, event_type, c: Math.trunc(c) });
    }
  }

  const event_totals: EventTotals = {};
  const et = o.event_totals;
  if (et && typeof et === "object" && !Array.isArray(et)) {
    for (const [k, v] of Object.entries(et as Record<string, unknown>)) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) event_totals[k] = Math.trunc(n);
    }
  }

  const readLatency = (x: unknown): LatencyBlock => {
    if (!x || typeof x !== "object") return { avg_seconds: null, sample_size: 0 };
    const b = x as Record<string, unknown>;
    const avg =
      b.avg_seconds == null
        ? null
        : typeof b.avg_seconds === "number"
          ? b.avg_seconds
          : Number(b.avg_seconds);
    const sz = typeof b.sample_size === "number" ? b.sample_size : Number(b.sample_size);
    return {
      avg_seconds: avg != null && Number.isFinite(avg) ? avg : null,
      sample_size: Number.isFinite(sz) ? Math.trunc(sz) : 0,
    };
  };

  let availability_window_avg: number | null = null;
  const av = o.availability_window_avg;
  if (typeof av === "number" && Number.isFinite(av)) availability_window_avg = av;
  else if (typeof av === "string" && av.length > 0) {
    const n = Number(av);
    if (Number.isFinite(n)) availability_window_avg = n;
  }

  return {
    daily_event_counts,
    event_totals,
    assignment_confirmation: readLatency(o.assignment_confirmation),
    swap_approval: readLatency(o.swap_approval),
    availability_window_avg,
  };
}

export function confirmationRateFromTotals(t: EventTotals): number {
  const conf = t.assignment_confirmed ?? 0;
  const rej = t.assignment_rejected ?? 0;
  const decided = conf + rej;
  if (decided === 0) return 100;
  return Math.round((conf / decided) * 1000) / 10;
}

export type PeriodShiftRollup = {
  /** Média da cobertura % por dia com pelo menos um plantão ativo. */
  avgCoveragePct: number;
  avgConfirmationRatePct: number;
  avgShiftsWithoutCoveragePerDay: number;
  avgConflictShiftsPerDay: number;
  avgPressureScore: number;
  daysWithShifts: number;
  dailyCoverage: { dayKey: string; coveragePct: number }[];
  dailyPressure: { dayKey: string; score: number }[];
};

export function buildPeriodShiftRollup(input: {
  dailyAggregates: ShiftWindowAggregate[];
  dayKeys: string[];
}): PeriodShiftRollup {
  const { dailyAggregates, dayKeys } = input;
  const n = Math.min(dailyAggregates.length, dayKeys.length);
  const dailyCoverage: { dayKey: string; coveragePct: number }[] = [];
  const dailyPressure: { dayKey: string; score: number }[] = [];
  let sumCoverage = 0;
  let sumCovDays = 0;
  let sumNoCov = 0;
  let sumConf = 0;
  let sumPress = 0;

  for (let i = 0; i < n; i++) {
    const agg = dailyAggregates[i]!;
    const dayKey = dayKeys[i]!;
    const cov =
      agg.shiftsTotalInWindow === 0
        ? 100
        : Math.round((agg.shiftsConfirmedInWindow / agg.shiftsTotalInWindow) * 1000) / 10;
    dailyCoverage.push({ dayKey, coveragePct: cov });
    if (agg.shiftsTotalInWindow > 0) {
      sumCoverage += cov;
      sumCovDays += 1;
    }
    sumNoCov += agg.shiftsWithoutConfirmedAssignment;
    sumConf += agg.operationalConflictShifts;
    const ps = pressureScoreFromShiftAgg(agg);
    sumPress += ps;
    dailyPressure.push({ dayKey, score: ps });
  }

  const days = n || 1;
  return {
    avgCoveragePct: sumCovDays === 0 ? 100 : Math.round((sumCoverage / sumCovDays) * 10) / 10,
    avgConfirmationRatePct: 0,
    avgShiftsWithoutCoveragePerDay: Math.round((sumNoCov / days) * 10) / 10,
    avgConflictShiftsPerDay: Math.round((sumConf / days) * 10) / 10,
    avgPressureScore: Math.round((sumPress / days) * 10) / 10,
    daysWithShifts: sumCovDays,
    dailyCoverage,
    dailyPressure,
  };
}

/** Injeta taxa de confirmação a partir de eventos (mais fiel ao histórico de decisões). */
export function mergeConfirmationRateFromEvents(
  rollup: PeriodShiftRollup,
  eventTotals: EventTotals,
): PeriodShiftRollup {
  return {
    ...rollup,
    avgConfirmationRatePct: confirmationRateFromTotals(eventTotals),
  };
}

export type KpiValueMap = Record<OperationalKpiId, number | null>;

export function buildKpiValueMap(input: {
  shiftRollup: PeriodShiftRollup;
  rollups: EventRollups;
  pendingAssignmentsNow: number | null;
}): KpiValueMap {
  const { shiftRollup, rollups, pendingAssignmentsNow } = input;
  const t = rollups.event_totals;
  const confH =
    rollups.assignment_confirmation.avg_seconds != null
      ? rollups.assignment_confirmation.avg_seconds / 3600
      : null;
  const swapH =
    rollups.swap_approval.avg_seconds != null ? rollups.swap_approval.avg_seconds / 3600 : null;

  return {
    avg_coverage_pct: shiftRollup.avgCoveragePct,
    avg_confirmation_rate_pct: shiftRollup.avgConfirmationRatePct,
    avg_confirmation_latency_hours: confH,
    avg_swap_approval_latency_hours: swapH,
    avg_shifts_without_coverage_per_day: shiftRollup.avgShiftsWithoutCoveragePerDay,
    avg_conflict_shifts_per_day: shiftRollup.avgConflictShiftsPerDay,
    avg_pressure_score: shiftRollup.avgPressureScore,
    avg_availability_windows: rollups.availability_window_avg,
    swaps_requested: t.swap_requested ?? 0,
    assignments_created: t.assignment_created ?? 0,
    pending_assignments_now: pendingAssignmentsNow,
  };
}
