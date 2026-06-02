import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  executeSupervisedOperationalMutationsFn,
  listOperationalMutationExecutionsForProposalFn,
  rollbackSupervisedOperationalMutationExecutionFn,
} from "@/lib/operations/api";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function useOperationalMutationExecutionsQuery(opts: {
  proposalId: string;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: opsKeys.mutationExecutions(opts.proposalId),
    queryFn: async () =>
      unwrap(
        await listOperationalMutationExecutionsForProposalFn({
          data: { proposalId: opts.proposalId },
        }),
      ),
    staleTime: 12_000,
    enabled: opts.enabled && opts.proposalId.length > 0,
  });
}

function invalidateExecutionUniverse(qc: ReturnType<typeof useQueryClient>, proposalId: string) {
  void qc.invalidateQueries({ queryKey: opsKeys.mutationExecutions(proposalId) });
  void qc.invalidateQueries({ queryKey: opsKeys.actionProposals() });
  void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
  void qc.invalidateQueries({ queryKey: opsKeys.assignments() });
  void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
}

export function useOperationalMutationExecutionMutations(proposalId: string) {
  const qc = useQueryClient();

  const execute = useMutation({
    mutationFn: async (input: { sandboxRunId: string; approvalConfirmed: boolean }) =>
      unwrap(
        await executeSupervisedOperationalMutationsFn({
          data: {
            proposalId,
            sandboxRunId: input.sandboxRunId,
            approvalConfirmed: input.approvalConfirmed,
            idempotencyKey:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          },
        }),
      ),
    onSuccess: () => invalidateExecutionUniverse(qc, proposalId),
  });

  const rollback = useMutation({
    mutationFn: async (executionId: string) =>
      unwrap(await rollbackSupervisedOperationalMutationExecutionFn({ data: { executionId } })),
    onSuccess: () => invalidateExecutionUniverse(qc, proposalId),
  });

  return { execute, rollback };
}
