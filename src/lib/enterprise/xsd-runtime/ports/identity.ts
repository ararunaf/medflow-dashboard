/**
 * Helpers de identidade — TISS-09 Enterprise XSD Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createXSDRuntimeRequestId(): string {
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
let xsdSeq = 0;

/** Gera id estrutural para resultados de XSD Runtime canônico. */
export function createXSDResultId(prefix = "xsd-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para pedidos/schemas canônicos. */
export function createXSDId(prefix = "xsd"): string {
  xsdSeq += 1;
  return `${prefix}-${xsdSeq.toString(36)}`;
}

export function resetXSDRuntimeIdSequences(): void {
  resultSeq = 0;
  xsdSeq = 0;
}
