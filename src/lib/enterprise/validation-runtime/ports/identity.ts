/**
 * Identidade do Enterprise Validation Runtime — F3-CAP-08.
 *
 * Identity:
 *   Enterprise Validation Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const VALIDATION_RUNTIME_IDENTITY = {
  name: "Enterprise Validation Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Validation Runtime Foundation — vendor-agnostic structural orchestration entrypoint for validation jobs/requests/documents (no real validation, no audit, no AI, no ML, no LLM, no TISS rules, no operator rules, no auto approval/rejection).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createValidationRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let validationResultSeq = 0;
let validationJobSeq = 0;
let validationCapRequestSeq = 0;
let validationDocumentSeq = 0;

/** Gera id estrutural para resultados canônicos (F3-CAP-08). */
export function createValidationResultId(prefix = "validation-result"): string {
  validationResultSeq += 1;
  return `${prefix}-${validationResultSeq.toString(36)}`;
}

/** Gera id estrutural para ValidationJob (F3-CAP-08). */
export function createValidationJobId(prefix = "validation-job"): string {
  validationJobSeq += 1;
  return `${prefix}-${validationJobSeq.toString(36)}`;
}

/** Gera id estrutural para ValidationRequest (F3-CAP-08). */
export function createValidationCapRequestId(prefix = "validation-cap-request"): string {
  validationCapRequestSeq += 1;
  return `${prefix}-${validationCapRequestSeq.toString(36)}`;
}

/** Gera id estrutural para ValidationDocument (F3-CAP-08). */
export function createValidationDocumentId(prefix = "validation-document"): string {
  validationDocumentSeq += 1;
  return `${prefix}-${validationDocumentSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllValidationRuntimeIdSequences(): void {
  validationResultSeq = 0;
  validationJobSeq = 0;
  validationCapRequestSeq = 0;
  validationDocumentSeq = 0;
}
