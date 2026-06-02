/**
 * Registro estático de como achados de policy intelligence alimentam
 * otimização futura de políticas e governança adaptativa (sem execução aqui).
 */
import type { OperationalPolicyFindingCode } from "./types";

export type AdaptiveGovernanceRegistryEntry = {
  findingCode: OperationalPolicyFindingCode;
  futurePipeline:
    | "supervised_policy_optimization"
    | "human_in_the_loop_tuning"
    | "orchestration_planner_assist";
  foundationNote: string;
};

export const ADAPTIVE_GOVERNANCE_REGISTRY: readonly AdaptiveGovernanceRegistryEntry[] = [
  {
    findingCode: "rollback_recurrence",
    futurePipeline: "supervised_policy_optimization",
    foundationNote:
      "Labels de penalidade fraca para rollbacks recorrentes — prepara reward shaping supervisionado.",
  },
  {
    findingCode: "ineffective_escalations",
    futurePipeline: "human_in_the_loop_tuning",
    foundationNote:
      "Dataset de escalações pouco úteis — calibra thresholds com revisão humana obrigatória.",
  },
  {
    findingCode: "orchestration_bottleneck",
    futurePipeline: "orchestration_planner_assist",
    foundationNote:
      "Features de bloqueio por passo — base para replanejamento assistido, não automático.",
  },
  {
    findingCode: "coordination_overload",
    futurePipeline: "human_in_the_loop_tuning",
    foundationNote:
      "Sinal de fan-out multi-agente — futura delegação contextual com teto de concorrência.",
  },
  {
    findingCode: "ineffective_thresholds",
    futurePipeline: "supervised_policy_optimization",
    foundationNote:
      "Mapa thresholds × outcomes — prepara busca supervisionada em espaço discreto de políticas.",
  },
  {
    findingCode: "adaptation_instability",
    futurePipeline: "supervised_policy_optimization",
    foundationNote:
      "Instabilidade sob boundaries atuais — ancora para congelamento e retomada gradual futura.",
  },
] as const;

export function registryEntriesForFindings(
  codes: Iterable<OperationalPolicyFindingCode>,
): AdaptiveGovernanceRegistryEntry[] {
  const set = new Set(codes);
  return ADAPTIVE_GOVERNANCE_REGISTRY.filter((e) => set.has(e.findingCode));
}
