/**
 * Modelo CorrectionProposal — Correção Assistida.
 * MEDICFLOW-CORRECTION-ASSISTANT-01
 */
import type { AuditSeverity } from "../../audit/types/audit-rule";

export const CORRECTION_PROPOSAL_STATUSES = [
  "pending",
  "accepted",
  "edited",
  "rejected",
  "applied",
] as const;

export type CorrectionProposalStatus = (typeof CORRECTION_PROPOSAL_STATUSES)[number];

export const CORRECTION_SOURCES = ["TISS", "TUSS", "Contrato", "Regra interna"] as const;

export type CorrectionSource = (typeof CORRECTION_SOURCES)[number];

export type CorrectionProposal = {
  proposalId: string;
  findingId: string;
  ruleId: string;
  field: string;
  currentValue: string | null;
  suggestedValue: string | null;
  /** Valor informado pelo usuário ao editar a proposta */
  editedValue?: string | null;
  confidence: number;
  justification: string;
  source: CorrectionSource;
  legalReference?: string;
  status: CorrectionProposalStatus;
  blocking: boolean;
  severity: AuditSeverity;
  decidedAt?: string;
};

export type CorrectionProposalStore = {
  version: "correction_proposals_v1";
  sessionId: string;
  generatedAt: string;
  engineVersion: string;
  proposals: CorrectionProposal[];
};

export type CorrectionProposalSummaryMeta = {
  status: "pending" | "completed" | "failed";
  totalProposals?: number;
  pendingCount?: number;
  acceptedCount?: number;
  editedCount?: number;
  rejectedCount?: number;
  appliedCount?: number;
  storagePath?: string;
  error?: string;
};
