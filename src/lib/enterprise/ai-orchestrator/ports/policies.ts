/**
 * Políticas de seleção do AI Orchestrator — EPC-16.
 *
 * Somente enumeração estrutural. Sem algoritmos de custo, ranking ou ML.
 * A fundação resolve de forma determinística (FIRST_AVAILABLE).
 * Políticas restantes são declarativas para sprints futuras.
 */

/** Política de seleção estrutural (sem implementação de ranking). */
export type AISelectionPolicy =
  | "FIRST_AVAILABLE"
  | "HIGHEST_PRIORITY"
  | "BEST_CAPABILITIES"
  | "LOWEST_COST"
  | "CUSTOM";

export const AI_SELECTION_POLICIES: readonly AISelectionPolicy[] = [
  "FIRST_AVAILABLE",
  "HIGHEST_PRIORITY",
  "BEST_CAPABILITIES",
  "LOWEST_COST",
  "CUSTOM",
] as const;

export type AISelectionPolicyDescriptor = {
  id: AISelectionPolicy;
  name: string;
  description: string;
  /** Nesta sprint: apenas FIRST_AVAILABLE é aplicada de forma determinística. */
  implementedInFoundation: boolean;
};

export const AI_SELECTION_POLICY_CATALOG: readonly AISelectionPolicyDescriptor[] = [
  {
    id: "FIRST_AVAILABLE",
    name: "First Available",
    description:
      "Seleciona o primeiro Provider disponível no Registry (preferred → fallback → ready).",
    implementedInFoundation: true,
  },
  {
    id: "HIGHEST_PRIORITY",
    name: "Highest Priority",
    description: "Seleção futura por prioridade declarada — estrutural nesta sprint.",
    implementedInFoundation: false,
  },
  {
    id: "BEST_CAPABILITIES",
    name: "Best Capabilities",
    description: "Seleção futura por melhor cobertura de capabilities — estrutural nesta sprint.",
    implementedInFoundation: false,
  },
  {
    id: "LOWEST_COST",
    name: "Lowest Cost",
    description: "Seleção futura por menor custo — estrutural nesta sprint (sem pricing).",
    implementedInFoundation: false,
  },
  {
    id: "CUSTOM",
    name: "Custom",
    description: "Política customizada futura — estrutural nesta sprint.",
    implementedInFoundation: false,
  },
] as const;

export function isKnownSelectionPolicy(id: string): id is AISelectionPolicy {
  return (AI_SELECTION_POLICIES as readonly string[]).includes(id);
}

export function getSelectionPolicy(id: AISelectionPolicy): AISelectionPolicyDescriptor | undefined {
  return AI_SELECTION_POLICY_CATALOG.find((entry) => entry.id === id);
}

export function listSelectionPolicies(): readonly AISelectionPolicyDescriptor[] {
  return AI_SELECTION_POLICY_CATALOG;
}
