/**
 * Canonical TISS models — G-01.
 *
 * Modelos estruturais e genéricos. Nenhum dado TISS específico é hardcoded.
 */

import type { CanonicalTissKnowledge } from "./types";

export function createCanonicalTissKnowledge(
  input: Partial<CanonicalTissKnowledge> & Pick<CanonicalTissKnowledge, "knowledgeId" | "name">,
): CanonicalTissKnowledge {
  return {
    kind: "tiss-knowledge",
    knowledgeId: input.knowledgeId,
    name: input.name,
    description: input.description ?? "",
    version: input.version ?? "",
    tags: input.tags ?? [],
  };
}
