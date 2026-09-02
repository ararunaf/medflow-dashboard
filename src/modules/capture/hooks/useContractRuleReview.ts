import { useCallback, useEffect, useState } from "react";
import type { ContractRuleProposalView } from "@/lib/capture/contract/review/contract-rule-review-service";
import type { ContractRuleReviewDecision } from "@/lib/capture/contract/review/contract-rule-review-decision";
import { fetchContractRuleProposals, submitContractRuleReview } from "../services/contract-rule-review-client";

export type SubmitContractRuleReviewInput = {
  proposalId: string;
  decision: ContractRuleReviewDecision;
  reviewNotes?: string;
  editedDescription?: string;
  editedJustification?: string;
};

export function useContractRuleReview(operatorContractId: string) {
  const [proposals, setProposals] = useState<ContractRuleProposalView[]>([]);
  const [busy, setBusy] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchContractRuleProposals(operatorContractId);
      setProposals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [operatorContractId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const review = useCallback(async (input: SubmitContractRuleReviewInput) => {
    setReviewingId(input.proposalId);
    setError(null);
    try {
      const result = await submitContractRuleReview(input);
      setProposals((prev) => prev.map((p) => (p.id === result.proposal.id ? result.proposal : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setReviewingId(null);
    }
  }, []);

  return { proposals, busy, reviewingId, error, refresh, review };
}
