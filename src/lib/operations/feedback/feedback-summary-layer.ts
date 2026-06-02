import type { OperationalRecommendation } from "@/lib/operations/recommendations/types";
import type {
  OperationalRecommendationFeedbackRollupPayload,
  RecommendationItemFeedbackHints,
  RecommendationLatestFeedbackRow,
} from "@/lib/operations/feedback/types";

function triggerFromRecommendationId(id: string): string {
  const m = /^rec:[^:]+:(.+)$/.exec(id);
  return m?.[1] ?? "unknown";
}

function triggerAcceptanceRate(
  rollups: OperationalRecommendationFeedbackRollupPayload,
  triggerKey: string,
): number | null {
  let pos = 0;
  let neg = 0;
  for (const row of rollups.byTriggerType) {
    if (row.trigger_key !== triggerKey) continue;
    if (row.feedback_type === "accepted" || row.feedback_type === "executed") pos += row.c;
    if (row.feedback_type === "dismissed" || row.feedback_type === "ignored") neg += row.c;
  }
  const d = pos + neg;
  return d > 0 ? pos / d : null;
}

export function buildRecommendationFeedbackHintsById(input: {
  recommendationIds: readonly string[];
  latest: readonly RecommendationLatestFeedbackRow[];
  rollups: OperationalRecommendationFeedbackRollupPayload;
}): Record<string, RecommendationItemFeedbackHints> {
  const latestById = new Map<string, RecommendationLatestFeedbackRow>();
  for (const row of input.latest) {
    latestById.set(row.recommendation_id, row);
  }
  const out: Record<string, RecommendationItemFeedbackHints> = {};
  for (const id of input.recommendationIds) {
    const row = latestById.get(id);
    const tk = triggerFromRecommendationId(id);
    const ar = triggerAcceptanceRate(input.rollups, tk);

    let confidenceLabel = "Sem histórico de feedback nesta janela.";
    if (ar != null) {
      if (ar >= 0.65)
        confidenceLabel = "Histórico recente: alinhamento alto para gatilhos similares.";
      else if (ar >= 0.4)
        confidenceLabel = "Histórico recente: alinhamento moderado — revisar contexto.";
      else confidenceLabel = "Histórico recente: baixa adesão a gatilhos similares.";
    }

    out[id] = {
      lastFeedbackType: row?.feedback_type ?? null,
      lastFeedbackAt: row?.created_at ?? null,
      lastEffectivenessScore: row?.effectiveness_score ?? null,
      confidenceLabel,
    };
  }
  return out;
}

export function recommendationIdsFromBundleItems(
  items: readonly OperationalRecommendation[],
): string[] {
  const ids = items.map((i) => i.id);
  return [...new Set(ids)];
}
