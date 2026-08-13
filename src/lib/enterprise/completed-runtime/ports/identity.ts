/**
 * Identidade do Enterprise Completed Runtime — A10-02.
 *
 * Identity:
 *   Enterprise Completed Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 *
 * Sequências in-process para testes determinísticos. Sem UUID de rede, sem I/O.
 */

export const COMPLETED_RUNTIME_IDENTITY = {
  name: "Enterprise Completed Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Completed Runtime Foundation — vendor-agnostic structural completed entrypoint for future medical document / TISS / extracted-data completeding (no real completed, no AI, no TISS rules, no operator rules, no automatic correction).",
} as const;

/** Versão canônica do Completed Runtime Foundation. */
export const DEFAULT_COMPLETED_RUNTIME_VERSION = COMPLETED_RUNTIME_IDENTITY.version;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createCompletedRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let completedResultSeq = 0;
let completedJobSeq = 0;
let completedRequestSeq = 0;
let completedFindingSeq = 0;
let completedIssueSeq = 0;
let completedRecommendationSeq = 0;
let completedJustificationSeq = 0;
let completedScoreSeq = 0;
let completedSummarySeq = 0;

/** Gera id estrutural para resultados canônicos (A10-02). */
export function createCompletedResultId(prefix = "completed-result"): string {
  completedResultSeq += 1;
  return `${prefix}-${completedResultSeq.toString(36)}`;
}

/** Gera id estrutural para Completed Job (A10-02). */
export function createCompletedJobId(prefix = "completed-job"): string {
  completedJobSeq += 1;
  return `${prefix}-${completedJobSeq.toString(36)}`;
}

/** Gera id estrutural para CompletedRequest (A10-02). */
export function createCompletedRequestId(prefix = "completed-request"): string {
  completedRequestSeq += 1;
  return `${prefix}-${completedRequestSeq.toString(36)}`;
}

/** Gera id estrutural para CompletedFinding (A10-02). */
export function createCompletedFindingId(prefix = "completed-finding"): string {
  completedFindingSeq += 1;
  return `${prefix}-${completedFindingSeq.toString(36)}`;
}

/** Gera id estrutural para CompletedIssue (A10-02). */
export function createCompletedIssueId(prefix = "completed-issue"): string {
  completedIssueSeq += 1;
  return `${prefix}-${completedIssueSeq.toString(36)}`;
}

/** Gera id estrutural para CompletedRecommendation (A10-02). */
export function createCompletedRecommendationId(prefix = "completed-recommendation"): string {
  completedRecommendationSeq += 1;
  return `${prefix}-${completedRecommendationSeq.toString(36)}`;
}

/** Gera id estrutural para CompletedJustification (A10-02). */
export function createCompletedJustificationId(prefix = "completed-justification"): string {
  completedJustificationSeq += 1;
  return `${prefix}-${completedJustificationSeq.toString(36)}`;
}

/** Gera id estrutural para CompletedScore (A10-02). */
export function createCompletedScoreId(prefix = "completed-score"): string {
  completedScoreSeq += 1;
  return `${prefix}-${completedScoreSeq.toString(36)}`;
}

/** Gera id estrutural para CompletedSummary (A10-02). */
export function createCompletedSummaryId(prefix = "completed-summary"): string {
  completedSummarySeq += 1;
  return `${prefix}-${completedSummarySeq.toString(36)}`;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllCompletedRuntimeIdSequences(): void {
  completedResultSeq = 0;
  completedJobSeq = 0;
  completedRequestSeq = 0;
  completedFindingSeq = 0;
  completedIssueSeq = 0;
  completedRecommendationSeq = 0;
  completedJustificationSeq = 0;
  completedScoreSeq = 0;
  completedSummarySeq = 0;
}
