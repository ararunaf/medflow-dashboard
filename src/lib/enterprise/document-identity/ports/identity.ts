/**
 * Helpers de identidade canônica — EPC-08 FASE 7.
 *
 * Preparação estrutural apenas. Sem criptografia forte obrigatória.
 * Sem conhecimento clínico, TISS ou contratual.
 */
import type {
  DocumentCanonicalIdentity,
  DocumentChecksum,
  DocumentFingerprint,
  DocumentHash,
  DocumentIdentity,
} from "./types";

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createDocumentUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback determinístico-suficiente para in-process / testes.
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

export function defineChecksum(value: string, algorithm?: string): DocumentChecksum {
  return algorithm ? { algorithm, value } : { value };
}

export function defineHash(value: string, algorithm?: string): DocumentHash {
  return algorithm ? { algorithm, value } : { value };
}

export function defineFingerprint(value: string, method?: string): DocumentFingerprint {
  return method ? { value, method } : { value };
}

/**
 * Monta identidade canônica a partir de campos genéricos.
 * Não interpreta domínio.
 */
export function defineCanonicalIdentity(
  partial: DocumentCanonicalIdentity = {},
): DocumentCanonicalIdentity {
  return {
    uuid: partial.uuid,
    hash: partial.hash,
    fingerprint: partial.fingerprint,
    checksum: partial.checksum,
    sourceId: partial.sourceId,
    correlationId: partial.correlationId,
    externalId: partial.externalId,
    origin: partial.origin,
  };
}

/** Extrai correlationId se presente. */
export function getCorrelationId(document: DocumentIdentity): string | undefined {
  return document.identity?.correlationId;
}

/** Extrai externalId se presente. */
export function getExternalId(document: DocumentIdentity): string | undefined {
  return document.identity?.externalId;
}

/** Extrai sourceId se presente. */
export function getSourceId(document: DocumentIdentity): string | undefined {
  return document.identity?.sourceId;
}

/** Extrai origin se presente. */
export function getOrigin(document: DocumentIdentity): string | undefined {
  return document.identity?.origin;
}

/** Indica se o documento declara identidade canônica parcial/completa. */
export function hasCanonicalIdentity(document: DocumentIdentity): boolean {
  const id = document.identity;
  if (!id) return false;
  return Boolean(
    id.uuid ||
    id.hash ||
    id.fingerprint ||
    id.checksum ||
    id.sourceId ||
    id.correlationId ||
    id.externalId ||
    id.origin,
  );
}
