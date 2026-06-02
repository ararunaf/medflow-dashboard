/**
 * Adapters da camada adaptativa para a camada de recomendações/orquestração:
 * - Aplica reordenação consciente de weighting ao bundle de recomendações
 *   sem alterar o estado semântico (suggested/recommended/urgent).
 * - Mantém-se dentro das adaptation boundaries (clamp + maxAdjustmentsPerCycle).
 */
import { OPERATIONAL_RECOMMENDATION_REGISTRY } from "@/lib/operations/recommendations/recommendation-registry";
import type {
  OperationalRecommendation,
  OperationalRecommendationBundle,
} from "@/lib/operations/recommendations/types";
import type { AdaptivePriorityAdjustment, AdaptiveWeightingProfile } from "./types";

const STATE_RANK = { suggested: 0, recommended: 1, urgent: 2 } as const;

export type AdaptiveRecommendationBundle = OperationalRecommendationBundle & {
  adaptive: {
    applied: boolean;
    adjustmentIds: string[];
  };
};

function adaptiveSortWeight(
  rec: OperationalRecommendation,
  profile: AdaptiveWeightingProfile,
): number {
  const base = OPERATIONAL_RECOMMENDATION_REGISTRY[rec.trigger].sortWeight;
  const factor = profile.byTrigger[rec.trigger]?.weight ?? 1;
  return base * factor;
}

/**
 * Reordena recomendações respeitando o estado primário (urgent/recommended/suggested)
 * e usando sortWeight adaptativo dentro do mesmo bucket. Não modifica `state`.
 */
export function applyAdaptiveOrderingToRecommendations(input: {
  bundle: OperationalRecommendationBundle;
  weighting: AdaptiveWeightingProfile;
  adjustments: AdaptivePriorityAdjustment[];
}): AdaptiveRecommendationBundle {
  const adjById = new Map<string, AdaptivePriorityAdjustment>();
  for (const a of input.adjustments) {
    if (a.subjectKind === "recommendation") adjById.set(a.subjectId, a);
  }

  const sorted = [...input.bundle.items].sort((a, b) => {
    const byState = STATE_RANK[b.state] - STATE_RANK[a.state];
    if (byState !== 0) return byState;
    const wa = adaptiveSortWeight(a, input.weighting);
    const wb = adaptiveSortWeight(b, input.weighting);
    if (wb !== wa) return wb - wa;
    // Empate: ajustes adaptativos sobem (nudge positivo).
    const na = adjById.get(a.id)?.nudge ?? 0;
    const nb = adjById.get(b.id)?.nudge ?? 0;
    if (nb !== na) return nb - na;
    return a.id.localeCompare(b.id, "pt-BR");
  });

  return {
    ...input.bundle,
    items: sorted,
    adaptive: {
      applied: input.adjustments.length > 0,
      adjustmentIds: input.adjustments.map((a) => a.id),
    },
  };
}
