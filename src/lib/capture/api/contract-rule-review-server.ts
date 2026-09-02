/**
 * Server functions — Portão de Revisão de Regra Contratual (F2-S3).
 */
import { createServerFn } from "@tanstack/react-start";
import {
  optionalString,
  requireObject,
  requireString,
  runMutation,
  runQuery,
} from "@/lib/server/fn-helpers";
import {
  listContractRuleProposals,
  listOperatorContractsForReview,
  reviewContractRuleProposal,
} from "../contract/review/contract-rule-review-service";
import {
  CONTRACT_RULE_REVIEW_DECISIONS,
  type ContractRuleReviewDecision,
} from "../contract/review/contract-rule-review-decision";

function parseOperatorContractId(raw: unknown): { operatorContractId: string } {
  const obj =
    typeof raw === "object" && raw && "operatorContractId" in raw
      ? (raw as Record<string, unknown>)
      : { operatorContractId: raw };
  return { operatorContractId: requireString(obj.operatorContractId, "operatorContractId") };
}

function parseReviewInput(raw: unknown) {
  const obj = requireObject(raw);
  const decision = requireString(obj.decision, "decision");
  if (!(CONTRACT_RULE_REVIEW_DECISIONS as readonly string[]).includes(decision)) {
    throw new Error(`decision inválida: ${decision}`);
  }
  return {
    proposalId: requireString(obj.proposalId, "proposalId"),
    decision: decision as ContractRuleReviewDecision,
    reviewNotes: optionalString(obj.reviewNotes, "reviewNotes"),
    editedDescription: optionalString(obj.editedDescription, "editedDescription"),
    editedJustification: optionalString(obj.editedJustification, "editedJustification"),
  };
}

export const getOperatorContractsForReviewFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return runQuery((ctx) => listOperatorContractsForReview(ctx));
  },
);

export const getContractRuleProposalsFn = createServerFn({ method: "GET" })
  .inputValidator(parseOperatorContractId)
  .handler(async ({ data }) => {
    return runQuery((ctx) => listContractRuleProposals(ctx, data.operatorContractId));
  });

export const reviewContractRuleProposalFn = createServerFn({ method: "POST" })
  .inputValidator(parseReviewInput)
  .handler(async ({ data }) => {
    return runMutation((ctx) => reviewContractRuleProposal(ctx, data));
  });
