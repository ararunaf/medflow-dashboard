/**
 * Canonical TISS models — G-01.
 *
 * Modelos estruturais e genéricos. Nenhum dado TISS específico é hardcoded.
 */

import type { CanonicalTissKnowledge, CanonicalTissLayout, CanonicalTissParser } from "./types";

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

export function createCanonicalTissParser(
  input: Partial<CanonicalTissParser> &
    Pick<CanonicalTissParser, "parserId" | "name" | "knowledgeId" | "layoutId">,
): CanonicalTissParser {
  return {
    kind: "tiss-parser",
    parserId: input.parserId,
    name: input.name,
    knowledgeId: input.knowledgeId,
    layoutId: input.layoutId,
    description: input.description ?? "",
    version: input.version ?? "",
    tags: input.tags ?? [],
  };
}

export function createCanonicalTissLayout(
  input: Partial<CanonicalTissLayout> &
    Pick<CanonicalTissLayout, "layoutId" | "name" | "knowledgeId">,
): CanonicalTissLayout {
  return {
    kind: "tiss-layout",
    layoutId: input.layoutId,
    name: input.name,
    knowledgeId: input.knowledgeId,
    description: input.description ?? "",
    version: input.version ?? "",
    tags: input.tags ?? [],
  };
}
