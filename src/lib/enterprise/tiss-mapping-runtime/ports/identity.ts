/**
 * Identidade do Enterprise TISS Mapping Runtime — F3-CAP-11.
 *
 * Identity:
 *   Enterprise TISS Mapping Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const TISS_MAPPING_RUNTIME_IDENTITY = {
  name: "Enterprise TISS Mapping Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise TISS Mapping Runtime Foundation — vendor-agnostic structural entrypoint for future canonical TISS mapping (no functional mapping, no operators, no XML, no auto-fill).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createTISSMappingRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let mappingResultSeq = 0;
let mappingSeq = 0;
let mappingIssueSeq = 0;
let guideSeq = 0;
let fieldSeq = 0;
let sectionSeq = 0;
let procedureSeq = 0;

/** Gera id estrutural para resultados canônicos (F3-CAP-11). */
export function createCanonicalMappingResultId(prefix = "tiss-mapping-result"): string {
  mappingResultSeq += 1;
  return `${prefix}-${mappingResultSeq.toString(36)}`;
}

/** Gera id estrutural para CanonicalMapping (F3-CAP-11). */
export function createCanonicalMappingId(prefix = "tiss-mapping"): string {
  mappingSeq += 1;
  return `${prefix}-${mappingSeq.toString(36)}`;
}

/** Gera id estrutural para CanonicalMappingIssue (F3-CAP-11). */
export function createCanonicalMappingIssueId(prefix = "tiss-mapping-issue"): string {
  mappingIssueSeq += 1;
  return `${prefix}-${mappingIssueSeq.toString(36)}`;
}

/** Gera id estrutural para CanonicalGuide (F3-CAP-11). */
export function createCanonicalGuideId(prefix = "tiss-guide"): string {
  guideSeq += 1;
  return `${prefix}-${guideSeq.toString(36)}`;
}

/** Gera id estrutural para CanonicalField (F3-CAP-11). */
export function createCanonicalFieldId(prefix = "tiss-field"): string {
  fieldSeq += 1;
  return `${prefix}-${fieldSeq.toString(36)}`;
}

/** Gera id estrutural para CanonicalSection (F3-CAP-11). */
export function createCanonicalSectionId(prefix = "tiss-section"): string {
  sectionSeq += 1;
  return `${prefix}-${sectionSeq.toString(36)}`;
}

/** Gera id estrutural para CanonicalProcedure (F3-CAP-11). */
export function createCanonicalProcedureId(prefix = "tiss-procedure"): string {
  procedureSeq += 1;
  return `${prefix}-${procedureSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllTISSMappingRuntimeIdSequences(): void {
  mappingResultSeq = 0;
  mappingSeq = 0;
  mappingIssueSeq = 0;
  guideSeq = 0;
  fieldSeq = 0;
  sectionSeq = 0;
  procedureSeq = 0;
}
