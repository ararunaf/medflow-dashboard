/**
 * Identidade do Enterprise Auto-Fill Runtime — F3-CAP-12.
 *
 * Identity:
 *   Enterprise Auto-Fill Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const AUTO_FILL_RUNTIME_IDENTITY = {
  name: "Enterprise Auto-Fill Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Auto-Fill Runtime Foundation — vendor-agnostic structural entrypoint for future canonical guide auto-fill (no functional auto-fill, no XML, no operators, no guide writing).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createAutoFillRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let autoFillResultSeq = 0;
let autoFillSeq = 0;
let autoFillIssueSeq = 0;
let guideSeq = 0;
let fieldSeq = 0;
let sectionSeq = 0;

/** Gera id estrutural para resultados canônicos (F3-CAP-12). */
export function createAutoFillResultId(prefix = "auto-fill-result"): string {
  autoFillResultSeq += 1;
  return `${prefix}-${autoFillResultSeq.toString(36)}`;
}

/** Gera id estrutural para AutoFill session (F3-CAP-12). */
export function createAutoFillId(prefix = "auto-fill"): string {
  autoFillSeq += 1;
  return `${prefix}-${autoFillSeq.toString(36)}`;
}

/** Gera id estrutural para AutoFillIssue (F3-CAP-12). */
export function createAutoFillIssueId(prefix = "auto-fill-issue"): string {
  autoFillIssueSeq += 1;
  return `${prefix}-${autoFillIssueSeq.toString(36)}`;
}

/** Gera id estrutural para AutoFillGuide (F3-CAP-12). */
export function createAutoFillGuideId(prefix = "auto-fill-guide"): string {
  guideSeq += 1;
  return `${prefix}-${guideSeq.toString(36)}`;
}

/** Gera id estrutural para AutoFillField (F3-CAP-12). */
export function createAutoFillFieldId(prefix = "auto-fill-field"): string {
  fieldSeq += 1;
  return `${prefix}-${fieldSeq.toString(36)}`;
}

/** Gera id estrutural para AutoFillSection (F3-CAP-12). */
export function createAutoFillSectionId(prefix = "auto-fill-section"): string {
  sectionSeq += 1;
  return `${prefix}-${sectionSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllAutoFillRuntimeIdSequences(): void {
  autoFillResultSeq = 0;
  autoFillSeq = 0;
  autoFillIssueSeq = 0;
  guideSeq = 0;
  fieldSeq = 0;
  sectionSeq = 0;
}
