import type { Database, Json, JsonObject } from "@/lib/database.types";
import type { OperationalMutationExecutionState } from "@/lib/database.types";
import type { OperationalRecommendationFeedbackType } from "@/lib/database.types";
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
import { buildOperationalMemoryExplainability } from "@/lib/operations/operational-memory/explainability-builders";
import { buildOperationalMemoryLayerSummary } from "@/lib/operations/operational-memory/effectiveness-engine";
import {
  forecastAlignmentSignal,
  learningSignalsFromExecutionState,
  learningSignalsFromFeedback,
  memoryStateForRecommendationFeedback,
} from "@/lib/operations/operational-memory/historical-adapters";
import type {
  OperationalMemoryExplainability,
  OperationalMemoryInsight,
  OperationalMemoryKind,
  OperationalMemoryLayerSummary,
  OperationalMemoryLearningSignals,
  OperationalMemoryState,
  OperationalMemorySubjectKind,
} from "@/lib/operations/operational-memory/types";
import type { OperationalForecastProjection } from "@/lib/operations/recommendations/types";
import type { OperationalHealthState } from "@/lib/operations/scoring/types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

type MemoryRow = Database["public"]["Tables"]["operational_memory_entries"]["Row"];
type MemoryInsert = Database["public"]["Tables"]["operational_memory_entries"]["Insert"];

function asExplain(v: unknown): OperationalMemoryExplainability {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    return { provenance: [], historicalReasoning: [], effectivenessRationale: [], references: [] };
  }
  const o = v as Record<string, unknown>;
  const provenance = Array.isArray(o.provenance)
    ? (o.provenance as OperationalMemoryExplainability["provenance"])
    : [];
  const historicalReasoning = Array.isArray(o.historicalReasoning)
    ? (o.historicalReasoning as string[])
    : [];
  const effectivenessRationale = Array.isArray(o.effectivenessRationale)
    ? (o.effectivenessRationale as string[])
    : [];
  const references = Array.isArray(o.references)
    ? (o.references as OperationalMemoryExplainability["references"])
    : [];
  return { provenance, historicalReasoning, effectivenessRationale, references };
}

function asLearningSignals(v: unknown): OperationalMemoryLearningSignals {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v as OperationalMemoryLearningSignals;
}

function asRefs(v: unknown): JsonObject {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v as JsonObject;
}

function rowToInsight(row: MemoryRow): OperationalMemoryInsight {
  const eff = row.effectiveness_score;
  const effectivenessScore =
    eff == null || eff === "" ? null : Math.min(1, Math.max(0, Number.parseFloat(String(eff))));
  return {
    id: row.id,
    memoryKind: row.memory_kind as OperationalMemoryKind,
    memoryState: row.memory_state as OperationalMemoryState,
    subjectKind: row.subject_kind as OperationalMemorySubjectKind,
    subjectId: row.subject_id,
    outcomeNarrative: row.outcome_narrative,
    effectivenessScore: Number.isFinite(effectivenessScore ?? NaN) ? effectivenessScore : null,
    learningSignals: asLearningSignals(row.learning_signals_json),
    explainability: asExplain(row.explainability_json),
    references: asRefs(row.references_json),
    createdAt: row.created_at,
  };
}

async function insertOperationalMemoryEntry(
  ctx: ServiceCtx,
  body: Omit<MemoryInsert, "tenant_id" | "actor_profile_id">,
): Promise<string> {
  const insert: MemoryInsert = {
    ...body,
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
  };
  const { data, error } = await ctx.client
    .from("operational_memory_entries")
    .insert(insert)
    .select("id")
    .single();
  if (error) throw mapPostgresError(error);
  const id = data?.id;
  if (!id) throw new ValidationError("Falha ao registrar memória operacional.");
  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_memory",
    entity_id: id,
    event_type: "operational_memory_recorded",
    severity: "info",
    description: `Memória operacional · ${body.memory_kind} · ${body.subject_kind}:${body.subject_id.slice(0, 36)}`,
    metadata: {
      memory_entry_id: id,
      memory_kind: body.memory_kind,
      memory_state: body.memory_state,
      subject_kind: body.subject_kind,
      subject_id: body.subject_id,
      learning_signals: body.learning_signals_json,
    },
  });
  return id;
}

export async function tryRecordRecommendationOutcomeMemory(
  ctx: ServiceCtx,
  input: {
    recommendationId: string;
    feedbackType: OperationalRecommendationFeedbackType;
    feedbackRowId: string;
    effectivenessScore?: number | null;
    notes?: string | null;
  },
): Promise<void> {
  try {
    const score =
      input.effectivenessScore != null && Number.isFinite(input.effectivenessScore)
        ? Math.min(1, Math.max(0, input.effectivenessScore))
        : null;
    const ls = learningSignalsFromFeedback(input.feedbackType);
    const explain = buildOperationalMemoryExplainability({
      provenance: [
        { source: "operational_recommendation_feedback", ref: input.feedbackRowId },
        { source: "coordinator_human", ref: ctx.actorProfileId },
      ],
      historicalReasoning: [
        `Feedback humano registrado como ${input.feedbackType} para a recomendação ${input.recommendationId}.`,
      ],
      effectivenessRationale: [
        score != null
          ? `Nota explícita de effectiveness humana: ${score.toFixed(3)}.`
          : "Sem nota numérica — effectiveness inferida apenas pelo tipo de feedback.",
      ],
      references: [{ kind: "recommendation", id: input.recommendationId }],
    });
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "recommendation_outcome",
      memory_state: memoryStateForRecommendationFeedback(input.feedbackType),
      subject_kind: "recommendation",
      subject_id: input.recommendationId,
      correlation_id: null,
      effectiveness_score: score != null ? String(score) : null,
      learning_signals_json: ls as unknown as Json,
      explainability_json: explain as unknown as Json,
      references_json: {
        recommendation_id: input.recommendationId,
        feedback_row_id: input.feedbackRowId,
        notes: input.notes ?? null,
      } as unknown as Json,
      outcome_narrative: `Outcome de recomendação supervisionada: ${input.feedbackType}.`,
      metadata: { channel: "recommendation_feedback" } as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] recommendation_outcome", e);
  }
}

export async function tryRecordExecutionOutcomeMemory(
  ctx: ServiceCtx,
  input: {
    proposalId: string;
    executionId: string;
    state: OperationalMutationExecutionState;
    proposalTitle: string;
    actionKind: string;
    appliedSteps: number;
    orchestrationId?: string | null;
  },
): Promise<void> {
  try {
    const ls = learningSignalsFromExecutionState(input.state);
    const eff =
      input.state === "executed"
        ? Math.min(1, 0.65 + Math.min(0.3, input.appliedSteps * 0.04))
        : input.state === "rolled_back"
          ? 0.25
          : input.state === "failed"
            ? 0.12
            : null;
    const explain = buildOperationalMemoryExplainability({
      provenance: [
        { source: "operational_mutation_executions", ref: input.executionId },
        { source: "operational_action_proposal", ref: input.proposalId },
      ],
      historicalReasoning: [
        `Execução supervisionada finalizada como ${input.state} (${input.appliedSteps} passo(s) aplicados).`,
      ],
      effectivenessRationale: [
        eff != null
          ? `Effectiveness heurística ${(eff * 100).toFixed(0)}% derivada do estado e volume de passos.`
          : "Estado intermediário — sem effectiveness consolidada.",
      ],
      references: [
        { kind: "proposal", id: input.proposalId },
        { kind: "mutation_execution", id: input.executionId },
      ],
    });
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "execution_outcome",
      memory_state: input.state === "executed" ? "tracked" : "observed",
      subject_kind: "mutation_execution",
      subject_id: input.executionId,
      correlation_id: input.orchestrationId ?? null,
      effectiveness_score: eff != null ? String(eff) : null,
      learning_signals_json: ls as unknown as Json,
      explainability_json: explain as unknown as Json,
      references_json: {
        proposal_id: input.proposalId,
        orchestration_id: input.orchestrationId ?? null,
        proposal_title: input.proposalTitle,
      } as unknown as Json,
      outcome_narrative: `Impacto de execução supervisionada · ${input.proposalTitle.slice(0, 140)}`,
      metadata: { action_kind: input.actionKind } as unknown as Json,
    });

    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "proposal_outcome",
      memory_state: input.state === "executed" ? "tracked" : "observed",
      subject_kind: "proposal",
      subject_id: input.proposalId,
      correlation_id: input.orchestrationId ?? null,
      effectiveness_score: eff != null ? String(eff) : null,
      learning_signals_json: ls as unknown as Json,
      explainability_json: explain as unknown as Json,
      references_json: { execution_id: input.executionId } as unknown as Json,
      outcome_narrative: `Outcome de proposta · estado de execução ${input.state}.`,
      metadata: { action_kind: input.actionKind } as unknown as Json,
    });

    if (input.actionKind === "mitigation") {
      await insertOperationalMemoryEntry(ctx, {
        memory_kind: "mitigation_effectiveness",
        memory_state: input.state === "executed" ? "tracked" : "observed",
        subject_kind: "proposal",
        subject_id: input.proposalId,
        correlation_id: input.orchestrationId ?? null,
        effectiveness_score: eff != null ? String(eff) : null,
        learning_signals_json: ls as unknown as Json,
        explainability_json: buildOperationalMemoryExplainability({
          provenance: [{ source: "mitigation_proposal", ref: input.proposalId }],
          historicalReasoning: [
            "Mitigação operacional com outcome ligado à execução supervisionada.",
          ],
          effectivenessRationale: [
            "Effectiveness reflete apenas estado da execução e políticas já avaliadas no sandbox.",
          ],
          references: [{ kind: "proposal", id: input.proposalId }],
        }) as unknown as Json,
        references_json: { execution_id: input.executionId } as unknown as Json,
        outcome_narrative: `Mitigação · ${input.proposalTitle.slice(0, 120)}`,
        metadata: {} as unknown as Json,
      });
    }
  } catch (e) {
    console.warn("[operational_memory] execution_outcome", e);
  }
}

export async function tryRecordRollbackSignalMemory(
  ctx: ServiceCtx,
  input: {
    proposalId: string;
    executionId: string;
    channel: "execution_failure" | "manual_rollback" | "orchestration_chain";
    detail: string;
    orchestrationId?: string | null;
  },
): Promise<void> {
  try {
    const explain = buildOperationalMemoryExplainability({
      provenance: [{ source: "rollback", ref: input.executionId }],
      historicalReasoning: [`Rollback supervisionado (${input.channel}).`],
      effectivenessRationale: [
        "Rollback aumenta pressão no sinal correlato — baseline para governança futura.",
      ],
      references: [
        { kind: "proposal", id: input.proposalId },
        { kind: "mutation_execution", id: input.executionId },
      ],
    });
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "rollback_signal",
      memory_state: "tracked",
      subject_kind: "mutation_execution",
      subject_id: input.executionId,
      correlation_id: input.orchestrationId ?? null,
      effectiveness_score: "0.2",
      learning_signals_json: { rollbackCorrelation: "strong" } as unknown as Json,
      explainability_json: explain as unknown as Json,
      references_json: { proposal_id: input.proposalId, channel: input.channel } as unknown as Json,
      outcome_narrative: input.detail.slice(0, 400),
      metadata: {} as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] rollback_signal", e);
  }
}

export async function tryRecordOrchestrationRollbackStepMemory(
  ctx: ServiceCtx,
  input: { orchestrationId: string; executionId: string },
): Promise<void> {
  try {
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "rollback_signal",
      memory_state: "tracked",
      subject_kind: "orchestration",
      subject_id: input.orchestrationId,
      correlation_id: input.orchestrationId,
      effectiveness_score: "0.25",
      learning_signals_json: { rollbackCorrelation: "strong" } as unknown as Json,
      explainability_json: buildOperationalMemoryExplainability({
        provenance: [{ source: "orchestration_rollback_step", ref: input.executionId }],
        historicalReasoning: ["Rollback encadeado supervisionado — liga execução à orquestração."],
        effectivenessRationale: ["Sinal para taxa de rollback por fluxo DAG (sem auto-execução)."],
        references: [
          { kind: "orchestration", id: input.orchestrationId },
          { kind: "mutation_execution", id: input.executionId },
        ],
      }) as unknown as Json,
      references_json: { execution_id: input.executionId } as unknown as Json,
      outcome_narrative: `Rollback encadeado na orquestração ${input.orchestrationId.slice(0, 8)}…`,
      metadata: {} as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] orchestration rollback step", e);
  }
}

export async function tryRecordOrchestrationStepExecutionMemory(
  ctx: ServiceCtx,
  input: {
    orchestrationId: string;
    proposalId: string;
    stepOrdinal: number;
    executionId: string;
    executionState: OperationalMutationExecutionState;
  },
): Promise<void> {
  try {
    const eff = input.executionState === "executed" ? 0.88 : 0.22;
    const explain = buildOperationalMemoryExplainability({
      provenance: [
        { source: "operational_orchestrations", ref: input.orchestrationId },
        { source: "orchestration_step", ref: String(input.stepOrdinal) },
      ],
      historicalReasoning: [
        `Passo supervisionado ${input.stepOrdinal} vinculado à execução ${input.executionId.slice(0, 8)}…`,
      ],
      effectivenessRationale: [
        "Mede aderência do DAG a execuções bem-sucedidas sob governança humana.",
      ],
      references: [
        { kind: "orchestration", id: input.orchestrationId },
        { kind: "proposal", id: input.proposalId },
      ],
    });
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "orchestration_effectiveness",
      memory_state: "tracked",
      subject_kind: "orchestration",
      subject_id: input.orchestrationId,
      correlation_id: input.orchestrationId,
      effectiveness_score: String(eff),
      learning_signals_json: {
        orchestrationTerminal: "blocked_step",
        stepOrdinal: input.stepOrdinal,
        executionState: input.executionState,
      } as unknown as Json,
      explainability_json: explain as unknown as Json,
      references_json: {
        proposal_id: input.proposalId,
        execution_id: input.executionId,
      } as unknown as Json,
      outcome_narrative: `Orquestração · execução ${input.executionState} no passo ${input.stepOrdinal}.`,
      metadata: {} as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] orchestration_effectiveness step", e);
  }
}

export async function tryRecordOrchestrationRollbackPreviewMemory(
  ctx: ServiceCtx,
  input: { orchestrationId: string; eligibleExecutions: number },
): Promise<void> {
  try {
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "rollback_signal",
      memory_state: "observed",
      subject_kind: "orchestration",
      subject_id: input.orchestrationId,
      correlation_id: input.orchestrationId,
      effectiveness_score: null,
      learning_signals_json: {
        orchestrationTerminal: "preview",
        eligibleExecutions: input.eligibleExecutions,
      } as unknown as Json,
      explainability_json: buildOperationalMemoryExplainability({
        provenance: [{ source: "orchestration_rollback_preview", ref: input.orchestrationId }],
        historicalReasoning: ["Preview de rollback encadeado sem aplicação automática."],
        effectivenessRationale: [
          "Registro para frequência de exploração de rollback (auditabilidade).",
        ],
        references: [{ kind: "orchestration", id: input.orchestrationId }],
      }) as unknown as Json,
      references_json: {} as unknown as Json,
      outcome_narrative: `Preview de rollback · ${input.eligibleExecutions} execução(ões) elegíveis.`,
      metadata: {} as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] rollback preview", e);
  }
}

export async function tryRecordOrchestrationTerminalMemory(
  ctx: ServiceCtx,
  input: { orchestrationId: string; terminal: "completed" | "rolled_back"; title: string },
): Promise<void> {
  try {
    const eff = input.terminal === "completed" ? 0.9 : 0.35;
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "orchestration_effectiveness",
      memory_state: "tracked",
      subject_kind: "orchestration",
      subject_id: input.orchestrationId,
      correlation_id: input.orchestrationId,
      effectiveness_score: String(eff),
      learning_signals_json: { orchestrationTerminal: input.terminal } as unknown as Json,
      explainability_json: buildOperationalMemoryExplainability({
        provenance: [{ source: "orchestration_lifecycle", ref: input.orchestrationId }],
        historicalReasoning: [
          input.terminal === "completed"
            ? "Fluxo DAG finalizado com sucesso supervisionado."
            : "Fluxo encerrado com rollback predominante — telemetria para governança.",
        ],
        effectivenessRationale: [
          input.terminal === "completed"
            ? "Alta effectiveness terminal quando não há pendências nem falhas."
            : "Effectiveness moderada-baixa refletindo desfazimento supervisionado.",
        ],
        references: [{ kind: "orchestration", id: input.orchestrationId }],
      }) as unknown as Json,
      references_json: { title: input.title } as unknown as Json,
      outcome_narrative: `Orquestração ${input.terminal}: ${input.title.slice(0, 160)}`,
      metadata: {} as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] orchestration terminal", e);
  }
}

export async function tryRecordCoordinationCycleMemory(
  ctx: ServiceCtx,
  input: {
    cycleId: string;
    correlationId: string;
    conflictCount: number;
    participantCount: number;
    orchestrationActiveCount: number;
  },
): Promise<void> {
  try {
    const friction = Math.min(1, input.conflictCount / Math.max(1, input.participantCount));
    const eff = Math.max(
      0.15,
      0.92 - friction * 0.45 - (input.orchestrationActiveCount > 2 ? 0.05 : 0),
    );
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "coordination_effectiveness",
      memory_state: "tracked",
      subject_kind: "coordination_cycle",
      subject_id: input.cycleId,
      correlation_id: input.correlationId,
      effectiveness_score: String(eff),
      learning_signals_json: { coordinationFriction: friction } as unknown as Json,
      explainability_json: buildOperationalMemoryExplainability({
        provenance: [{ source: "operational_agent_coordination_cycles", ref: input.cycleId }],
        historicalReasoning: [
          `Ciclo colaborativo com ${input.participantCount} agentes e ${input.conflictCount} conflitos resolvidos textualmente.`,
        ],
        effectivenessRationale: [
          "Effectiveness heurística inversamente proporcional à fricção de conflitos declarados.",
        ],
        references: [{ kind: "coordination_cycle", id: input.cycleId }],
      }) as unknown as Json,
      references_json: { correlation_id: input.correlationId } as unknown as Json,
      outcome_narrative: "Eficácia de coordenação multi-agente (supervisionada).",
      metadata: {} as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] coordination_effectiveness", e);
  }
}

export async function tryRecordDeteriorationPatternMemory(
  ctx: ServiceCtx,
  input: {
    projection: OperationalForecastProjection;
    healthState: OperationalHealthState;
    asOf: string;
  },
): Promise<void> {
  try {
    if (input.projection !== "deteriorating" && input.projection !== "critical_projection") return;
    const subjectId = `forecast:${input.asOf.slice(0, 13)}`;
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "deterioration_pattern",
      memory_state: "observed",
      subject_kind: "forecast_window",
      subject_id: subjectId,
      correlation_id: null,
      effectiveness_score: null,
      learning_signals_json: forecastAlignmentSignal({
        projection: input.projection,
        health: input.healthState,
      }) as unknown as Json,
      explainability_json: buildOperationalMemoryExplainability({
        provenance: [{ source: "operational_forecast_baseline", ref: input.projection }],
        historicalReasoning: [
          `Projeção ${input.projection} observada com health ${input.healthState} em ${input.asOf}.`,
        ],
        effectivenessRationale: [
          "Padrão de deterioração prospectivo — não dispara ação automática.",
        ],
        references: [{ kind: "forecast_window", id: subjectId }],
      }) as unknown as Json,
      references_json: { as_of: input.asOf } as unknown as Json,
      outcome_narrative: "Padrão prospectivo de deterioração operacional (baseline).",
      metadata: {} as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] deterioration_pattern", e);
  }
}

export async function tryRecordForecastAccuracySnapshotMemory(
  ctx: ServiceCtx,
  input: {
    projection: OperationalForecastProjection;
    healthState: OperationalHealthState;
    asOf: string;
  },
): Promise<void> {
  try {
    const ls = forecastAlignmentSignal({
      projection: input.projection,
      health: input.healthState,
    });
    const subjectId = `forecast-accuracy:${input.asOf.slice(0, 16)}`;
    const eff =
      ls.forecastDelta === "aligned" ? 0.85 : ls.forecastDelta === "unknown" ? null : 0.55;
    await insertOperationalMemoryEntry(ctx, {
      memory_kind: "forecast_accuracy_snapshot",
      memory_state: "observed",
      subject_kind: "forecast_window",
      subject_id: subjectId,
      correlation_id: null,
      effectiveness_score: eff != null ? String(eff) : null,
      learning_signals_json: ls as unknown as Json,
      explainability_json: buildOperationalMemoryExplainability({
        provenance: [{ source: "command_center_forecast", ref: input.projection }],
        historicalReasoning: [
          `Snapshot de alinhamento entre projeção (${input.projection}) e health (${input.healthState}) em ${input.asOf}.`,
        ],
        effectivenessRationale: [
          "Heurística supervisionada — não reprocessa séries longas; prepara labels fracos para ML futuro.",
        ],
        references: [{ kind: "forecast_window", id: subjectId }],
      }) as unknown as Json,
      references_json: { as_of: input.asOf } as unknown as Json,
      outcome_narrative: "Rastreio de accuracy de forecast (baseline supervisionada).",
      metadata: { channel: "coordination_cycle" } as unknown as Json,
    });
  } catch (e) {
    console.warn("[operational_memory] forecast_accuracy_snapshot", e);
  }
}

export async function loadOperationalMemoryLayerSummary(
  ctx: ServiceCtx,
  input: {
    recommendationFeedback: OperationalRecommendationFeedbackOverlay;
    forecastProjection?: OperationalForecastProjection;
    healthState?: OperationalHealthState;
    asOf: string;
  },
): Promise<OperationalMemoryLayerSummary> {
  const fromEmpty = new Date(input.asOf);
  fromEmpty.setUTCDate(fromEmpty.getUTCDate() - 14);
  const empty = buildOperationalMemoryLayerSummary({
    computedAt: input.asOf,
    windowFromISO: fromEmpty.toISOString(),
    recentInsights: [],
    recommendationFeedback: input.recommendationFeedback,
    forecastProbe:
      input.forecastProjection && input.healthState
        ? {
            projection: input.forecastProjection,
            healthState: input.healthState,
            alignmentNote:
              forecastAlignmentSignal({
                projection: input.forecastProjection,
                health: input.healthState,
              }).forecastDelta === "aligned"
                ? "Projeção e estado de saúde coerentes no recorte atual."
                : "Possível divergência entre projeção e estado — útil para labels fracos futuros.",
          }
        : undefined,
  });

  if (!isOperationalManager(ctx.role)) return empty;

  try {
    const from = new Date(input.asOf);
    from.setUTCDate(from.getUTCDate() - 14);
    const fromISO = from.toISOString();
    const { data, error } = await ctx.client
      .from("operational_memory_entries")
      .select(
        "id,memory_kind,memory_state,subject_kind,subject_id,outcome_narrative,effectiveness_score,learning_signals_json,explainability_json,references_json,created_at",
      )
      .eq("tenant_id", ctx.tenantId)
      .gte("created_at", fromISO)
      .order("created_at", { ascending: false })
      .limit(48);
    if (error) throw mapPostgresError(error);
    const rows = (data ?? []) as MemoryRow[];
    const recentInsights = rows.map(rowToInsight);
    return buildOperationalMemoryLayerSummary({
      computedAt: input.asOf,
      windowFromISO: fromISO,
      recentInsights,
      recommendationFeedback: input.recommendationFeedback,
      forecastProbe:
        input.forecastProjection && input.healthState
          ? {
              projection: input.forecastProjection,
              healthState: input.healthState,
              alignmentNote:
                forecastAlignmentSignal({
                  projection: input.forecastProjection,
                  health: input.healthState,
                }).forecastDelta === "aligned"
                  ? "Projeção e estado de saúde coerentes no recorte atual."
                  : "Possível divergência entre projeção e estado — útil para labels fracos futuros.",
            }
          : undefined,
    });
  } catch (e) {
    console.warn("[operational_memory] load summary", e);
    return empty;
  }
}

export type PatchOperationalMemoryStateInput = {
  memoryEntryId: string;
  nextState: OperationalMemoryState;
};

export async function patchOperationalMemoryState(
  ctx: ServiceCtx,
  input: PatchOperationalMemoryStateInput,
): Promise<void> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Somente gestores operacionais atualizam estados de memória.");
  }
  const id = expectUuid(input.memoryEntryId, "memoryEntryId");
  const now = new Date().toISOString();
  const patch: Database["public"]["Tables"]["operational_memory_entries"]["Update"] = {
    memory_state: input.nextState,
    updated_at: now,
  };
  if (input.nextState === "validated") patch.validated_at = now;
  if (input.nextState === "archived") patch.archived_at = now;

  const { error } = await ctx.client
    .from("operational_memory_entries")
    .update(patch)
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (error) throw mapPostgresError(error);

  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_memory",
    entity_id: id,
    event_type: "operational_memory_state_updated",
    severity: "info",
    description: `Estado de memória operacional atualizado para ${input.nextState}.`,
    metadata: { memory_entry_id: id, next_state: input.nextState },
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_memory",
    entity_id: id,
    event_type: "operational_learning_signal_captured",
    severity: "info",
    description: `Governança de aprendizado · transição para ${input.nextState}.`,
    metadata: {
      memory_entry_id: id,
      next_state: input.nextState,
      channel: "memory_state_governance",
    },
  });
}
