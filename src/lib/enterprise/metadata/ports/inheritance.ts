/**
 * Herança de esquemas — infraestrutura preparatória (EPC-04 / FASE 6).
 *
 * Ainda NÃO implementa flatten, merge de attributes nem resolução complexa.
 * Apenas helpers estruturais para declarar e inspecionar `extends`.
 */
import type { MetadataEntity, MetadataReference, MetadataSchema } from "./types";

/** Indica se o Schema declara herança estrutural. */
export function schemaDeclaresInheritance(schema: MetadataSchema): boolean {
  return schema.extends != null && hasReferenceTarget(schema.extends);
}

/** Indica se a Entity declara herança estrutural. */
export function entityDeclaresInheritance(entity: MetadataEntity): boolean {
  return entity.extends != null && hasReferenceTarget(entity.extends);
}

/** Extrai a referência base (quando presente). */
export function getSchemaBaseReference(schema: MetadataSchema): MetadataReference | undefined {
  return schemaDeclaresInheritance(schema) ? schema.extends : undefined;
}

/** Extrai a referência base da Entity (quando presente). */
export function getEntityBaseReference(entity: MetadataEntity): MetadataReference | undefined {
  return entityDeclaresInheritance(entity) ? entity.extends : undefined;
}

/**
 * Cadeia de herança declarada (apenas 1 nível nesta sprint).
 * Retorna [schema, baseRef] sem resolver o base no store.
 * Merge complexo fica para sprints futuras.
 */
export function getDeclaredInheritanceChain(
  schema: MetadataSchema,
): readonly [MetadataSchema, MetadataReference | undefined] {
  return [schema, getSchemaBaseReference(schema)];
}

function hasReferenceTarget(ref: MetadataReference): boolean {
  return Boolean(ref.id || ref.name);
}
