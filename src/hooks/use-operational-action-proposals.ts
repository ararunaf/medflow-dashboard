import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveOperationalActionProposalFn,
  listOperationalActionProposalsFn,
  rejectOperationalActionProposalFn,
  submitOperationalActionProposalForConfirmationFn,
} from "@/lib/operations/api";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function useOperationalActionProposalsQuery(opts: { enabled: boolean }) {
  return useQuery({
    queryKey: opsKeys.actionProposals(),
    queryFn: async () => unwrap(await listOperationalActionProposalsFn()),
    staleTime: 25_000,
    enabled: opts.enabled,
  });
}

export function useOperationalActionProposalMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: opsKeys.actionProposals() });
    void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
  };

  const submitForConfirmation = useMutation({
    mutationFn: async (proposalId: string) =>
      unwrap(await submitOperationalActionProposalForConfirmationFn({ data: { proposalId } })),
    onSuccess: invalidate,
  });

  const approve = useMutation({
    mutationFn: async (input: { proposalId: string; note?: string | null }) =>
      unwrap(await approveOperationalActionProposalFn({ data: input })),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: async (input: { proposalId: string; justification: string }) =>
      unwrap(await rejectOperationalActionProposalFn({ data: input })),
    onSuccess: invalidate,
  });

  return { submitForConfirmation, approve, reject };
}
