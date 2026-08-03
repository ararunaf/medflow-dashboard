/**
 * Helpers de identidade — TISS-06 Enterprise XML Serializer Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createXMLSerializerRuntimeRequestId(): string {
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

/** Gera id estrutural para resultados de serialização XML canônica. */
export function createXMLSerializerResultId(prefix = "xml-ser-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

export function resetXMLSerializerRuntimeIdSequences(): void {
  resultSeq = 0;
}
