import type { OperationalAgentType } from "@/lib/database.types";

/** Prioridade explícita para arbitragem entre agentes (maior índice = mais prioritário na resolução). */
export const DOMAIN_ARBITRATION_PRIORITY: Record<OperationalAgentType, number> = {
  risk_agent: 4,
  coverage_agent: 3,
  coordination_agent: 2,
  recommendation_agent: 1,
};

export const COORDINATION_POLICY_IDS = {
  noAutonomousExecution: "coordination.policy.no_autonomous_execution",
  humanSupervisedCycles: "coordination.policy.human_supervised_cycles",
  singlePassNoAgentLoops: "coordination.policy.single_pass_no_agent_loops",
  orchestrationSafe: "coordination.policy.orchestration_safe_readonly",
  domainGovernance: "coordination.policy.domain_governance_arbitration",
} as const;

export function pickArbitrationWinner(claimants: OperationalAgentType[]): OperationalAgentType {
  let best = claimants[0]!;
  let bestScore = DOMAIN_ARBITRATION_PRIORITY[best] ?? 0;
  for (const c of claimants.slice(1)) {
    const s = DOMAIN_ARBITRATION_PRIORITY[c] ?? 0;
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}
