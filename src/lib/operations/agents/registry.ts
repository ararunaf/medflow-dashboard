import type { OperationalAgentType } from "@/lib/database.types";
import type { OperationalRecommendationTrigger } from "@/lib/operations/recommendations/types";

export type OperationalAgentRegistryEntry = {
  type: OperationalAgentType;
  domainLabel: string;
  shortLabel: string;
  capabilities: readonly string[];
  scopes: readonly string[];
  policies: readonly string[];
  /** Triggers de recomendação de propriedade exclusiva deste agente (reduz overlap). */
  ownedTriggers: readonly OperationalRecommendationTrigger[];
};

export const COVERAGE_OWNED_TRIGGERS = [
  "coverage_low",
  "rising_unavailability",
] as const satisfies readonly OperationalRecommendationTrigger[];

export const COORDINATION_OWNED_TRIGGERS = [
  "critical_swaps",
  "operational_conflicts",
  "pending_assignments",
] as const satisfies readonly OperationalRecommendationTrigger[];

export const RISK_OWNED_TRIGGERS = [
  "rising_risk",
  "predicted_deterioration",
  "operational_pressure",
] as const satisfies readonly OperationalRecommendationTrigger[];

/** Agente de recomendação sintetiza mitigação / priorização sem disputar ownership de triggers. */
export const RECOMMENDATION_SYNTHESIS_TRIGGERS: readonly OperationalRecommendationTrigger[] = [
  "coverage_low",
  "rising_risk",
  "predicted_deterioration",
  "operational_pressure",
  "critical_swaps",
  "rising_unavailability",
  "pending_assignments",
  "operational_conflicts",
];

export const OPERATIONAL_AGENT_REGISTRY: readonly OperationalAgentRegistryEntry[] = [
  {
    type: "coverage_agent",
    domainLabel: "Cobertura e escalas",
    shortLabel: "Cobertura",
    capabilities: [
      "Analisar cobertura na janela",
      "Detectar lacunas de escalação",
      "Indisponibilidade e staffing gaps",
    ],
    scopes: ["coverage", "availability", "staffing_window", "shifts"],
    policies: [
      "agent.coverage.readonly",
      "agent.coverage.no_autonomous_execution",
      "agent.coverage.human_supervision_required",
    ],
    ownedTriggers: [...COVERAGE_OWNED_TRIGGERS],
  },
  {
    type: "coordination_agent",
    domainLabel: "Coordenação operacional",
    shortLabel: "Coordenação",
    capabilities: [
      "Filas de swaps e assignments",
      "Pressão de conflitos",
      "Encadeamento com orquestração supervisionada",
    ],
    scopes: ["swaps", "assignments", "conflicts", "coordination_pressure"],
    policies: [
      "agent.coordination.readonly",
      "agent.coordination.no_autonomous_execution",
      "agent.coordination.orchestration_adapter_only",
    ],
    ownedTriggers: [...COORDINATION_OWNED_TRIGGERS],
  },
  {
    type: "risk_agent",
    domainLabel: "Risco e deterioração",
    shortLabel: "Risco",
    capabilities: [
      "Scoring consolidado e notas de risco",
      "Projeção heurística (forecast baseline)",
      "Pressão operacional sintética",
    ],
    scopes: ["risk_scoring", "forecast", "pressure", "deterioration_signals"],
    policies: [
      "agent.risk.readonly",
      "agent.risk.no_autonomous_execution",
      "agent.risk.scoped_to_scoring_layer",
    ],
    ownedTriggers: [...RISK_OWNED_TRIGGERS],
  },
  {
    type: "recommendation_agent",
    domainLabel: "Recomendações e mitigação",
    shortLabel: "Recomendações",
    capabilities: [
      "Priorização de mitigação",
      "Planos de mitigação legíveis",
      "Guidance operacional (sem execução)",
    ],
    scopes: ["recommendations", "mitigation", "prioritization", "guidance"],
    policies: [
      "agent.recommendation.readonly",
      "agent.recommendation.no_autonomous_execution",
      "agent.recommendation.engine_output_only",
    ],
    ownedTriggers: [],
  },
] as const;

export function getOperationalAgentRegistryEntry(
  type: OperationalAgentType,
): OperationalAgentRegistryEntry {
  const e = OPERATIONAL_AGENT_REGISTRY.find((x) => x.type === type);
  if (!e) throw new Error(`Unknown operational agent: ${type}`);
  return e;
}
