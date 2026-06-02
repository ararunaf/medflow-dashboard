import type { OperationalAgentType } from "@/lib/database.types";
import type { OperationalRecommendationTrigger } from "@/lib/operations/recommendations/types";
import {
  COORDINATION_OWNED_TRIGGERS,
  COVERAGE_OWNED_TRIGGERS,
  getOperationalAgentRegistryEntry,
  RECOMMENDATION_SYNTHESIS_TRIGGERS,
  RISK_OWNED_TRIGGERS,
} from "@/lib/operations/agents/registry";

/**
 * Garante que um trigger só é tratado como evidência primária do agente correto
 * (fronteira de domínio para reasoning escopado).
 */
export function triggerPrimaryAgent(
  trigger: OperationalRecommendationTrigger,
): OperationalAgentType | null {
  if ((COVERAGE_OWNED_TRIGGERS as readonly string[]).includes(trigger)) return "coverage_agent";
  if ((COORDINATION_OWNED_TRIGGERS as readonly string[]).includes(trigger))
    return "coordination_agent";
  if ((RISK_OWNED_TRIGGERS as readonly string[]).includes(trigger)) return "risk_agent";
  return null;
}

export function assertTriggerInAgentDomain(
  agent: OperationalAgentType,
  trigger: OperationalRecommendationTrigger,
): boolean {
  const entry = getOperationalAgentRegistryEntry(agent);
  if (agent === "recommendation_agent") {
    return (RECOMMENDATION_SYNTHESIS_TRIGGERS as readonly string[]).includes(trigger);
  }
  return (entry.ownedTriggers as readonly string[]).includes(trigger);
}
