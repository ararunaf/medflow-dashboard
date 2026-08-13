/**
 * Identidade do Enterprise Security Runtime — S1-02.
 *
 * Identity:
 *   Enterprise Security Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 * Sem criptografia real. Sem crypto module obrigatório.
 */

export const SECURITY_RUNTIME_IDENTITY = {
  name: "Enterprise Security Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Security Runtime Foundation — vendor-agnostic structural security entrypoint for future medical document / TISS / extracted-data security scaffolding (no real security, no cryptography, no digital signature, no chain of custody, no Key Vault, no HSM, no SIEM, no OpenTelemetry, no LGPD, no authentication, no authorization).",
} as const;

/** Versão canônica do Security Runtime Foundation. */
export const DEFAULT_SECURITY_RUNTIME_VERSION = SECURITY_RUNTIME_IDENTITY.version;

/** Gera id de request seguro para runtime sem depender de crypto real. */
export function createSecurityRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let securityResultSeq = 0;
let securityJobSeq = 0;
let securityRequestSeq = 0;
let securityFindingSeq = 0;
let securityIssueSeq = 0;
let securityRecommendationSeq = 0;
let securityJustificationSeq = 0;
let securityScoreSeq = 0;
let securitySummarySeq = 0;

/** Gera id estrutural para resultados canônicos (S1-02). */
export function createSecurityResultId(prefix = "security-result"): string {
  securityResultSeq += 1;
  return `${prefix}-${securityResultSeq.toString(36)}`;
}

/** Gera id estrutural para Security Job (S1-02). */
export function createSecurityJobId(prefix = "security-job"): string {
  securityJobSeq += 1;
  return `${prefix}-${securityJobSeq.toString(36)}`;
}

/** Gera id estrutural para SecurityRequest (S1-02). */
export function createSecurityRequestId(prefix = "security-request"): string {
  securityRequestSeq += 1;
  return `${prefix}-${securityRequestSeq.toString(36)}`;
}

/** Gera id estrutural para SecurityFinding (S1-02). */
export function createSecurityFindingId(prefix = "security-finding"): string {
  securityFindingSeq += 1;
  return `${prefix}-${securityFindingSeq.toString(36)}`;
}

/** Gera id estrutural para SecurityIssue (S1-02). */
export function createSecurityIssueId(prefix = "security-issue"): string {
  securityIssueSeq += 1;
  return `${prefix}-${securityIssueSeq.toString(36)}`;
}

/** Gera id estrutural para SecurityRecommendation (S1-02). */
export function createSecurityRecommendationId(prefix = "security-recommendation"): string {
  securityRecommendationSeq += 1;
  return `${prefix}-${securityRecommendationSeq.toString(36)}`;
}

/** Gera id estrutural para SecurityJustification (S1-02). */
export function createSecurityJustificationId(prefix = "security-justification"): string {
  securityJustificationSeq += 1;
  return `${prefix}-${securityJustificationSeq.toString(36)}`;
}

/** Gera id estrutural para SecurityScore (S1-02). */
export function createSecurityScoreId(prefix = "security-score"): string {
  securityScoreSeq += 1;
  return `${prefix}-${securityScoreSeq.toString(36)}`;
}

/** Gera id estrutural para SecuritySummary (S1-02). */
export function createSecuritySummaryId(prefix = "security-summary"): string {
  securitySummarySeq += 1;
  return `${prefix}-${securitySummarySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllSecurityRuntimeIdSequences(): void {
  securityResultSeq = 0;
  securityJobSeq = 0;
  securityRequestSeq = 0;
  securityFindingSeq = 0;
  securityIssueSeq = 0;
  securityRecommendationSeq = 0;
  securityJustificationSeq = 0;
  securityScoreSeq = 0;
  securitySummarySeq = 0;
}
