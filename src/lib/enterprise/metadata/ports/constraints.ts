/**
 * Constraints — infraestrutura preparatória (EPC-04 / FASE 8).
 *
 * Exemplos estruturais: Required | Unique | Regex | Range | Collection |
 * Reference | Expression.
 *
 * Ainda NÃO valida. Somente tipos, factories e inspeção.
 */
import type { MetadataConstraint, MetadataConstraintKind, MetadataReference } from "./types";

export const METADATA_CONSTRAINT_KINDS: readonly MetadataConstraintKind[] = [
  "required",
  "unique",
  "regex",
  "range",
  "collection",
  "reference",
  "expression",
] as const;

export function isKnownConstraintKind(kind: string): kind is MetadataConstraintKind {
  return (METADATA_CONSTRAINT_KINDS as readonly string[]).includes(kind);
}

/** Factory estrutural — sem evaluator. */
export function defineConstraint(input: {
  kind: MetadataConstraintKind;
  name?: string;
  id?: string;
  target?: MetadataReference;
  params?: Readonly<Record<string, unknown>>;
  description?: string;
  tags?: readonly string[];
}): MetadataConstraint {
  return {
    id: input.id,
    name: input.name,
    kind: input.kind,
    target: input.target,
    params: input.params,
    description: input.description,
    tags: input.tags,
  };
}

/** Atalhos estruturais (infra — sem execução). */
export function requiredConstraint(target?: MetadataReference): MetadataConstraint {
  return defineConstraint({ kind: "required", name: "required", target });
}

export function uniqueConstraint(target?: MetadataReference): MetadataConstraint {
  return defineConstraint({ kind: "unique", name: "unique", target });
}

export function regexConstraint(pattern: string, target?: MetadataReference): MetadataConstraint {
  return defineConstraint({
    kind: "regex",
    name: "regex",
    target,
    params: { pattern },
  });
}

export function rangeConstraint(
  min?: number,
  max?: number,
  target?: MetadataReference,
): MetadataConstraint {
  return defineConstraint({
    kind: "range",
    name: "range",
    target,
    params: { min, max },
  });
}

export function collectionConstraint(
  params?: Readonly<Record<string, unknown>>,
  target?: MetadataReference,
): MetadataConstraint {
  return defineConstraint({ kind: "collection", name: "collection", target, params });
}

export function referenceConstraint(
  ref: MetadataReference,
  target?: MetadataReference,
): MetadataConstraint {
  return defineConstraint({
    kind: "reference",
    name: "reference",
    target,
    params: { ref },
  });
}

export function expressionConstraint(
  expression: string,
  target?: MetadataReference,
): MetadataConstraint {
  return defineConstraint({
    kind: "expression",
    name: "expression",
    target,
    params: { expression },
  });
}
