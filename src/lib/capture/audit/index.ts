/**
 * Motor de Auditoria Preventiva — exports públicos.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 */
export type { AuditRule, AuditRuleCategory, AuditSeverity } from "./types/audit-rule";
export { ALL_AUDIT_RULES, getRulesByCategory, getRuleById, AUDIT_RULE_COUNT } from "./rules";
export { AUDIT_RULE_CATEGORIES, AUDIT_SEVERITIES } from "./types/audit-rule";

export type {
  AuditFinding,
  AuditFindingStatus,
  CorrectionProposal as AuditCorrectionProposal,
} from "./types/audit-finding";
export { AUDIT_FINDING_STATUSES } from "./types/audit-finding";

export type {
  AuditReport,
  AuditReportSummary,
  AuditReportSummaryMeta,
  AuditScore,
  AuditScoreDistribution,
} from "./types/audit-report";

export {
  PreventiveAuditEngine,
  AUDIT_ENGINE_VERSION,
  getDefaultPreventiveAuditEngine,
  auditStructuredGuide,
  type PreventiveAuditOptions,
  type PreventiveAuditResult,
} from "./engine/preventive-audit-engine";

export { buildAuditContext, type AuditRuleContext } from "./engine/audit-context";
export {
  calculateAuditScore,
  buildReportSummary,
  countBySeverity,
} from "./engine/score-calculator";

export {
  AUDIT_REPORT_FILENAME,
  buildAuditReportStoragePath,
  persistAuditReport,
  loadAuditReport,
  getAuditReportSignedUrl,
  buildAuditReportSummaryFromResult,
  buildAuditReportSummaryFromMetadata,
} from "./infrastructure/audit-storage";

export {
  PreventiveAuditService,
  getDefaultPreventiveAuditService,
  runCaptureAudit,
  getCaptureAuditReport,
  type RunCaptureAuditResult,
} from "./services/preventive-audit-service";

export { TUSS_CATALOG, isTussInCatalog, tussRequiresAuthorization } from "./data/tuss-catalog";
