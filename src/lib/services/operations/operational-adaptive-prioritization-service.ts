/**
 * Serviço server-side da camada de priorização operacional adaptativa.
 *
 * Responsabilidades:
 *  - Hidratar `AdaptivePrioritizationLayerSummary` a partir do snapshot já
 *    carregado pelo command center (memória, feedback, recomendações, scoring).
 *  - Buscar transições supervisionadas (validate/dismiss) recentes no
 *    audit log (`operational_events`) para anotar ajustes derivados.
 *  - Registrar transições supervisionadas (governança humana) em modo append-only.
 *
 * Não modifica dados de domínio nem dispara execuções — apenas reordenação
 * e registro de auditoria.
 */
import { isOperationalManager } from "@/lib/auth/rbac";
import type { Database } from "@/lib/database.types";
import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import {
  ADAPTIVE_PRIORITY_STATES,
  ADAPTIVE_SUBJECT_KINDS,
  type AdaptivePrioritizationLayerSummary,
  type AdaptivePriorityState,
  type AdaptivePrioritySubjectKind,
  type AdaptiveSupervisedTransition,
  applyAdaptiveOrderingToRecommendations,
  buildAdaptivePrioritizationLayer,
  buildAdaptiveSignalSnapshot,
  buildHistoricalWeightingProfile,
  DEFAULT_ADAPTATION_BOUNDARIES,
  normalizeAdjustmentId,
  reduceSupervisedAudits,
  SUPERVISED_TARGET_STATES,
  type AdaptiveRecommendationBundle,
  type AdaptiveSupervisedAudit,
} from "@/lib/operations/adaptive-prioritization";
import type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
import type { OperationalMemoryLayerSummary } from "@/lib/operations/operational-memory/types";
import type {
  OperationalOrchestrationDto,
  OperationalOrchestrationState,
} from "@/lib/operations/orchestration/types";
import type { OperationalRecommendationBundle } from "@/lib/operations/recommendations/types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

type EventRow = Database["public"]["Tables"]["operational_events"]["Row"];

const SUPERVISED_AUDIT_DESCRIPTION_PREFIX = "Adaptive priority adjustment:";
const SUPERVISED_AUDIT_CHANNEL = "adaptive_prioritization_governance";

/** Lê transições humanas recentes do audit log (últimos 14 dias). */
async function loadRecentSupervisedAudits(
  ctx: ServiceCtx,
  asOfISO: string,
): Promise<AdaptiveSupervisedAudit[]> {
  if (!isOperationalManager(ctx.role)) return [];
  const from = new Date(asOfISO);
  from.setUTCDate(from.getUTCDate() - 14);

  const { data, error } = await ctx.client
    .from("operational_events")
    .select("id,created_at,actor_profile_id,event_type,description,metadata,entity_type")
    .eq("tenant_id", ctx.tenantId)
    .eq("event_type", "operational_learning_signal_captured")
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.warn("[adaptive_prioritization] load supervised audits", error.message);
    return [];
  }

  const rows = (data ?? []) as Pick<
    EventRow,
    | "id"
    | "created_at"
    | "actor_profile_id"
    | "event_type"
    | "description"
    | "metadata"
    | "entity_type"
  >[];

  const audits: AdaptiveSupervisedAudit[] = [];
  for (const row of rows) {
    const md = (row.metadata ?? {}) as Record<string, unknown>;
    if (md.channel !== SUPERVISED_AUDIT_CHANNEL) continue;
    const stateRaw = md.next_state;
    if (typeof stateRaw !== "string") continue;
    if (!ADAPTIVE_PRIORITY_STATES.includes(stateRaw as AdaptivePriorityState)) continue;
    const adjId = typeof md.adjustment_id === "string" ? md.adjustment_id : null;
    if (!adjId) continue;
    audits.push({
      adjustmentId: normalizeAdjustmentId(adjId),
      state: stateRaw as AdaptivePriorityState,
      actorProfileId: row.actor_profile_id,
      at: row.created_at,
      note: typeof md.note === "string" ? (md.note as string) : null,
    });
  }
  return audits;
}

/** Lê orquestrações ativas (limite leve) para enriquecer ajustes. */
async function loadActiveOrchestrationsLite(
  ctx: ServiceCtx,
): Promise<OperationalOrchestrationDto[]> {
  if (!isOperationalManager(ctx.role)) return [];
  const { data, error } = await ctx.client
    .from("operational_orchestrations")
    .select("id,state,title")
    .eq("tenant_id", ctx.tenantId)
    .in("state", ["planned", "awaiting_approval", "orchestrating", "partially_executed"])
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) {
    console.warn("[adaptive_prioritization] load active orchestrations", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<{
    id: string;
    state: OperationalOrchestrationState;
    title: string;
  }>;
  // Construímos um DTO leve apenas com os campos consumidos pelo serviço.
  return rows.map(
    (r): OperationalOrchestrationDto => ({
      id: r.id,
      tenantId: ctx.tenantId,
      createdByProfileId: "",
      state: r.state,
      title: r.title,
      summary: "",
      narrativeJson: [],
      policyBundleJson: {},
      rollbackPreviewJson: [],
      executionOrderJson: [],
      approvedByProfileId: null,
      approvalNote: null,
      approvedAt: null,
      blockedReason: null,
      schemaVersion: "1.0.0",
      createdAt: "",
      updatedAt: "",
      steps: [],
    }),
  );
}

export type LoadAdaptivePrioritizationLayerInput = {
  asOf: string;
  memory: OperationalMemoryLayerSummary;
  recommendationFeedback: OperationalRecommendationFeedbackOverlay;
  recommendations: OperationalRecommendationBundle;
};

export async function loadAdaptivePrioritizationLayer(
  ctx: ServiceCtx,
  input: LoadAdaptivePrioritizationLayerInput,
): Promise<AdaptivePrioritizationLayerSummary> {
  const signals = buildAdaptiveSignalSnapshot({
    computedAt: input.asOf,
    memory: input.memory,
    recommendationFeedback: input.recommendationFeedback,
  });
  const weighting = buildHistoricalWeightingProfile({
    signals,
    boundaries: DEFAULT_ADAPTATION_BOUNDARIES,
  });

  const [audits, orchestrations] = await Promise.all([
    loadRecentSupervisedAudits(ctx, input.asOf),
    loadActiveOrchestrationsLite(ctx),
  ]);
  const supervisedTransitions = reduceSupervisedAudits(audits);

  return buildAdaptivePrioritizationLayer({
    computedAt: input.asOf,
    signals,
    weighting,
    recommendations: input.recommendations,
    orchestrations,
    supervisedTransitions,
  });
}

/**
 * Aplica reordenação adaptativa ao bundle de recomendações usado pelo snapshot
 * do command center. Mantém estado/semântica intactos; só altera a ordem.
 */
export function applyAdaptiveOrderingForSnapshot(
  bundle: OperationalRecommendationBundle,
  layer: AdaptivePrioritizationLayerSummary,
): AdaptiveRecommendationBundle {
  if (layer.adjustments.length === 0) {
    return {
      ...bundle,
      adaptive: { applied: false, adjustmentIds: [] },
    };
  }
  return applyAdaptiveOrderingToRecommendations({
    bundle,
    weighting: layer.weighting,
    adjustments: layer.adjustments,
  });
}

// ---------------------------------------------------------------------------
// Governança supervisionada
// ---------------------------------------------------------------------------

export type RecordAdaptivePriorityTransitionInput = {
  adjustmentId: string;
  subjectKind: AdaptivePrioritySubjectKind;
  nextState: AdaptivePriorityState;
  note?: string | null;
};

function isSupervisedTarget(state: AdaptivePriorityState): boolean {
  return (SUPERVISED_TARGET_STATES as readonly AdaptivePriorityState[]).includes(state);
}

export async function recordAdaptivePriorityTransition(
  ctx: ServiceCtx,
  input: RecordAdaptivePriorityTransitionInput,
): Promise<AdaptiveSupervisedTransition> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas gestores operacionais ajustam priorização adaptativa.");
  }
  if (!ADAPTIVE_SUBJECT_KINDS.includes(input.subjectKind)) {
    throw new ValidationError("subjectKind fora do conjunto suportado.", {
      field: "subjectKind",
    });
  }
  if (!isSupervisedTarget(input.nextState)) {
    throw new ValidationError(
      "Apenas estados supervisionados podem ser registrados (validated, supervised_adjustment).",
      { field: "nextState" },
    );
  }
  const adjId = normalizeAdjustmentId(input.adjustmentId.trim());
  if (!adjId.startsWith("adapt:")) {
    throw new ValidationError("adjustmentId inválido.", { field: "adjustmentId" });
  }

  const at = new Date().toISOString();
  const note = input.note?.trim() || null;

  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_memory",
    entity_id: adjId,
    event_type: "operational_learning_signal_captured",
    severity: "info",
    description: `${SUPERVISED_AUDIT_DESCRIPTION_PREFIX} ${input.nextState}`,
    metadata: {
      channel: SUPERVISED_AUDIT_CHANNEL,
      adjustment_id: adjId,
      subject_kind: input.subjectKind,
      next_state: input.nextState,
      note,
    },
  });

  return {
    state: input.nextState,
    at,
    actorProfileId: ctx.actorProfileId,
    note,
  };
}
