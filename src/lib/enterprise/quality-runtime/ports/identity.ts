/**
 * Identidade do Enterprise Quality Runtime — F3-CAP-13.
 *
 * Identity:
 *   Enterprise Quality Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const QUALITY_RUNTIME_IDENTITY = {
  name: "Enterprise Quality Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Quality Runtime Foundation — vendor-agnostic structural entrypoint for future documentary quality assessment (no functional score, no automatic evaluation, no automatic decision, no AI).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createQualityRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let qualityResultSeq = 0;
let qualityAssessmentSeq = 0;
let qualityIssueSeq = 0;
let qualityMetricSeq = 0;
let qualityScoreSeq = 0;
let qualityDecisionSeq = 0;

/** Gera id estrutural para resultados canônicos (F3-CAP-13). */
export function createQualityResultId(prefix = "quality-result"): string {
  qualityResultSeq += 1;
  return `${prefix}-${qualityResultSeq.toString(36)}`;
}

/** Gera id estrutural para QualityAssessment (F3-CAP-13). */
export function createQualityAssessmentId(prefix = "quality-assessment"): string {
  qualityAssessmentSeq += 1;
  return `${prefix}-${qualityAssessmentSeq.toString(36)}`;
}

/** Gera id estrutural para QualityIssue (F3-CAP-13). */
export function createQualityIssueId(prefix = "quality-issue"): string {
  qualityIssueSeq += 1;
  return `${prefix}-${qualityIssueSeq.toString(36)}`;
}

/** Gera id estrutural para QualityMetric (F3-CAP-13). */
export function createQualityMetricId(prefix = "quality-metric"): string {
  qualityMetricSeq += 1;
  return `${prefix}-${qualityMetricSeq.toString(36)}`;
}

/** Gera id estrutural para QualityScore (F3-CAP-13). */
export function createQualityScoreId(prefix = "quality-score"): string {
  qualityScoreSeq += 1;
  return `${prefix}-${qualityScoreSeq.toString(36)}`;
}

/** Gera id estrutural para QualityDecision (F3-CAP-13). */
export function createQualityDecisionId(prefix = "quality-decision"): string {
  qualityDecisionSeq += 1;
  return `${prefix}-${qualityDecisionSeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllQualityRuntimeIdSequences(): void {
  qualityResultSeq = 0;
  qualityAssessmentSeq = 0;
  qualityIssueSeq = 0;
  qualityMetricSeq = 0;
  qualityScoreSeq = 0;
  qualityDecisionSeq = 0;
}
