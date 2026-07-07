/**
 * Modelo AuditFinding — Motor de Auditoria Preventiva.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 */
import type { AuditRuleCategory, AuditSeverity } from "./audit-rule";

export const AUDIT_FINDING_STATUSES = ["open", "resolved", "waived"] as const;

export type AuditFindingStatus = (typeof AUDIT_FINDING_STATUSES)[number];

export type AuditFinding = {
  ruleId: string;
  category: AuditRuleCategory;
  field: string;
  severity: AuditSeverity;
  status: AuditFindingStatus;
  message: string;
  detectedValue: string | null;
  expectedValue: string | null;
  confidence: number;
  suggestedCorrection: string;
  blocking: boolean;
};

export type CorrectionProposal = {
  findingRuleId: string;
  field: string;
  action: "fix_field" | "link_authorization" | "upload_document" | "revalidate";
  description: string;
  autoFixable: false;
};
