/**
 * Helpers de identidade — TISS-04 Enterprise XML Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createXMLRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let generationSeq = 0;

/** Gera id estrutural para gerações XML canônicas. */
export function createXMLGenerationId(prefix = "xml-gen"): string {
  generationSeq += 1;
  return `${prefix}-${generationSeq.toString(36)}`;
}

export function resetXMLRuntimeIdSequences(): void {
  generationSeq = 0;
}
