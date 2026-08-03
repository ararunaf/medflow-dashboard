/**
 * Helpers de identidade — TISS-10 Enterprise Namespace Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createNamespaceRuntimeRequestId(): string {
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
let namespaceSeq = 0;

/** Gera id estrutural para resultados de Namespace Runtime canônico. */
export function createNamespaceResultId(prefix = "namespace-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para pedidos/definições canônicas. */
export function createNamespaceId(prefix = "namespace"): string {
  namespaceSeq += 1;
  return `${prefix}-${namespaceSeq.toString(36)}`;
}

export function resetNamespaceRuntimeIdSequences(): void {
  resultSeq = 0;
  namespaceSeq = 0;
}
