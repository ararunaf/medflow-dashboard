/**
 * Helpers de identidade — TISS-05 Enterprise XML Generation Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createXMLGenerationRuntimeRequestId(): string {
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

/** Gera id estrutural para resultados de geração XML canônica. */
export function createXMLGenerationResultId(prefix = "xml-gen-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

export function resetXMLGenerationRuntimeIdSequences(): void {
  resultSeq = 0;
}
