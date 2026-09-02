/**
 * FieldAuditReport — saída persistida do Field Audit Agent (F2-S4).
 */
import type { FieldAuditOpinion } from "./field-audit-opinion";

export type FieldAuditReport = {
  version: "field_audit_v1";
  sessionId: string;
  generatedAt: string;
  model: string;
  opinions: FieldAuditOpinion[];
  summary: {
    fieldsWithFindings: number;
    opinionsGenerated: number;
    criticalCount: number;
    attentionCount: number;
  };
};

export type FieldAuditSummaryMeta = {
  status: "pending" | "completed" | "failed";
  opinionsGenerated?: number;
  criticalCount?: number;
  attentionCount?: number;
  storagePath?: string;
  durationMs?: number;
  error?: string;
};
