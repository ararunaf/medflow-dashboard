/**
 * Cliente — Portão de Revisão de Regra Contratual (F2-S3).
 */
import {
  getContractRuleProposalsFn,
  getOperatorContractsForReviewFn,
  reviewContractRuleProposalFn,
} from "@/lib/capture/api/contract-rule-review-server";
import type {
  ContractRuleProposalView,
  OperatorContractSummary,
  ReviewContractRuleProposalResult,
} from "@/lib/capture/contract/review/contract-rule-review-service";
import type { ContractRuleReviewDecision } from "@/lib/capture/contract/review/contract-rule-review-decision";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

export async function fetchOperatorContractsForReview(): Promise<OperatorContractSummary[]> {
  const res = (await getOperatorContractsForReviewFn()) as QueryResult<OperatorContractSummary[]>;
  return unwrap<OperatorContractSummary[]>(res);
}

export async function fetchContractRuleProposals(
  operatorContractId: string,
): Promise<ContractRuleProposalView[]> {
  const res = (await getContractRuleProposalsFn({
    data: { operatorContractId },
  })) as QueryResult<ContractRuleProposalView[]>;
  return unwrap<ContractRuleProposalView[]>(res);
}

export async function submitContractRuleReview(input: {
  proposalId: string;
  decision: ContractRuleReviewDecision;
  reviewNotes?: string;
  editedDescription?: string;
  editedJustification?: string;
}): Promise<ReviewContractRuleProposalResult> {
  const res = (await reviewContractRuleProposalFn({
    data: input,
  })) as MutationResult<ReviewContractRuleProposalResult>;
  return unwrap<ReviewContractRuleProposalResult>(res);
}
