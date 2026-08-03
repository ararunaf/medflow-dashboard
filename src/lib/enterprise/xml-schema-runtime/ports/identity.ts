/**
 * Helpers de identidade — TISS-07 Enterprise XML Schema Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createXMLSchemaRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let resultSeq = 0;
let schemaSeq = 0;

/** Gera id estrutural para resultados de XML Schema canônico. */
export function createXMLSchemaResultId(prefix = "xml-sch-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para schemas canônicos. */
export function createXMLSchemaId(prefix = "xml-sch"): string {
  schemaSeq += 1;
  return `${prefix}-${schemaSeq.toString(36)}`;
}

export function resetXMLSchemaRuntimeIdSequences(): void {
  resultSeq = 0;
  schemaSeq = 0;
}
