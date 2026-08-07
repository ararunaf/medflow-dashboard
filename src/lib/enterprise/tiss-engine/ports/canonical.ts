/**
 * Canonical TISS models — G-01.
 *
 * Modelos estruturais e genéricos. Nenhum dado TISS específico é hardcoded.
 */

import type {
  CanonicalTissBusinessValidation,
  CanonicalTissKnowledge,
  CanonicalTissLayout,
  CanonicalTissParser,
  CanonicalTissSchemaValidation,
  CanonicalTissSerializer,
} from "./types";

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

export function createCanonicalTissSerializer(
  input: Partial<CanonicalTissSerializer> &
    Pick<
      CanonicalTissSerializer,
      "serializerId" | "name" | "knowledgeId" | "layoutId" | "parserId"
    >,
): CanonicalTissSerializer {
  return {
    kind: "tiss-serializer",
    serializerId: input.serializerId,
    name: input.name,
    knowledgeId: input.knowledgeId,
    layoutId: input.layoutId,
    parserId: input.parserId,
    description: input.description ?? "",
    version: input.version ?? "",
    tags: input.tags ?? [],
  };
}

export function createCanonicalTissSchemaValidation(
  input: Partial<CanonicalTissSchemaValidation> &
    Pick<
      CanonicalTissSchemaValidation,
      "schemaValidationId" | "name" | "knowledgeId" | "layoutId" | "parserId" | "serializerId"
    >,
): CanonicalTissSchemaValidation {
  return {
    kind: "tiss-schema-validation",
    schemaValidationId: input.schemaValidationId,
    name: input.name,
    knowledgeId: input.knowledgeId,
    layoutId: input.layoutId,
    parserId: input.parserId,
    serializerId: input.serializerId,
    description: input.description ?? "",
    version: input.version ?? "",
    tags: input.tags ?? [],
  };
}

export function createCanonicalTissBusinessValidation(
  input: Partial<CanonicalTissBusinessValidation> &
    Pick<
      CanonicalTissBusinessValidation,
      | "businessValidationId"
      | "name"
      | "knowledgeId"
      | "layoutId"
      | "parserId"
      | "serializerId"
      | "schemaValidationId"
      | "rule"
    >,
): CanonicalTissBusinessValidation {
  return {
    kind: "tiss-business-validation",
    businessValidationId: input.businessValidationId,
    name: input.name,
    knowledgeId: input.knowledgeId,
    layoutId: input.layoutId,
    parserId: input.parserId,
    serializerId: input.serializerId,
    schemaValidationId: input.schemaValidationId,
    rule: input.rule,
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
