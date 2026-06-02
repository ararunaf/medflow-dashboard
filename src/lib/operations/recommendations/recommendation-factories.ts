import { buildMitigationPlanForTrigger } from "@/lib/operations/recommendations/mitigation-helpers";
import { OPERATIONAL_RECOMMENDATION_REGISTRY } from "@/lib/operations/recommendations/recommendation-registry";
import { guidanceSummaryForTrigger } from "@/lib/operations/recommendations/operational-guidance-helpers";
import type { OperationalAlertRuleId } from "@/lib/operations/alerts/types";
import type { OperationalScoreId } from "@/lib/operations/scoring/types";
import type {
  OperationalForecastProjection,
  OperationalRecommendation,
  OperationalRecommendationState,
  OperationalRecommendationTrigger,
  OperationalRecommendationType,
} from "@/lib/operations/recommendations/types";

export type RecommendationBasisTag = "live" | "period";

export function stateFromWorseningScore(
  score: number,
  soft: number,
  hard: number,
): OperationalRecommendationState {
  if (score >= hard) return "urgent";
  if (score >= soft) return "recommended";
  return "suggested";
}

export function stateFromImprovingScore(
  score: number,
  soft: number,
  hard: number,
): OperationalRecommendationState {
  /** Para métricas “maior é melhor” (ex.: estabilidade). */
  if (score <= hard) return "urgent";
  if (score <= soft) return "recommended";
  return "suggested";
}

export function createOperationalRecommendation(input: {
  basis: RecommendationBasisTag;
  trigger: OperationalRecommendationTrigger;
  type: OperationalRecommendationType;
  state: OperationalRecommendationState;
  title?: string;
  body: string;
  because: string[];
  linkedAlertIds?: OperationalAlertRuleId[];
  linkedScoreIds?: OperationalScoreId[];
  forecastProjection?: OperationalForecastProjection;
  includeMitigationPlan?: boolean;
}): OperationalRecommendation {
  const reg = OPERATIONAL_RECOMMENDATION_REGISTRY[input.trigger];
  const title = input.title ?? reg.defaultTitle;
  const mitigationPlan =
    input.includeMitigationPlan || input.type === "mitigation"
      ? buildMitigationPlanForTrigger(input.trigger)
      : undefined;

  return {
    id: `rec:${input.basis}:${input.trigger}`,
    trigger: input.trigger,
    type: input.type,
    state: input.state,
    title,
    body: input.body,
    because: input.because,
    linkedAlertIds: input.linkedAlertIds?.length ? input.linkedAlertIds : undefined,
    linkedScoreIds: input.linkedScoreIds?.length ? input.linkedScoreIds : undefined,
    forecastProjection: input.forecastProjection,
    mitigationPlan,
  };
}

export function defaultGuidanceBody(trigger: OperationalRecommendationTrigger): string {
  return guidanceSummaryForTrigger(trigger);
}
