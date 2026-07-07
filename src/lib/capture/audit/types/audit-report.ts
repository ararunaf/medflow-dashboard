/**
 * Modelo AuditReport — persistido como audit_report.json.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 */
import type { TissGuideType } from "../../parser/types/tiss-guide-type";
import type { AuditFinding, CorrectionProposal } from "./audit-finding";

export type AuditScoreDistribution = {
  critico: number;
  alto: number;
  medio: number;
  baixo: number;
};

export type AuditScore = {
  /** Índice de qualidade 0–100 */
  overall: number;
  distribution: AuditScoreDistribution;
  /** Guia aprovada para submissão (sem bloqueios e score ≥ limiar) */
  approved: boolean;
  /** Guia bloqueante — possui findings críticos bloqueantes */
  blocking: boolean;
};

export type AuditReportSummary = {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  blockingCount: number;
  approved: boolean;
};

export type AuditReport = {
  version: "audit_report_v1";
  sessionId?: string;
  guideType: TissGuideType;
  auditedAt: string;
  engineVersion: string;
  score: AuditScore;
  findings: AuditFinding[];
  correctionProposals: CorrectionProposal[];
  summary: AuditReportSummary;
};

export type AuditReportSummaryMeta = {
  status: "pending" | "completed" | "failed";
  score?: number;
  approved?: boolean;
  blocking?: boolean;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  totalFindings?: number;
  storagePath?: string;
  auditDurationMs?: number;
  error?: string;
};
