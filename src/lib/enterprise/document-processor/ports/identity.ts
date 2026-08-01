/**
 * Helpers de identidade — EPC-13.
 *
 * Sem OCR, IA, parsers ou conhecimento clínico / TISS.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createProcessingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

/** Gera id de ProcessingOutput (mesma estratégia). */
export function createOutputId(): string {
  return createProcessingId();
}
