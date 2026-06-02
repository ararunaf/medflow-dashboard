import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import {
  loadOperationalAgentCoordinationBundleFn,
  runOperationalAgentCoordinationCycleFn,
} from "@/lib/operations/api";
import type { OperationalAgentCoordinationBundle } from "@/lib/operations/agents/coordination/types";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function useOperationalAgentCoordinationBundleQuery(opts: { enabled: boolean }) {
  return useQuery({
    queryKey: opsKeys.agentCoordination(),
    queryFn: async () =>
      unwrap(
        (await loadOperationalAgentCoordinationBundleFn()) as QueryResult<OperationalAgentCoordinationBundle>,
      ),
    staleTime: 15_000,
    enabled: opts.enabled,
  });
}

export function useOperationalAgentCoordinationMutations() {
  const qc = useQueryClient();
  const inv = () => {
    void qc.invalidateQueries({ queryKey: opsKeys.agentCoordination() });
    void qc.invalidateQueries({ queryKey: opsKeys.operationalAgents() });
    void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
    void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
  };

  const runCycle = useMutation({
    mutationFn: async () =>
      unwrap(
        (await runOperationalAgentCoordinationCycleFn()) as MutationResult<OperationalAgentCoordinationBundle>,
      ),
    onSuccess: () => inv(),
  });

  return { runCycle };
}
