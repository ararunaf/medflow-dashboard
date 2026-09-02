/**
 * Portão de revisão humana de regra contratual — F2-S3.
 *
 * `ctx.client` carrega o JWT do usuário autenticado — RLS aplica de verdade
 * (contract_rule_proposals_update_review / contract_rule_versions_insert_review,
 * ver 20260902150000_contract_rule_review_gate.sql). O check de
 * `can_manage_billing` aqui é defesa em profundidade para retornar um erro
 * de domínio amigável em vez de deixar a operação falhar silenciosamente
 * (RLS bloqueia, mas não explica por quê).
 */
import { can } from "@/lib/auth/rbac";
import { ConflictError, NotFoundError, PermissionError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  buildContractRuleVersionInsert,
  validateReviewInput,
  type ContractRuleProposalRow,
  type ReviewContractRuleProposalInput,
} from "./contract-rule-review-decision";
import type { ContractRuleCategory } from "../types/contract-rule-proposal";

function assertCanReview(ctx: ServiceCtx): void {
  if (!can(ctx.role, "financial_closing:read")) {
    throw new PermissionError("Sem permissão para revisar regras contratuais.");
  }
}

export type OperatorContractSummary = {
  id: string;
  operatorCode: string;
  operatorName: string | null;
  contractLabel: string;
  status: string;
  chunkCount: number;
  pendingProposals: number;
  totalProposals: number;
};

export async function listOperatorContractsForReview(
  ctx: ServiceCtx,
): Promise<OperatorContractSummary[]> {
  assertCanReview(ctx);

  const { data: contracts, error: contractsErr } = await ctx.client
    .from("operator_contracts")
    .select("id, operator_code, operator_name, contract_label, status, chunk_count")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });
  if (contractsErr) throw contractsErr;

  const { data: proposals, error: proposalsErr } = await ctx.client
    .from("contract_rule_proposals")
    .select("operator_contract_id, status")
    .eq("tenant_id", ctx.tenantId);
  if (proposalsErr) throw proposalsErr;

  const counts = new Map<string, { pending: number; total: number }>();
  for (const p of proposals ?? []) {
    const entry = counts.get(p.operator_contract_id) ?? { pending: 0, total: 0 };
    entry.total += 1;
    if (p.status === "pending") entry.pending += 1;
    counts.set(p.operator_contract_id, entry);
  }

  return (contracts ?? []).map((c) => ({
    id: c.id,
    operatorCode: c.operator_code,
    operatorName: c.operator_name,
    contractLabel: c.contract_label,
    status: c.status,
    chunkCount: c.chunk_count,
    pendingProposals: counts.get(c.id)?.pending ?? 0,
    totalProposals: counts.get(c.id)?.total ?? 0,
  }));
}

export type ContractRuleProposalView = {
  id: string;
  category: ContractRuleCategory;
  description: string;
  justification: string;
  citationHeading: string | null;
  citationExcerpt: string;
  confidence: number;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  editedDescription: string | null;
  editedJustification: string | null;
};

export async function listContractRuleProposals(
  ctx: ServiceCtx,
  operatorContractId: string,
): Promise<ContractRuleProposalView[]> {
  assertCanReview(ctx);

  const { data, error } = await ctx.client
    .from("contract_rule_proposals")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("operator_contract_id", operatorContractId)
    .order("category", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    category: p.category as ContractRuleCategory,
    description: p.description,
    justification: p.justification,
    citationHeading: p.citation_heading,
    citationExcerpt: p.citation_excerpt,
    confidence: p.confidence,
    status: p.status,
    reviewedBy: p.reviewed_by,
    reviewedAt: p.reviewed_at,
    reviewNotes: p.review_notes,
    editedDescription: p.edited_description,
    editedJustification: p.edited_justification,
  }));
}

export type ReviewContractRuleProposalResult = {
  proposal: ContractRuleProposalView;
  versionCreated: boolean;
};

export async function reviewContractRuleProposal(
  ctx: ServiceCtx,
  input: ReviewContractRuleProposalInput,
): Promise<ReviewContractRuleProposalResult> {
  assertCanReview(ctx);
  validateReviewInput(input);

  const { data: proposal, error: fetchErr } = await ctx.client
    .from("contract_rule_proposals")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.proposalId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!proposal) throw new NotFoundError("Proposta de regra contratual", input.proposalId);
  if (proposal.status !== "pending") {
    throw new ConflictError("Esta proposta já foi revisada.");
  }

  const { data: contract, error: contractErr } = await ctx.client
    .from("operator_contracts")
    .select("operator_code, contract_label")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", proposal.operator_contract_id)
    .maybeSingle();
  if (contractErr) throw contractErr;
  if (!contract) throw new NotFoundError("Contrato de operadora", proposal.operator_contract_id);

  const now = new Date().toISOString();
  const proposalRow: ContractRuleProposalRow = {
    id: proposal.id,
    tenant_id: proposal.tenant_id,
    operator_contract_id: proposal.operator_contract_id,
    category: proposal.category as ContractRuleCategory,
    description: proposal.description,
    justification: proposal.justification,
    citation_heading: proposal.citation_heading,
    citation_excerpt: proposal.citation_excerpt,
  };

  const versionInsert = buildContractRuleVersionInsert(
    proposalRow,
    contract,
    input,
    ctx.actorProfileId,
  );

  // A versão é criada ANTES de marcar a proposta como revisada: se a
  // versão falhar, a proposta continua 'pending' e pode ser revisada de
  // novo — nunca fica marcada como aprovada sem a regra correspondente
  // existir.
  let versionCreated = false;
  if (versionInsert) {
    const { error: versionErr } = await ctx.client.from("contract_rule_versions").insert(versionInsert);
    if (versionErr) throw versionErr;
    versionCreated = true;
  }

  const { data: updated, error: updateErr } = await ctx.client
    .from("contract_rule_proposals")
    .update({
      status: input.decision,
      reviewed_by: ctx.actorProfileId,
      reviewed_at: now,
      review_notes: input.reviewNotes ?? null,
      edited_description: input.decision === "edited" ? input.editedDescription : null,
      edited_justification: input.decision === "edited" ? input.editedJustification : null,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.proposalId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (updateErr) throw updateErr;
  if (!updated) throw new ConflictError("Esta proposta já foi revisada por outra pessoa.");

  return {
    proposal: {
      id: updated.id,
      category: updated.category as ContractRuleCategory,
      description: updated.description,
      justification: updated.justification,
      citationHeading: updated.citation_heading,
      citationExcerpt: updated.citation_excerpt,
      confidence: updated.confidence,
      status: updated.status,
      reviewedBy: updated.reviewed_by,
      reviewedAt: updated.reviewed_at,
      reviewNotes: updated.review_notes,
      editedDescription: updated.edited_description,
      editedJustification: updated.edited_justification,
    },
    versionCreated,
  };
}
