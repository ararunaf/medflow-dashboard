/**
 * Helpers de identidade — CLASS-01 Document Classification Provider.
 *
 * Sem IA, ML, embeddings ou conhecimento clínico / TISS de negócio.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createDocumentClassificationRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}
