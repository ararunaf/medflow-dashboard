/**
 * Identidade do Enterprise Authorization Runtime — S3-02.
 *
 * Authorization:
 *   Enterprise Authorization Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 * Sem criptografia real. Sem crypto module obrigatório.
 */

export const AUTHORIZATION_RUNTIME_IDENTITY = {
  name: "Enterprise Authorization Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Authorization Runtime Foundation — vendor-agnostic structural authorization entrypoint for future medical document / TISS / extracted-data authorization scaffolding (no real authorization, no cryptography, no digital signature, no chain of custody, no Key Vault, no HSM, no SIEM, no OpenTelemetry, no LGPD, no authentication, no authorization).",
} as const;

/** Versão canônica do Authorization Runtime Foundation. */
export const DEFAULT_AUTHORIZATION_RUNTIME_VERSION = AUTHORIZATION_RUNTIME_IDENTITY.version;

/** Gera id de request seguro para runtime sem depender de crypto real. */
export function createAuthorizationRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let authorizationResultSeq = 0;
let authorizationJobSeq = 0;
let authorizationRequestSeq = 0;
let authorizationFindingSeq = 0;
let authorizationIssueSeq = 0;
let authorizationRecommendationSeq = 0;
let authorizationJustificationSeq = 0;
let authorizationScoreSeq = 0;
let authorizationSummarySeq = 0;

/** Gera id estrutural para resultados canônicos (S3-02). */
export function createAuthorizationResultId(prefix = "authorization-result"): string {
  authorizationResultSeq += 1;
  return `${prefix}-${authorizationResultSeq.toString(36)}`;
}

/** Gera id estrutural para Authorization Job (S3-02). */
export function createAuthorizationJobId(prefix = "authorization-job"): string {
  authorizationJobSeq += 1;
  return `${prefix}-${authorizationJobSeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationRequest (S3-02). */
export function createAuthorizationRequestId(prefix = "authorization-request"): string {
  authorizationRequestSeq += 1;
  return `${prefix}-${authorizationRequestSeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationFinding (S3-02). */
export function createAuthorizationFindingId(prefix = "authorization-finding"): string {
  authorizationFindingSeq += 1;
  return `${prefix}-${authorizationFindingSeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationIssue (S3-02). */
export function createAuthorizationIssueId(prefix = "authorization-issue"): string {
  authorizationIssueSeq += 1;
  return `${prefix}-${authorizationIssueSeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationRecommendation (S3-02). */
export function createAuthorizationRecommendationId(
  prefix = "authorization-recommendation",
): string {
  authorizationRecommendationSeq += 1;
  return `${prefix}-${authorizationRecommendationSeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationJustification (S3-02). */
export function createAuthorizationJustificationId(prefix = "authorization-justification"): string {
  authorizationJustificationSeq += 1;
  return `${prefix}-${authorizationJustificationSeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationScore (S3-02). */
export function createAuthorizationScoreId(prefix = "authorization-score"): string {
  authorizationScoreSeq += 1;
  return `${prefix}-${authorizationScoreSeq.toString(36)}`;
}

/** Gera id estrutural para AuthorizationSummary (S3-02). */
export function createAuthorizationSummaryId(prefix = "authorization-summary"): string {
  authorizationSummarySeq += 1;
  return `${prefix}-${authorizationSummarySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllAuthorizationRuntimeIdSequences(): void {
  authorizationResultSeq = 0;
  authorizationJobSeq = 0;
  authorizationRequestSeq = 0;
  authorizationFindingSeq = 0;
  authorizationIssueSeq = 0;
  authorizationRecommendationSeq = 0;
  authorizationJustificationSeq = 0;
  authorizationScoreSeq = 0;
  authorizationSummarySeq = 0;
}
