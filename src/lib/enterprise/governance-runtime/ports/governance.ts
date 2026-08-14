/**
 * Identidade do Enterprise Governance Runtime — S6-02.
 *
 * Governance:
 *   Enterprise Governance Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 * Sem criptografia real. Sem crypto module obrigatório.
 */

export const GOVERNANCE_RUNTIME_IDENTITY = {
  name: "Enterprise Governance Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Governance Runtime Foundation — vendor-agnostic structural governance entrypoint for future medical document / TISS / extracted-data governance scaffolding (no real governance, no cryptography, no digital signature, no chain of custody, no Key Vault, no HSM, no SIEM, no OpenTelemetry, no LGPD, no authentication, no governance).",
} as const;

/** Versão canônica do Governance Runtime Foundation. */
export const DEFAULT_GOVERNANCE_RUNTIME_VERSION = GOVERNANCE_RUNTIME_IDENTITY.version;

/** Gera id de request seguro para runtime sem depender de crypto real. */
export function createGovernanceRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let governanceResultSeq = 0;
let governanceJobSeq = 0;
let governanceRequestSeq = 0;
let governanceFindingSeq = 0;
let governanceIssueSeq = 0;
let governanceRecommendationSeq = 0;
let governanceJustificationSeq = 0;
let governanceScoreSeq = 0;
let governanceSummarySeq = 0;

/** Gera id estrutural para resultados canônicos (S6-02). */
export function createGovernanceResultId(prefix = "governance-result"): string {
  governanceResultSeq += 1;
  return `${prefix}-${governanceResultSeq.toString(36)}`;
}

/** Gera id estrutural para Governance Job (S6-02). */
export function createGovernanceJobId(prefix = "governance-job"): string {
  governanceJobSeq += 1;
  return `${prefix}-${governanceJobSeq.toString(36)}`;
}

/** Gera id estrutural para GovernanceRequest (S6-02). */
export function createGovernanceRequestId(prefix = "governance-request"): string {
  governanceRequestSeq += 1;
  return `${prefix}-${governanceRequestSeq.toString(36)}`;
}

/** Gera id estrutural para GovernanceFinding (S6-02). */
export function createGovernanceFindingId(prefix = "governance-finding"): string {
  governanceFindingSeq += 1;
  return `${prefix}-${governanceFindingSeq.toString(36)}`;
}

/** Gera id estrutural para GovernanceIssue (S6-02). */
export function createGovernanceIssueId(prefix = "governance-issue"): string {
  governanceIssueSeq += 1;
  return `${prefix}-${governanceIssueSeq.toString(36)}`;
}

/** Gera id estrutural para GovernanceRecommendation (S6-02). */
export function createGovernanceRecommendationId(prefix = "governance-recommendation"): string {
  governanceRecommendationSeq += 1;
  return `${prefix}-${governanceRecommendationSeq.toString(36)}`;
}

/** Gera id estrutural para GovernanceJustification (S6-02). */
export function createGovernanceJustificationId(prefix = "governance-justification"): string {
  governanceJustificationSeq += 1;
  return `${prefix}-${governanceJustificationSeq.toString(36)}`;
}

/** Gera id estrutural para GovernanceScore (S6-02). */
export function createGovernanceScoreId(prefix = "governance-score"): string {
  governanceScoreSeq += 1;
  return `${prefix}-${governanceScoreSeq.toString(36)}`;
}

/** Gera id estrutural para GovernanceSummary (S6-02). */
export function createGovernanceSummaryId(prefix = "governance-summary"): string {
  governanceSummarySeq += 1;
  return `${prefix}-${governanceSummarySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllGovernanceRuntimeIdSequences(): void {
  governanceResultSeq = 0;
  governanceJobSeq = 0;
  governanceRequestSeq = 0;
  governanceFindingSeq = 0;
  governanceIssueSeq = 0;
  governanceRecommendationSeq = 0;
  governanceJustificationSeq = 0;
  governanceScoreSeq = 0;
  governanceSummarySeq = 0;
}
