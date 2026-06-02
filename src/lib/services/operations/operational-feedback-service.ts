import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { isOperationalManager } from "@/lib/auth/rbac";
import type { OperationalRecommendationFeedbackType } from "@/lib/database.types";
import {
  adaptLatestOperationalRecommendationFeedbackRows,
  adaptOperationalRecommendationFeedbackRollups,
  buildAcceptanceTrendFromDaily,
  buildCoordinatorFeedbackSummaries,
  buildOperationalLearningSignals,
  buildRecommendationFeedbackHintsById,
  evaluateRecommendationEffectiveness,
} from "@/lib/operations/feedback";
import type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import { tryRecordRecommendationOutcomeMemory } from "@/lib/services/operations/operational-memory-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

const FEEDBACK_WINDOW_DAYS = 14;

function windowRange(): { fromISO: string; toISO: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - FEEDBACK_WINDOW_DAYS);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

export function emptyOperationalRecommendationFeedbackOverlay(): OperationalRecommendationFeedbackOverlay {
  const { fromISO, toISO } = windowRange();
  const rollups = adaptOperationalRecommendationFeedbackRollups(null);
  const effectiveness = evaluateRecommendationEffectiveness(rollups);
  return {
    window: { fromISO, toISO },
    rollups,
    effectiveness,
    coordinatorSummaries: [],
    acceptanceTrend: [],
    learningSignals: [],
    byRecommendationId: {},
  };
}

export async function loadOperationalRecommendationFeedbackOverlay(
  ctx: ServiceCtx,
  recommendationIds: readonly string[],
): Promise<OperationalRecommendationFeedbackOverlay> {
  try {
    const { fromISO, toISO } = windowRange();

    const rollupsP = ctx.client.rpc("get_operational_recommendation_feedback_rollups", {
      p_from: fromISO,
      p_to: toISO,
    });

    const latestP = ctx.client.rpc("get_latest_operational_recommendation_feedback_for_ids", {
      p_ids: [...recommendationIds],
    });

    const [rollRes, latestRes] = await Promise.all([rollupsP, latestP]);
    if (rollRes.error) throw mapPostgresError(rollRes.error);
    if (latestRes.error) throw mapPostgresError(latestRes.error);

    const rollups = adaptOperationalRecommendationFeedbackRollups(rollRes.data);
    const latest = adaptLatestOperationalRecommendationFeedbackRows(latestRes.data);
    const effectiveness = evaluateRecommendationEffectiveness(rollups);
    const coordinatorSummaries = buildCoordinatorFeedbackSummaries(rollups);
    const acceptanceTrend = buildAcceptanceTrendFromDaily(rollups);
    const learningSignals = buildOperationalLearningSignals({ effectiveness, acceptanceTrend });
    const byRecommendationId = buildRecommendationFeedbackHintsById({
      recommendationIds,
      latest,
      rollups,
    });

    return {
      window: { fromISO, toISO },
      rollups,
      effectiveness,
      coordinatorSummaries,
      acceptanceTrend,
      learningSignals,
      byRecommendationId,
    };
  } catch (err) {
    console.warn("[operational_feedback] overlay indisponível — usando vazio.", err);
    return emptyOperationalRecommendationFeedbackOverlay();
  }
}

export type SubmitOperationalRecommendationFeedbackInput = {
  recommendationId: string;
  feedbackType: OperationalRecommendationFeedbackType;
  effectivenessScore?: number | null;
  notes?: string | null;
};

export async function submitOperationalRecommendationFeedback(
  ctx: ServiceCtx,
  input: SubmitOperationalRecommendationFeedbackInput,
): Promise<{ id: string }> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenação / admin registra feedback de recomendações.", {
      role: ctx.role,
    });
  }

  const insertRow = {
    tenant_id: ctx.tenantId,
    recommendation_id: input.recommendationId,
    actor_profile_id: ctx.actorProfileId,
    feedback_type: input.feedbackType,
    effectiveness_score: input.effectivenessScore == null ? null : String(input.effectivenessScore),
    notes: input.notes?.trim() ? input.notes.trim() : null,
  };

  const { data, error } = await ctx.client
    .from("operational_recommendation_feedback")
    .insert(insertRow)
    .select("id")
    .single();

  if (error) throw mapPostgresError(error);
  const id = data?.id;
  if (!id) throw new ValidationError("Resposta de insert sem id.");

  void tryRecordRecommendationOutcomeMemory(ctx, {
    recommendationId: input.recommendationId,
    feedbackType: input.feedbackType,
    feedbackRowId: id,
    effectivenessScore: input.effectivenessScore ?? null,
    notes: input.notes ?? null,
  });

  const desc = `Feedback de recomendação: ${input.feedbackType} · ${input.recommendationId}`;
  await recordOperationalEventSafe(ctx, {
    entity_type: "coordinator_action",
    entity_id: input.recommendationId,
    event_type: "operational_action_triggered",
    severity: "info",
    description: desc.slice(0, 500),
    metadata: {
      kind: "recommendation_feedback",
      recommendation_id: input.recommendationId,
      feedback_type: input.feedbackType,
      effectiveness_score: input.effectivenessScore ?? null,
      notes: input.notes ?? null,
    },
  });

  return { id };
}
