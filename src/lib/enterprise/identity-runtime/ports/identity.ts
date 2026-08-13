/**
 * Identidade do Enterprise Identity Runtime — S2-02.
 *
 * Identity:
 *   Enterprise Identity Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 * Sem criptografia real. Sem crypto module obrigatório.
 */

export const IDENTITY_RUNTIME_IDENTITY = {
  name: "Enterprise Identity Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Identity Runtime Foundation — vendor-agnostic structural identity entrypoint for future medical document / TISS / extracted-data identity scaffolding (no real identity, no cryptography, no digital signature, no chain of custody, no Key Vault, no HSM, no SIEM, no OpenTelemetry, no LGPD, no authentication, no authorization).",
} as const;

/** Versão canônica do Identity Runtime Foundation. */
export const DEFAULT_IDENTITY_RUNTIME_VERSION = IDENTITY_RUNTIME_IDENTITY.version;

/** Gera id de request seguro para runtime sem depender de crypto real. */
export function createIdentityRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let identityResultSeq = 0;
let identityJobSeq = 0;
let identityRequestSeq = 0;
let identityFindingSeq = 0;
let identityIssueSeq = 0;
let identityRecommendationSeq = 0;
let identityJustificationSeq = 0;
let identityScoreSeq = 0;
let identitySummarySeq = 0;

/** Gera id estrutural para resultados canônicos (S2-02). */
export function createIdentityResultId(prefix = "identity-result"): string {
  identityResultSeq += 1;
  return `${prefix}-${identityResultSeq.toString(36)}`;
}

/** Gera id estrutural para Identity Job (S2-02). */
export function createIdentityJobId(prefix = "identity-job"): string {
  identityJobSeq += 1;
  return `${prefix}-${identityJobSeq.toString(36)}`;
}

/** Gera id estrutural para IdentityRequest (S2-02). */
export function createIdentityRequestId(prefix = "identity-request"): string {
  identityRequestSeq += 1;
  return `${prefix}-${identityRequestSeq.toString(36)}`;
}

/** Gera id estrutural para IdentityFinding (S2-02). */
export function createIdentityFindingId(prefix = "identity-finding"): string {
  identityFindingSeq += 1;
  return `${prefix}-${identityFindingSeq.toString(36)}`;
}

/** Gera id estrutural para IdentityIssue (S2-02). */
export function createIdentityIssueId(prefix = "identity-issue"): string {
  identityIssueSeq += 1;
  return `${prefix}-${identityIssueSeq.toString(36)}`;
}

/** Gera id estrutural para IdentityRecommendation (S2-02). */
export function createIdentityRecommendationId(prefix = "identity-recommendation"): string {
  identityRecommendationSeq += 1;
  return `${prefix}-${identityRecommendationSeq.toString(36)}`;
}

/** Gera id estrutural para IdentityJustification (S2-02). */
export function createIdentityJustificationId(prefix = "identity-justification"): string {
  identityJustificationSeq += 1;
  return `${prefix}-${identityJustificationSeq.toString(36)}`;
}

/** Gera id estrutural para IdentityScore (S2-02). */
export function createIdentityScoreId(prefix = "identity-score"): string {
  identityScoreSeq += 1;
  return `${prefix}-${identityScoreSeq.toString(36)}`;
}

/** Gera id estrutural para IdentitySummary (S2-02). */
export function createIdentitySummaryId(prefix = "identity-summary"): string {
  identitySummarySeq += 1;
  return `${prefix}-${identitySummarySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllIdentityRuntimeIdSequences(): void {
  identityResultSeq = 0;
  identityJobSeq = 0;
  identityRequestSeq = 0;
  identityFindingSeq = 0;
  identityIssueSeq = 0;
  identityRecommendationSeq = 0;
  identityJustificationSeq = 0;
  identityScoreSeq = 0;
  identitySummarySeq = 0;
}
