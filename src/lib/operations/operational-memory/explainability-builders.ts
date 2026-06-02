import type { OperationalMemoryExplainability } from "@/lib/operations/operational-memory/types";

export function buildOperationalMemoryExplainability(input: {
  provenance: OperationalMemoryExplainability["provenance"];
  historicalReasoning: string[];
  effectivenessRationale: string[];
  references: OperationalMemoryExplainability["references"];
}): OperationalMemoryExplainability {
  return {
    provenance: input.provenance,
    historicalReasoning: input.historicalReasoning,
    effectivenessRationale: input.effectivenessRationale,
    references: input.references,
  };
}
