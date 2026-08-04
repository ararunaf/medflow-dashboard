/**
 * Identidade do Enterprise Document Classification Runtime — F3-CAP-06 (+ DIP-04 / CLASS-01 preservado).
 *
 * Identity:
 *   Enterprise Document Classification Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY = {
  name: "Enterprise Document Classification Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Document Classification Runtime Foundation — vendor-agnostic structural orchestration entrypoint for classification jobs/requests/documents (no AI, no ML, no LLM, no OCR, no template matching, no automatic routing, no vision).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createDocumentClassificationRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let classificationSessionSequence = 0;
let classificationResultSeq = 0;
let classificationJobSeq = 0;
let classificationCapRequestSeq = 0;
let classificationDocumentSeq = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo (DIP-04). */
export function createDocumentClassificationRuntimeSessionId(): string {
  classificationSessionSequence += 1;
  return `dip-classification-session-${classificationSessionSequence}`;
}

/** Gera id estrutural para resultados canônicos (F3-CAP-06). */
export function createDocumentClassificationResultId(prefix = "classification-result"): string {
  classificationResultSeq += 1;
  return `${prefix}-${classificationResultSeq.toString(36)}`;
}

/** Gera id estrutural para DocumentClassificationJob (F3-CAP-06). */
export function createDocumentClassificationJobId(prefix = "classification-job"): string {
  classificationJobSeq += 1;
  return `${prefix}-${classificationJobSeq.toString(36)}`;
}

/** Gera id estrutural para DocumentClassificationRequest (F3-CAP-06). */
export function createDocumentClassificationCapRequestId(
  prefix = "classification-cap-request",
): string {
  classificationCapRequestSeq += 1;
  return `${prefix}-${classificationCapRequestSeq.toString(36)}`;
}

/** Gera id estrutural para DocumentClassificationDocument (F3-CAP-06). */
export function createDocumentClassificationDocumentId(prefix = "classification-document"): string {
  classificationDocumentSeq += 1;
  return `${prefix}-${classificationDocumentSeq.toString(36)}`;
}

/** Reset da sequência de sessões — exclusivo para testes (DIP-04). */
export function resetDocumentClassificationRuntimeSessionIdSequence(): void {
  classificationSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllDocumentClassificationRuntimeIdSequences(): void {
  resetDocumentClassificationRuntimeSessionIdSequence();
  classificationResultSeq = 0;
  classificationJobSeq = 0;
  classificationCapRequestSeq = 0;
  classificationDocumentSeq = 0;
}
