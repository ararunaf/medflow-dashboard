/**
 * Lógica pura do portão de revisão de regra contratual — F2-S3.
 *
 * Separado da camada de I/O (contract-rule-review-service.ts) para ser
 * testável sem Supabase, mesmo padrão de decideCapturePipelineJobOutcome
 * (F1-S4) e parseContractExtractionResponse (F2-S2).
 */
import { ValidationError } from "@/lib/domain/operations/errors";
import type { ContractRuleCategory } from "../types/contract-rule-proposal";

export const CONTRACT_RULE_REVIEW_DECISIONS = ["approved", "rejected", "edited"] as const;
export type ContractRuleReviewDecision = (typeof CONTRACT_RULE_REVIEW_DECISIONS)[number];

export type ReviewContractRuleProposalInput = {
  proposalId: string;
  decision: ContractRuleReviewDecision;
  reviewNotes?: string;
  editedDescription?: string;
  editedJustification?: string;
};

/** Lança ValidationError quando o input da decisão é inválido. */
export function validateReviewInput(input: ReviewContractRuleProposalInput): void {
  if (input.decision === "edited") {
    if (!input.editedDescription || input.editedDescription.trim().length === 0) {
      throw new ValidationError("Decisão 'edited' exige editedDescription preenchida.");
    }
    if (!input.editedJustification || input.editedJustification.trim().length === 0) {
      throw new ValidationError("Decisão 'edited' exige editedJustification preenchida.");
    }
  }
}

export type ContractRuleProposalRow = {
  id: string;
  tenant_id: string;
  operator_contract_id: string;
  category: ContractRuleCategory;
  description: string;
  justification: string;
  citation_heading: string | null;
  citation_excerpt: string;
};

export type OperatorContractIdentity = {
  operator_code: string;
  contract_label: string;
};

export type ContractRuleVersionInsert = {
  tenant_id: string;
  operator_contract_id: string;
  proposal_id: string;
  rule_id: string;
  version: number;
  operator_code: string;
  contract_label: string;
  category: ContractRuleCategory;
  description: string;
  justification: string;
  citation_heading: string | null;
  citation_excerpt: string;
  approved_by: string;
};

/**
 * Monta a linha de contract_rule_versions para uma decisão 'approved' ou
 * 'edited' — retorna null para 'rejected' (uma regra rejeitada nunca vira
 * versão). Uma regra editada usa o texto editado pelo revisor, não o
 * proposto originalmente pelo modelo — a versão é o que o humano decidiu
 * que a regra diz, com a citação original preservada para auditoria.
 */
export function buildContractRuleVersionInsert(
  proposal: ContractRuleProposalRow,
  contract: OperatorContractIdentity,
  input: ReviewContractRuleProposalInput,
  approvedBy: string,
): ContractRuleVersionInsert | null {
  if (input.decision === "rejected") return null;

  const description = input.decision === "edited" ? input.editedDescription! : proposal.description;
  const justification =
    input.decision === "edited" ? input.editedJustification! : proposal.justification;

  return {
    tenant_id: proposal.tenant_id,
    operator_contract_id: proposal.operator_contract_id,
    proposal_id: proposal.id,
    // Cada proposta aprovada vira a v1 de uma regra nova — ver comentário
    // na migração sobre versionamento de recontratos futuros.
    rule_id: proposal.id,
    version: 1,
    operator_code: contract.operator_code,
    contract_label: contract.contract_label,
    category: proposal.category,
    description,
    justification,
    citation_heading: proposal.citation_heading,
    citation_excerpt: proposal.citation_excerpt,
    approved_by: approvedBy,
  };
}
