import type { OperationalMemoryKind } from "@/lib/database.types";

export type OperationalLearningPipeline =
  | "supervised_baseline"
  | "future_adaptive_prioritization"
  | "future_ml_features"
  | "future_rl_reward_shaping";

export type OperationalMemoryRegistryEntry = {
  kind: OperationalMemoryKind;
  pipeline: OperationalLearningPipeline;
  description: string;
};

/**
 * Registro canônico de como cada tipo de memória alimenta pipelines futuros
 * (priorização adaptativa, features ML, reforço) sem executá-los na aplicação.
 */
export const OPERATIONAL_LEARNING_REGISTRY: readonly OperationalMemoryRegistryEntry[] = [
  {
    kind: "recommendation_outcome",
    pipeline: "supervised_baseline",
    description: "Taxa de aceitação/execução humana — base para reward shaping futuro.",
  },
  {
    kind: "mitigation_effectiveness",
    pipeline: "future_adaptive_prioritization",
    description: "Mitigações aplicadas com outcome explícito — priorização contextual futura.",
  },
  {
    kind: "execution_outcome",
    pipeline: "supervised_baseline",
    description: "Passos de mutação supervisionada — telemetria de políticas e impacto.",
  },
  {
    kind: "rollback_signal",
    pipeline: "future_rl_reward_shaping",
    description: "Frequência e contexto de rollback — penalidade / guard-rail futuro.",
  },
  {
    kind: "deterioration_pattern",
    pipeline: "future_ml_features",
    description: "Padrões de piora operacional — features tabulares leves.",
  },
  {
    kind: "coordination_effectiveness",
    pipeline: "future_adaptive_prioritization",
    description: "Eficácia de ciclos multi-agente — roteamento e delegação futuros.",
  },
  {
    kind: "orchestration_effectiveness",
    pipeline: "future_adaptive_prioritization",
    description: "DAG supervisionado — planejamento assistido e checkpoints futuros.",
  },
  {
    kind: "proposal_outcome",
    pipeline: "supervised_baseline",
    description: "Propostas com outcome — dataset de decisão humana.",
  },
  {
    kind: "forecast_accuracy_snapshot",
    pipeline: "future_ml_features",
    description: "Alinhamento projeção × estado observado — label fraco para série temporal.",
  },
] as const;

export function learningRegistryEntryForKind(
  kind: OperationalMemoryKind,
): OperationalMemoryRegistryEntry | undefined {
  return OPERATIONAL_LEARNING_REGISTRY.find((e) => e.kind === kind);
}
