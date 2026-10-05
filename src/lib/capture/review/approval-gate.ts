/**
 * Portão de aprovação da revisão de guia.
 *
 * Achado bloqueante aberto — da auditoria preventiva genérica OU de cláusula
 * de contrato aprovada (source="contract", ex.: prazo de apresentação
 * vencido) — impede "aprovada" sem justificativa. A palavra final continua
 * com o auditor humano (falso positivo de OCR não pode travar a operação),
 * mas a sobreposição fica registrada na decisão com os achados envolvidos.
 *
 * Lógica pura: usada no servidor (setReviewApprovalDecision, fonte da
 * verdade) e na tela (ReviewApprovalPanel, só para orientar o revisor).
 */
import type { AuditFinding } from "../audit/types/audit-finding";
import type { AuditReport } from "../audit/types/audit-report";
import type { ContractIntelligenceReport } from "../contract/types/contract-intelligence-report";

export const MIN_BLOCKING_OVERRIDE_JUSTIFICATION = 20;

export type BlockingFinding = {
  key: string;
  ruleId: string;
  field: string;
  message: string;
  source: "auditoria" | "contrato";
};

export function collectBlockingFindings(
  auditReport: Pick<AuditReport, "findings"> | null | undefined,
  contractReport: Pick<ContractIntelligenceReport, "findings"> | null | undefined,
): BlockingFinding[] {
  const out = new Map<string, BlockingFinding>();
  const add = (f: AuditFinding, source: BlockingFinding["source"]) => {
    if (!f.blocking || f.status !== "open") return;
    const key = `${f.ruleId}:${f.field}`;
    if (!out.has(key)) out.set(key, { key, ruleId: f.ruleId, field: f.field, message: f.message, source });
  };
  for (const f of auditReport?.findings ?? []) add(f, "auditoria");
  for (const e of contractReport?.findings ?? []) {
    if (e.finding.source === "contract") add(e.finding, "contrato");
  }
  return [...out.values()];
}

export type ApprovalGateResult =
  | { allowed: true; overriddenBlockingFindings: string[] }
  | { allowed: false; reason: string; blocking: BlockingFinding[] };

export function evaluateApprovalGate(
  status: string,
  blocking: readonly BlockingFinding[],
  note: string | undefined,
): ApprovalGateResult {
  if (status !== "aprovada" || blocking.length === 0) {
    return { allowed: true, overriddenBlockingFindings: [] };
  }
  if ((note?.trim().length ?? 0) < MIN_BLOCKING_OVERRIDE_JUSTIFICATION) {
    return {
      allowed: false,
      reason: `A guia tem ${blocking.length} achado(s) bloqueante(s) em aberto. Para aprovar mesmo assim, registre uma justificativa com pelo menos ${MIN_BLOCKING_OVERRIDE_JUSTIFICATION} caracteres.`,
      blocking: [...blocking],
    };
  }
  return { allowed: true, overriddenBlockingFindings: blocking.map((b) => b.key) };
}
