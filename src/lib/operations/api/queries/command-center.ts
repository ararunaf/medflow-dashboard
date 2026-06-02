/**
 * Command center operacional — uma única server function agrega contagens
 * e uma amostra da janela para cobertura / conflitos sem múltiplas idas
 * ao cliente.
 */
import { createServerFn } from "@tanstack/react-start";
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import {
  aggregateShiftWindow,
  buildOperationalCommandCenterView,
  type ShiftWindowSample,
} from "@/lib/operations/metrics/operational-metrics-factory";
import {
  SWAP_LIST_SELECT,
  toSwapListItem,
  type RawSwapRow,
} from "@/lib/operations/api/queries/swaps";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { loadOperationalRecommendationFeedbackOverlay } from "@/lib/services/operations/operational-feedback-service";
import { loadOperationalMemoryLayerSummary } from "@/lib/services/operations/operational-memory-service";
import {
  applyAdaptiveOrderingForSnapshot,
  loadAdaptivePrioritizationLayer,
} from "@/lib/services/operations/operational-adaptive-prioritization-service";
import {
  loadOperationalPolicyIntelligenceLayerSummary,
  type OperationalPolicyIntelligenceLayerSummary,
} from "@/lib/services/operations/operational-policy-intelligence-service";
import { loadStrategicOperationalPlanningLayerSummary } from "@/lib/operations/strategic-planning/strategic-planning-loader";
import type { StrategicOperationalPlanningLayerSummary } from "@/lib/operations/strategic-planning/types";
import { evaluateOperationalAlerts } from "@/lib/operations/alerts/engine";
import { recommendationIdsFromBundleItems } from "@/lib/operations/feedback/feedback-summary-layer";
import type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
import type { OperationalMemoryLayerSummary } from "@/lib/operations/operational-memory/types";
import type {
  AdaptivePrioritizationLayerSummary,
  AdaptiveRecommendationBundle,
} from "@/lib/operations/adaptive-prioritization";
import { buildOperationalRecommendationBundleFromCommandCenter } from "@/lib/operations/recommendations/operational-recommendation-service";
import type { OperationalRecommendationBundle } from "@/lib/operations/recommendations/types";
import { buildOperationalScoringFromCommandCenterCore } from "@/lib/operations/scoring/operational-scoring-service";
import type { AlertSeverityCounts, OperationalScoringResult } from "@/lib/operations/scoring/types";
import type {
  OperationalCommandCenterCore,
  OperationalSwapQuickItem,
} from "@/lib/operations/types/command-center-core";

const SHIFT_WINDOW_LIMIT = 800;
const SWAP_QUICK_LIMIT = 48;
const CRITICAL_SWAP_HOURS = 48;

const ORCH_ACTIVE_STATES = [
  "planned",
  "awaiting_approval",
  "orchestrating",
  "partially_executed",
  "blocked",
] as const;

const SHIFT_WINDOW_SELECT = `
  id, starts_at, status,
  assignments:shift_assignments!shift_assignments_tenant_shift_fk ( assignment_status )
`;

export type { OperationalRecommendationBundle } from "@/lib/operations/recommendations/types";
export type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
export type { OperationalMemoryLayerSummary } from "@/lib/operations/operational-memory/types";
export type { OperationalPolicyIntelligenceLayerSummary } from "@/lib/services/operations/operational-policy-intelligence-service";
export type { StrategicOperationalPlanningLayerSummary } from "@/lib/operations/strategic-planning/types";
export type { OperationalSwapQuickItem } from "@/lib/operations/types/command-center-core";
export type {
  AdaptivePrioritizationLayerSummary,
  AdaptiveRecommendationBundle,
} from "@/lib/operations/adaptive-prioritization";

export type LoadOperationalCommandCenterOpts = {
  /** Evita recursão quando serviços de planejamento precisam do restante do snapshot. */
  omitStrategicPlanning?: boolean;
};

export type OperationalCommandCenterSnapshot = OperationalCommandCenterCore & {
  scoring: OperationalScoringResult;
  recommendations: AdaptiveRecommendationBundle;
  recommendationFeedback: OperationalRecommendationFeedbackOverlay;
  operationalMemory: OperationalMemoryLayerSummary;
  adaptivePrioritization: AdaptivePrioritizationLayerSummary;
  policyIntelligence: OperationalPolicyIntelligenceLayerSummary;
  strategicPlanning: StrategicOperationalPlanningLayerSummary;
  /** Orquestrações ativas (estados não terminais) — O(1) count, sem varrer histórico. */
  orchestrationActiveCount: number;
};

function emptyStrategicLayer(asOf: string): StrategicOperationalPlanningLayerSummary {
  return { asOf, enabled: false, liveBundle: null, persistedCycle: null };
}

function startOfDayISO(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function addDaysISO(d: Date, days: number): string {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

/**
 * Carrega o snapshot completo da central (scoring, recomendações, feedback).
 * Reutilizável por server functions e pela camada de tools read-only do copiloto GPT.
 */
export async function loadOperationalCommandCenterSnapshot(
  ctx: ServiceCtx,
  opts?: LoadOperationalCommandCenterOpts,
): Promise<OperationalCommandCenterSnapshot> {
  const now = new Date();
  const nowMs = now.getTime();
  const windowStart = startOfDayISO(now);
  const windowEnd = addDaysISO(now, 7);

  const openShiftsP = ctx.client
    .from("shifts")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "open");

  const pendingSwapsP = ctx.client
    .from("shift_swap_requests")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "pending");

  const pendingAssignmentsP = ctx.client
    .from("shift_assignments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("assignment_status", "pending");

  const professionalsCountP = ctx.client
    .from("professionals")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId);

  const availabilityProfP = ctx.client
    .from("availability")
    .select("professional_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("available", true)
    .limit(8000);

  const shiftsWindowP = ctx.client
    .from("shifts")
    .select(SHIFT_WINDOW_SELECT)
    .eq("tenant_id", ctx.tenantId)
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd)
    .order("starts_at", { ascending: true })
    .limit(SHIFT_WINDOW_LIMIT)
    .returns<ShiftWindowSample[]>();

  const swapsPendingP = ctx.client
    .from("shift_swap_requests")
    .select(SWAP_LIST_SELECT)
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "pending")
    .limit(SWAP_QUICK_LIMIT)
    .returns<RawSwapRow[]>();

  const orchActiveP = isOperationalManager(ctx.role)
    ? ctx.client
        .from("operational_orchestrations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .in("state", [...ORCH_ACTIVE_STATES])
    : Promise.resolve({ count: 0, error: null });

  const [
    openRes,
    pendingSwapsRes,
    pendingAssignRes,
    profCountRes,
    availRes,
    shiftsRes,
    swapsRes,
    orchActiveRes,
  ] = await Promise.all([
    openShiftsP,
    pendingSwapsP,
    pendingAssignmentsP,
    professionalsCountP,
    availabilityProfP,
    shiftsWindowP,
    swapsPendingP,
    orchActiveP,
  ]);

  if (openRes.error) throw mapPostgresError(openRes.error);
  if (pendingSwapsRes.error) throw mapPostgresError(pendingSwapsRes.error);
  if (pendingAssignRes.error) throw mapPostgresError(pendingAssignRes.error);
  if (profCountRes.error) throw mapPostgresError(profCountRes.error);
  if (availRes.error) throw mapPostgresError(availRes.error);
  if (shiftsRes.error) throw mapPostgresError(shiftsRes.error);
  if (swapsRes.error) throw mapPostgresError(swapsRes.error);
  if ("error" in orchActiveRes && orchActiveRes.error) throw mapPostgresError(orchActiveRes.error);

  const orchestrationActiveCount =
    "count" in orchActiveRes && typeof orchActiveRes.count === "number" ? orchActiveRes.count : 0;

  const shiftRows = shiftsRes.data ?? [];
  const hitCap = shiftRows.length >= SHIFT_WINDOW_LIMIT;
  const shiftAgg = aggregateShiftWindow(shiftRows, nowMs, hitCap);

  const profIds = new Set((availRes.data ?? []).map((r) => r.professional_id).filter(Boolean));
  const professionalsWithAvailability = profIds.size;
  const totalProfessionals = profCountRes.count ?? 0;

  const view = buildOperationalCommandCenterView({
    now,
    window: { fromISO: windowStart, toISO: windowEnd },
    openShifts: openRes.count ?? 0,
    pendingSwaps: pendingSwapsRes.count ?? 0,
    pendingAssignments: pendingAssignRes.count ?? 0,
    totalProfessionals,
    professionalsWithAvailability,
    shiftAggregate: shiftAgg,
  });

  const criticalHorizonMs = CRITICAL_SWAP_HOURS * 60 * 60 * 1000;
  const swapRows = (swapsRes.data ?? [])
    .map((r) => toSwapListItem(r, ctx.professionalId))
    .sort((a, b) => new Date(a.shift.startsAt).getTime() - new Date(b.shift.startsAt).getTime());

  const swapsCritical: OperationalSwapQuickItem[] = swapRows
    .map((s) => {
      const t = new Date(s.shift.startsAt).getTime();
      const critical = !Number.isNaN(t) && t >= nowMs && t - nowMs <= criticalHorizonMs;
      return {
        swapId: s.swapId,
        shiftStartsAt: s.shift.startsAt,
        departmentName: s.shift.departmentName,
        requesterName: s.requesterName,
        targetName: s.targetName,
        critical,
      };
    })
    .sort((a, b) => {
      if (a.critical !== b.critical) return a.critical ? -1 : 1;
      return a.shiftStartsAt.localeCompare(b.shiftStartsAt);
    })
    .slice(0, 8);

  const core: OperationalCommandCenterCore = {
    asOf: now.toISOString(),
    window: { fromISO: windowStart, toISO: windowEnd },
    widgets: view.widgets,
    indicators: view.indicators,
    coordination: {
      urgency: view.coordination.urgency,
      conflictsOverview: view.coordination.conflictsOverview,
      coverageOverview: view.coordination.coverageOverview,
      swapsCritical,
    },
    meta: {
      cappedWindowSample: view.cappedWindowSample,
    },
  };

  const alerts = evaluateOperationalAlerts(core);
  const alertCounts: AlertSeverityCounts = { critical: 0, warning: 0, info: 0 };
  for (const a of alerts) alertCounts[a.severity] += 1;

  const scoring = buildOperationalScoringFromCommandCenterCore(core, { alertCounts });

  const recommendations = buildOperationalRecommendationBundleFromCommandCenter({
    core,
    scoring,
    alerts,
    alertCounts,
  });

  const recommendationFeedback = await loadOperationalRecommendationFeedbackOverlay(
    ctx,
    recommendationIdsFromBundleItems(recommendations.items),
  );

  const operationalMemory = await loadOperationalMemoryLayerSummary(ctx, {
    recommendationFeedback,
    forecastProjection: recommendations.forecast.projection,
    healthState: scoring.healthState,
    asOf: core.asOf,
  });

  const adaptivePrioritization = await loadAdaptivePrioritizationLayer(ctx, {
    asOf: core.asOf,
    memory: operationalMemory,
    recommendationFeedback,
    recommendations,
  });

  const policyIntelligence = await loadOperationalPolicyIntelligenceLayerSummary(ctx, {
    asOf: core.asOf,
  });

  const adaptiveRecommendations = applyAdaptiveOrderingForSnapshot(
    recommendations,
    adaptivePrioritization,
  );

  const strategicPlanning = opts?.omitStrategicPlanning
    ? emptyStrategicLayer(core.asOf)
    : await loadStrategicOperationalPlanningLayerSummary(ctx, {
        asOf: core.asOf,
        core,
        scoring,
        recommendations: adaptiveRecommendations,
        operationalMemory,
        adaptivePrioritization,
        policyIntelligence,
        orchestrationActiveCount,
      });

  return {
    ...core,
    scoring,
    recommendations: adaptiveRecommendations,
    recommendationFeedback,
    operationalMemory,
    adaptivePrioritization,
    policyIntelligence,
    strategicPlanning,
    orchestrationActiveCount,
  };
}

export const getOperationalCommandCenterFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<OperationalCommandCenterSnapshot>> => {
    return runQuery((ctx) => loadOperationalCommandCenterSnapshot(ctx));
  },
);
