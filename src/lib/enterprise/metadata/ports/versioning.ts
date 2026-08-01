/**
 * Versionamento de Schema — infraestrutura (EPC-04 / FASE 7).
 *
 * Todo Schema possui Version / Status / CreatedAt / UpdatedAt / Author / Compatibility.
 * Sem banco; sem políticas de upgrade. Helpers estruturais apenas.
 */
import type {
  MetadataCompatibility,
  MetadataSchema,
  MetadataSchemaStatus,
  MetadataVersionInfo,
  MetadataVersionLabel,
} from "./types";

export const METADATA_SCHEMA_STATUSES: readonly MetadataSchemaStatus[] = [
  "draft",
  "active",
  "deprecated",
  "retired",
  "experimental",
] as const;

/** Cria MetadataVersionInfo com timestamps ISO (in-process). */
export function createVersionInfo(input: {
  version: MetadataVersionLabel;
  status?: MetadataSchemaStatus;
  author?: string;
  compatibility?: MetadataCompatibility;
  createdAt?: string;
  updatedAt?: string;
}): MetadataVersionInfo {
  const now = new Date().toISOString();
  return {
    version: input.version,
    status: input.status ?? "draft",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    author: input.author,
    compatibility: input.compatibility,
  };
}

/** Atualiza `updatedAt` preservando demais campos. */
export function touchVersionInfo(info: MetadataVersionInfo): MetadataVersionInfo {
  return {
    ...info,
    updatedAt: new Date().toISOString(),
  };
}

/** Lê o rótulo de versão do Schema. */
export function getSchemaVersion(schema: MetadataSchema): MetadataVersionLabel {
  return schema.versionInfo.version;
}

/** Lê o status do Schema. */
export function getSchemaStatus(schema: MetadataSchema): MetadataSchemaStatus {
  return schema.versionInfo.status;
}

/** Verifica se status é conhecido (estrutural). */
export function isKnownSchemaStatus(status: string): status is MetadataSchemaStatus {
  return (METADATA_SCHEMA_STATUSES as readonly string[]).includes(status);
}

/**
 * Compatibilidade declarativa mínima (prep).
 * NÃO implementa semver nem upgrade path — só consulta listas estruturais.
 */
export function declaresCompatibilityWith(
  schema: MetadataSchema,
  otherVersion: MetadataVersionLabel,
): boolean {
  const list = schema.versionInfo.compatibility?.compatibleWith ?? [];
  return list.includes(otherVersion);
}

export function declaresIncompatibilityWith(
  schema: MetadataSchema,
  otherVersion: MetadataVersionLabel,
): boolean {
  const list = schema.versionInfo.compatibility?.incompatibleWith ?? [];
  return list.includes(otherVersion);
}
