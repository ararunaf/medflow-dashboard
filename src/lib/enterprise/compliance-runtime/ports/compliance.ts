/**
 * Identidade do Enterprise Compliance Runtime — S3-02.
 *
 * Compliance:
 *   Enterprise Compliance Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 * Sem criptografia real. Sem crypto module obrigatório.
 */

export const COMPLIANCE_RUNTIME_IDENTITY = {
  name: "Enterprise Compliance Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Compliance Runtime Foundation — vendor-agnostic structural compliance entrypoint for future medical document / TISS / extracted-data compliance scaffolding (no real compliance, no cryptography, no digital signature, no chain of custody, no Key Vault, no HSM, no SIEM, no OpenTelemetry, no LGPD, no authentication, no compliance).",
} as const;

/** Versão canônica do Compliance Runtime Foundation. */
export const DEFAULT_COMPLIANCE_RUNTIME_VERSION = COMPLIANCE_RUNTIME_IDENTITY.version;

/** Gera id de request seguro para runtime sem depender de crypto real. */
export function createComplianceRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let complianceResultSeq = 0;
let complianceJobSeq = 0;
let complianceRequestSeq = 0;
let complianceFindingSeq = 0;
let complianceIssueSeq = 0;
let complianceRecommendationSeq = 0;
let complianceJustificationSeq = 0;
let complianceScoreSeq = 0;
let complianceSummarySeq = 0;

/** Gera id estrutural para resultados canônicos (S3-02). */
export function createComplianceResultId(prefix = "compliance-result"): string {
  complianceResultSeq += 1;
  return `${prefix}-${complianceResultSeq.toString(36)}`;
}

/** Gera id estrutural para Compliance Job (S3-02). */
export function createComplianceJobId(prefix = "compliance-job"): string {
  complianceJobSeq += 1;
  return `${prefix}-${complianceJobSeq.toString(36)}`;
}

/** Gera id estrutural para ComplianceRequest (S3-02). */
export function createComplianceRequestId(prefix = "compliance-request"): string {
  complianceRequestSeq += 1;
  return `${prefix}-${complianceRequestSeq.toString(36)}`;
}

/** Gera id estrutural para ComplianceFinding (S3-02). */
export function createComplianceFindingId(prefix = "compliance-finding"): string {
  complianceFindingSeq += 1;
  return `${prefix}-${complianceFindingSeq.toString(36)}`;
}

/** Gera id estrutural para ComplianceIssue (S3-02). */
export function createComplianceIssueId(prefix = "compliance-issue"): string {
  complianceIssueSeq += 1;
  return `${prefix}-${complianceIssueSeq.toString(36)}`;
}

/** Gera id estrutural para ComplianceRecommendation (S3-02). */
export function createComplianceRecommendationId(prefix = "compliance-recommendation"): string {
  complianceRecommendationSeq += 1;
  return `${prefix}-${complianceRecommendationSeq.toString(36)}`;
}

/** Gera id estrutural para ComplianceJustification (S3-02). */
export function createComplianceJustificationId(prefix = "compliance-justification"): string {
  complianceJustificationSeq += 1;
  return `${prefix}-${complianceJustificationSeq.toString(36)}`;
}

/** Gera id estrutural para ComplianceScore (S3-02). */
export function createComplianceScoreId(prefix = "compliance-score"): string {
  complianceScoreSeq += 1;
  return `${prefix}-${complianceScoreSeq.toString(36)}`;
}

/** Gera id estrutural para ComplianceSummary (S3-02). */
export function createComplianceSummaryId(prefix = "compliance-summary"): string {
  complianceSummarySeq += 1;
  return `${prefix}-${complianceSummarySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllComplianceRuntimeIdSequences(): void {
  complianceResultSeq = 0;
  complianceJobSeq = 0;
  complianceRequestSeq = 0;
  complianceFindingSeq = 0;
  complianceIssueSeq = 0;
  complianceRecommendationSeq = 0;
  complianceJustificationSeq = 0;
  complianceScoreSeq = 0;
  complianceSummarySeq = 0;
}
