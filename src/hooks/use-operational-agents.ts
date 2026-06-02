import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import {
  approveOperationalAgentSessionFn,
  blockOperationalAgentSessionFn,
  loadOperationalAgentGovernanceBundleFn,
  runOperationalAgentReasoningCyclesFn,
  unblockOperationalAgentSessionFn,
} from "@/lib/operations/api";
import type { OperationalAgentGovernanceBundle } from "@/lib/operations/agents/contracts";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function useOperationalAgentsBundleQuery(opts: { enabled: boolean }) {
  return useQuery({
    queryKey: opsKeys.operationalAgents(),
    queryFn: async () =>
      unwrap(
        (await loadOperationalAgentGovernanceBundleFn()) as QueryResult<OperationalAgentGovernanceBundle>,
      ),
    staleTime: 20_000,
    enabled: opts.enabled,
  });
}

export function useOperationalAgentMutations() {
  const qc = useQueryClient();
  const inv = () => {
    void qc.invalidateQueries({ queryKey: opsKeys.operationalAgents() });
    void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
    void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
  };

  const runReasoning = useMutation({
    mutationFn: async () =>
      unwrap(
        (await runOperationalAgentReasoningCyclesFn()) as MutationResult<OperationalAgentGovernanceBundle>,
      ),
    onSuccess: () => inv(),
  });

  const approve = useMutation({
    mutationFn: async (input: { agentType: string; note?: string }) =>
      unwrap(
        (await approveOperationalAgentSessionFn({
          data: input,
        })) as MutationResult<OperationalAgentGovernanceBundle>,
      ),
    onSuccess: () => inv(),
  });

  const block = useMutation({
    mutationFn: async (input: { agentType: string; reason: string }) =>
      unwrap(
        (await blockOperationalAgentSessionFn({
          data: input,
        })) as MutationResult<OperationalAgentGovernanceBundle>,
      ),
    onSuccess: () => inv(),
  });

  const unblock = useMutation({
    mutationFn: async (input: { agentType: string }) =>
      unwrap(
        (await unblockOperationalAgentSessionFn({
          data: input,
        })) as MutationResult<OperationalAgentGovernanceBundle>,
      ),
    onSuccess: () => inv(),
  });

  return { runReasoning, approve, block, unblock };
}
