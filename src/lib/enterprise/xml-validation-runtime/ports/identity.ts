/**
 * Helpers de identidade — TISS-08 Enterprise XML Validation Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createXMLValidationRuntimeRequestId(): string {
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
let validationSeq = 0;

/** Gera id estrutural para resultados de XML Validation canônico. */
export function createXMLValidationResultId(prefix = "xml-val-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para pedidos/perfis de validação canônicos. */
export function createXMLValidationId(prefix = "xml-val"): string {
  validationSeq += 1;
  return `${prefix}-${validationSeq.toString(36)}`;
}

export function resetXMLValidationRuntimeIdSequences(): void {
  resultSeq = 0;
  validationSeq = 0;
}
