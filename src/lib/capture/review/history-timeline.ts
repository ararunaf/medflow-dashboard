/**
 * Timeline unificado da sessão de captura — MEDICFLOW-REVIEW-WORKSPACE-01.
 *
 * Não é uma tabela nova nem um evento novo: junta três históricos que já são
 * persistidos e simplesmente nunca tinham sido combinados numa única visão
 * cronológica — status_history (transições de pipeline), review.decisions
 * (decisões de aprovação) e correction proposals (decidedAt por correção).
 */
import { CAPTURE_STATUS_LABELS } from "../state-machine";
import type { CaptureStatusHistoryEntry } from "../types";
import type { ReviewApprovalDecision } from "./types";
import type { CorrectionProposal } from "../correction/types/correction-proposal";

export type CaptureHistoryEventKind = "pipeline" | "aprovacao" | "correcao";

export type CaptureHistoryEvent = {
  at: string;
  kind: CaptureHistoryEventKind;
  label: string;
  detail?: string;
  actorProfileId?: string;
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  em_revisao: "Marcada em revisão",
  aguardando_correcoes: "Marcada aguardando correções",
  aprovada: "Guia aprovada",
  reprovada: "Guia reprovada",
};

const CORRECTION_STATUS_LABELS: Record<string, string> = {
  accepted: "Correção aceita",
  edited: "Correção editada",
  rejected: "Correção rejeitada",
  applied: "Correção aplicada",
};

export function buildCaptureHistoryTimeline(input: {
  statusHistory: readonly CaptureStatusHistoryEntry[];
  decisions: readonly ReviewApprovalDecision[];
  correctionProposals: readonly CorrectionProposal[];
}): CaptureHistoryEvent[] {
  const events: CaptureHistoryEvent[] = [];

  for (const entry of input.statusHistory) {
    events.push({
      at: entry.at,
      kind: "pipeline",
      label: CAPTURE_STATUS_LABELS[entry.to] ?? entry.to,
      detail: entry.note,
      actorProfileId: entry.actorProfileId,
    });
  }

  for (const decision of input.decisions) {
    events.push({
      at: decision.at,
      kind: "aprovacao",
      label: APPROVAL_STATUS_LABELS[decision.status] ?? decision.status,
      detail: decision.note,
      actorProfileId: decision.actorProfileId,
    });
  }

  for (const proposal of input.correctionProposals) {
    if (!proposal.decidedAt || proposal.status === "pending") continue;
    events.push({
      at: proposal.decidedAt,
      kind: "correcao",
      label: `${CORRECTION_STATUS_LABELS[proposal.status] ?? proposal.status} — ${proposal.ruleId}`,
      detail: proposal.field,
    });
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
