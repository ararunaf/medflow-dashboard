/**
 * Helpers de identidade — TISS-02 Enterprise TISS Canonical Catalog.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createTISSCatalogRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let entrySeq = 0;

/** Gera id estrutural para entradas do catálogo (testes / seed). */
export function createTISSCatalogEntryId(prefix = "tiss-cat"): string {
  entrySeq += 1;
  return `${prefix}-${entrySeq.toString(36)}`;
}

export function resetTISSCatalogEntryIdSequence(): void {
  entrySeq = 0;
}
