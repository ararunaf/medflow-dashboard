/**
 * Identidade do Enterprise Tenant Runtime — S3-02.
 *
 * Tenant:
 *   Enterprise Tenant Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 * Sem criptografia real. Sem crypto module obrigatório.
 */

export const TENANT_RUNTIME_IDENTITY = {
  name: "Enterprise Tenant Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Tenant Runtime Foundation — vendor-agnostic structural tenant entrypoint for future medical document / TISS / extracted-data tenant scaffolding (no real tenant, no cryptography, no digital signature, no chain of custody, no Key Vault, no HSM, no SIEM, no OpenTelemetry, no LGPD, no authentication, no tenant).",
} as const;

/** Versão canônica do Tenant Runtime Foundation. */
export const DEFAULT_TENANT_RUNTIME_VERSION = TENANT_RUNTIME_IDENTITY.version;

/** Gera id de request seguro para runtime sem depender de crypto real. */
export function createTenantRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let tenantResultSeq = 0;
let tenantJobSeq = 0;
let tenantRequestSeq = 0;
let tenantFindingSeq = 0;
let tenantIssueSeq = 0;
let tenantRecommendationSeq = 0;
let tenantJustificationSeq = 0;
let tenantScoreSeq = 0;
let tenantSummarySeq = 0;

/** Gera id estrutural para resultados canônicos (S3-02). */
export function createTenantResultId(prefix = "tenant-result"): string {
  tenantResultSeq += 1;
  return `${prefix}-${tenantResultSeq.toString(36)}`;
}

/** Gera id estrutural para Tenant Job (S3-02). */
export function createTenantJobId(prefix = "tenant-job"): string {
  tenantJobSeq += 1;
  return `${prefix}-${tenantJobSeq.toString(36)}`;
}

/** Gera id estrutural para TenantRequest (S3-02). */
export function createTenantRequestId(prefix = "tenant-request"): string {
  tenantRequestSeq += 1;
  return `${prefix}-${tenantRequestSeq.toString(36)}`;
}

/** Gera id estrutural para TenantFinding (S3-02). */
export function createTenantFindingId(prefix = "tenant-finding"): string {
  tenantFindingSeq += 1;
  return `${prefix}-${tenantFindingSeq.toString(36)}`;
}

/** Gera id estrutural para TenantIssue (S3-02). */
export function createTenantIssueId(prefix = "tenant-issue"): string {
  tenantIssueSeq += 1;
  return `${prefix}-${tenantIssueSeq.toString(36)}`;
}

/** Gera id estrutural para TenantRecommendation (S3-02). */
export function createTenantRecommendationId(prefix = "tenant-recommendation"): string {
  tenantRecommendationSeq += 1;
  return `${prefix}-${tenantRecommendationSeq.toString(36)}`;
}

/** Gera id estrutural para TenantJustification (S3-02). */
export function createTenantJustificationId(prefix = "tenant-justification"): string {
  tenantJustificationSeq += 1;
  return `${prefix}-${tenantJustificationSeq.toString(36)}`;
}

/** Gera id estrutural para TenantScore (S3-02). */
export function createTenantScoreId(prefix = "tenant-score"): string {
  tenantScoreSeq += 1;
  return `${prefix}-${tenantScoreSeq.toString(36)}`;
}

/** Gera id estrutural para TenantSummary (S3-02). */
export function createTenantSummaryId(prefix = "tenant-summary"): string {
  tenantSummarySeq += 1;
  return `${prefix}-${tenantSummarySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllTenantRuntimeIdSequences(): void {
  tenantResultSeq = 0;
  tenantJobSeq = 0;
  tenantRequestSeq = 0;
  tenantFindingSeq = 0;
  tenantIssueSeq = 0;
  tenantRecommendationSeq = 0;
  tenantJustificationSeq = 0;
  tenantScoreSeq = 0;
  tenantSummarySeq = 0;
}
