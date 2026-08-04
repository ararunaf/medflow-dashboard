/**
 * Identidade do Enterprise Document Extraction Runtime — F3-CAP-07.
 *
 * Identity:
 *   Enterprise Document Extraction Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const DOCUMENT_EXTRACTION_RUNTIME_IDENTITY = {
  name: "Enterprise Document Extraction Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Document Extraction Runtime Foundation — vendor-agnostic structural orchestration entrypoint for extraction jobs/requests/documents (no OCR, no AI, no ML, no LLM, no regex, no template matching, no field reading, no guide filling).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createDocumentExtractionRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let extractionResultSeq = 0;
let extractionJobSeq = 0;
let extractionCapRequestSeq = 0;
let extractionDocumentSeq = 0;

/** Gera id estrutural para resultados canônicos (F3-CAP-07). */
export function createDocumentExtractionResultId(prefix = "extraction-result"): string {
  extractionResultSeq += 1;
  return `${prefix}-${extractionResultSeq.toString(36)}`;
}

/** Gera id estrutural para ExtractionJob (F3-CAP-07). */
export function createExtractionJobId(prefix = "extraction-job"): string {
  extractionJobSeq += 1;
  return `${prefix}-${extractionJobSeq.toString(36)}`;
}

/** Gera id estrutural para DocumentExtractionRequest (F3-CAP-07). */
export function createDocumentExtractionCapRequestId(prefix = "extraction-cap-request"): string {
  extractionCapRequestSeq += 1;
  return `${prefix}-${extractionCapRequestSeq.toString(36)}`;
}

/** Gera id estrutural para DocumentExtractionDocument (F3-CAP-07). */
export function createDocumentExtractionDocumentId(prefix = "extraction-document"): string {
  extractionDocumentSeq += 1;
  return `${prefix}-${extractionDocumentSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllDocumentExtractionRuntimeIdSequences(): void {
  extractionResultSeq = 0;
  extractionJobSeq = 0;
  extractionCapRequestSeq = 0;
  extractionDocumentSeq = 0;
}
