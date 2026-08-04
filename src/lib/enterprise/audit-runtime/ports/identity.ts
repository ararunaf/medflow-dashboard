/**
 * Identidade do Enterprise Audit Runtime — F3-CAP-10.
 *
 * Identity:
 *   Enterprise Audit Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const AUDIT_RUNTIME_IDENTITY = {
  name: "Enterprise Audit Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Audit Runtime Foundation — vendor-agnostic structural audit entrypoint for future medical document / TISS / extracted-data auditing (no real audit, no AI, no TISS rules, no operator rules, no automatic correction).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createAuditRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let auditResultSeq = 0;
let auditJobSeq = 0;
let auditRequestSeq = 0;
let auditFindingSeq = 0;
let auditIssueSeq = 0;
let auditRecommendationSeq = 0;
let auditJustificationSeq = 0;
let auditScoreSeq = 0;
let auditSummarySeq = 0;

/** Gera id estrutural para resultados canônicos (F3-CAP-10). */
export function createAuditResultId(prefix = "audit-result"): string {
  auditResultSeq += 1;
  return `${prefix}-${auditResultSeq.toString(36)}`;
}

/** Gera id estrutural para Audit Job (F3-CAP-10). */
export function createAuditJobId(prefix = "audit-job"): string {
  auditJobSeq += 1;
  return `${prefix}-${auditJobSeq.toString(36)}`;
}

/** Gera id estrutural para AuditRequest (F3-CAP-10). */
export function createAuditRequestId(prefix = "audit-request"): string {
  auditRequestSeq += 1;
  return `${prefix}-${auditRequestSeq.toString(36)}`;
}

/** Gera id estrutural para AuditFinding (F3-CAP-10). */
export function createAuditFindingId(prefix = "audit-finding"): string {
  auditFindingSeq += 1;
  return `${prefix}-${auditFindingSeq.toString(36)}`;
}

/** Gera id estrutural para AuditIssue (F3-CAP-10). */
export function createAuditIssueId(prefix = "audit-issue"): string {
  auditIssueSeq += 1;
  return `${prefix}-${auditIssueSeq.toString(36)}`;
}

/** Gera id estrutural para AuditRecommendation (F3-CAP-10). */
export function createAuditRecommendationId(prefix = "audit-recommendation"): string {
  auditRecommendationSeq += 1;
  return `${prefix}-${auditRecommendationSeq.toString(36)}`;
}

/** Gera id estrutural para AuditJustification (F3-CAP-10). */
export function createAuditJustificationId(prefix = "audit-justification"): string {
  auditJustificationSeq += 1;
  return `${prefix}-${auditJustificationSeq.toString(36)}`;
}

/** Gera id estrutural para AuditScore (F3-CAP-10). */
export function createAuditScoreId(prefix = "audit-score"): string {
  auditScoreSeq += 1;
  return `${prefix}-${auditScoreSeq.toString(36)}`;
}

/** Gera id estrutural para AuditSummary (F3-CAP-10). */
export function createAuditSummaryId(prefix = "audit-summary"): string {
  auditSummarySeq += 1;
  return `${prefix}-${auditSummarySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllAuditRuntimeIdSequences(): void {
  auditResultSeq = 0;
  auditJobSeq = 0;
  auditRequestSeq = 0;
  auditFindingSeq = 0;
  auditIssueSeq = 0;
  auditRecommendationSeq = 0;
  auditJustificationSeq = 0;
  auditScoreSeq = 0;
  auditSummarySeq = 0;
}
