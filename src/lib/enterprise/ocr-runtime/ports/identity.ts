/**
 * Identidade do Enterprise OCR Runtime — F3-CAP-05 (+ DIP-03 preservado).
 *
 * Identity:
 *   Enterprise OCR Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const OCR_RUNTIME_IDENTITY = {
  name: "Enterprise OCR Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise OCR Runtime Foundation — vendor-agnostic structural orchestration entrypoint for OCR jobs/requests/documents (no Tesseract, no Azure/Google/AWS/ABBYY/PaddleOCR engine, no real text extraction).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createOCRRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let ocrSessionSequence = 0;
let ocrResultSeq = 0;
let ocrJobSeq = 0;
let ocrCapRequestSeq = 0;
let ocrDocumentSeq = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo (DIP-03). */
export function createOCRRuntimeSessionId(): string {
  ocrSessionSequence += 1;
  return `dip-ocr-session-${ocrSessionSequence}`;
}

/** Gera id estrutural para resultados canônicos (F3-CAP-05). */
export function createOCRResultId(prefix = "ocr-result"): string {
  ocrResultSeq += 1;
  return `${prefix}-${ocrResultSeq.toString(36)}`;
}

/** Gera id estrutural para OCRJob (F3-CAP-05). */
export function createOCRJobId(prefix = "ocr-job"): string {
  ocrJobSeq += 1;
  return `${prefix}-${ocrJobSeq.toString(36)}`;
}

/** Gera id estrutural para OCRRequest (F3-CAP-05). */
export function createOCRCapRequestId(prefix = "ocr-cap-request"): string {
  ocrCapRequestSeq += 1;
  return `${prefix}-${ocrCapRequestSeq.toString(36)}`;
}

/** Gera id estrutural para OCRDocument (F3-CAP-05). */
export function createOCRDocumentId(prefix = "ocr-document"): string {
  ocrDocumentSeq += 1;
  return `${prefix}-${ocrDocumentSeq.toString(36)}`;
}

/** Reset da sequência de sessões — exclusivo para testes (DIP-03). */
export function resetOCRRuntimeSessionIdSequence(): void {
  ocrSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllOCRRuntimeIdSequences(): void {
  resetOCRRuntimeSessionIdSequence();
  ocrResultSeq = 0;
  ocrJobSeq = 0;
  ocrCapRequestSeq = 0;
  ocrDocumentSeq = 0;
}
