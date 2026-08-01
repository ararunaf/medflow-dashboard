/**
 * ConfidenceLevel — enumeração estrutural (EPC-18 / FASE 8).
 *
 * Sem implementação. Sem ranking. Sem calibração.
 * Apenas catálogo tipado para o modelo canônico AuditExplanation.
 */

/** Nível de confiança estrutural da explicação. */
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" | "UNKNOWN";

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY_HIGH",
  "UNKNOWN",
] as const;

export type ConfidenceLevelDescriptor = {
  id: ConfidenceLevel;
  description: string;
  /** Fundação: nenhum nível é calibrado por modelo real. */
  calibratedInFoundation: boolean;
};

export const CONFIDENCE_LEVEL_CATALOG: readonly ConfidenceLevelDescriptor[] = [
  {
    id: "LOW",
    description: "Baixa confiança estrutural (sem calibração).",
    calibratedInFoundation: false,
  },
  {
    id: "MEDIUM",
    description: "Confiança média estrutural (sem calibração).",
    calibratedInFoundation: false,
  },
  {
    id: "HIGH",
    description: "Alta confiança estrutural (sem calibração).",
    calibratedInFoundation: false,
  },
  {
    id: "VERY_HIGH",
    description: "Confiança muito alta estrutural (sem calibração).",
    calibratedInFoundation: false,
  },
  {
    id: "UNKNOWN",
    description: "Confiança desconhecida / não informada.",
    calibratedInFoundation: false,
  },
] as const;

export function isKnownConfidenceLevel(value: string): value is ConfidenceLevel {
  return (CONFIDENCE_LEVELS as readonly string[]).includes(value);
}

export function getConfidenceLevel(id: ConfidenceLevel): ConfidenceLevelDescriptor | undefined {
  return CONFIDENCE_LEVEL_CATALOG.find((entry) => entry.id === id);
}

export function listConfidenceLevels(): readonly ConfidenceLevelDescriptor[] {
  return CONFIDENCE_LEVEL_CATALOG;
}
