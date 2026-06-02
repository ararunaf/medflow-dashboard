import type { OperationalAgentType } from "@/lib/database.types";
import type { OperationalAgentReasoningSurface } from "@/lib/operations/agents/contracts";
import { triggerPrimaryAgent } from "@/lib/operations/agents/governance";
import type { OperationalRecommendation } from "@/lib/operations/recommendations/types";
import {
  COORDINATION_POLICY_IDS,
  pickArbitrationWinner,
} from "@/lib/operations/agents/coordination/policies";
import type { OperationalCoordinationConflictResolution } from "@/lib/operations/agents/coordination/types";

function recommendationClaimants(
  surfaces: OperationalAgentReasoningSurface[],
  recId: string,
): OperationalAgentType[] {
  const out: OperationalAgentType[] = [];
  for (const s of surfaces) {
    const hit = s.refs.some((r) => r.kind === "recommendation" && r.recommendationId === recId);
    if (hit) out.push(s.agentType);
  }
  return out;
}

/**
 * Detecta sobreposição de recomendações entre agentes e arbitra por prioridade de domínio,
 * alinhado ao dono semântico do trigger quando disponível.
 */
export function resolveCrossAgentRecommendationConflicts(input: {
  surfaces: OperationalAgentReasoningSurface[];
  recommendations: OperationalRecommendation[];
}): OperationalCoordinationConflictResolution[] {
  const byId = new Map(input.recommendations.map((r) => [r.id, r]));
  const ids = new Set<string>();
  for (const s of input.surfaces) {
    for (const r of s.refs) {
      if (r.kind === "recommendation") ids.add(r.recommendationId);
    }
  }

  const resolutions: OperationalCoordinationConflictResolution[] = [];
  for (const recId of ids) {
    const claimants = recommendationClaimants(input.surfaces, recId);
    if (claimants.length < 2) continue;
    const rec = byId.get(recId);
    const primaryOwner = rec ? triggerPrimaryAgent(rec.trigger) : null;
    const winner =
      primaryOwner && claimants.includes(primaryOwner)
        ? primaryOwner
        : pickArbitrationWinner(claimants);
    const title = rec?.title ?? recId;
    resolutions.push({
      recommendationId: recId,
      title,
      claimants,
      primaryOwner,
      winner,
      policyId: COORDINATION_POLICY_IDS.domainGovernance,
      rationale:
        primaryOwner && claimants.includes(primaryOwner)
          ? `Dono primário do trigger alinha com ${primaryOwner}; demais agentes mantêm visibilidade read-only.`
          : `Arbitragem por prioridade de domínio (${COORDINATION_POLICY_IDS.domainGovernance}); vencedor: ${winner}.`,
    });
  }
  return resolutions;
}
