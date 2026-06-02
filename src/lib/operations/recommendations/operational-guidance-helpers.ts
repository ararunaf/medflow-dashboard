import { OPERATIONAL_GUIDANCE_REGISTRY } from "@/lib/operations/recommendations/operational-guidance-registry";
import type { OperationalRecommendationTrigger } from "@/lib/operations/recommendations/types";

export function guidanceSummaryForTrigger(trigger: OperationalRecommendationTrigger): string {
  return OPERATIONAL_GUIDANCE_REGISTRY[trigger].summary;
}

export function guidanceHintsForTrigger(trigger: OperationalRecommendationTrigger): string[] {
  return [...OPERATIONAL_GUIDANCE_REGISTRY[trigger].coordinatorHints];
}
