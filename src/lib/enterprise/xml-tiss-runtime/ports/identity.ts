/**
 * Identidade do Enterprise XML TISS Runtime — C-01 / ECS-01.
 *
 * Identity:
 *   Enterprise XML TISS Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const XML_TISS_RUNTIME_IDENTITY = {
  name: "Enterprise XML TISS Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise XML TISS Runtime Foundation — vendor-agnostic structural entrypoint for future Canonical TISS → XML TISS/ANS transformation (no XML generation, no serialization, no parser, no XSD, no SOAP).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createXMLTISSRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let xmlResultSeq = 0;
let xmlDocumentSeq = 0;
let xmlGuideSeq = 0;
let xmlBatchSeq = 0;
let xmlHeaderSeq = 0;
let xmlBodySeq = 0;
let xmlMetadataSeq = 0;

/** Gera id estrutural para resultados canônicos (C-01). */
export function createXMLResultId(prefix = "xml-tiss-result"): string {
  xmlResultSeq += 1;
  return `${prefix}-${xmlResultSeq.toString(36)}`;
}

/** Gera id estrutural para XMLDocument (C-01). */
export function createXMLDocumentId(prefix = "xml-tiss-document"): string {
  xmlDocumentSeq += 1;
  return `${prefix}-${xmlDocumentSeq.toString(36)}`;
}

/** Gera id estrutural para XMLGuide (C-01). */
export function createXMLGuideId(prefix = "xml-tiss-guide"): string {
  xmlGuideSeq += 1;
  return `${prefix}-${xmlGuideSeq.toString(36)}`;
}

/** Gera id estrutural para XMLBatch (C-01). */
export function createXMLBatchId(prefix = "xml-tiss-batch"): string {
  xmlBatchSeq += 1;
  return `${prefix}-${xmlBatchSeq.toString(36)}`;
}

/** Gera id estrutural para XMLHeader (C-01). */
export function createXMLHeaderId(prefix = "xml-tiss-header"): string {
  xmlHeaderSeq += 1;
  return `${prefix}-${xmlHeaderSeq.toString(36)}`;
}

/** Gera id estrutural para XMLBody (C-01). */
export function createXMLBodyId(prefix = "xml-tiss-body"): string {
  xmlBodySeq += 1;
  return `${prefix}-${xmlBodySeq.toString(36)}`;
}

/** Gera id estrutural para XMLMetadata (C-01). */
export function createXMLMetadataId(prefix = "xml-tiss-metadata"): string {
  xmlMetadataSeq += 1;
  return `${prefix}-${xmlMetadataSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllXMLTISSRuntimeIdSequences(): void {
  xmlResultSeq = 0;
  xmlDocumentSeq = 0;
  xmlGuideSeq = 0;
  xmlBatchSeq = 0;
  xmlHeaderSeq = 0;
  xmlBodySeq = 0;
  xmlMetadataSeq = 0;
}
