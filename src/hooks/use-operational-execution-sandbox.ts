import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runOperationalSandboxSimulationFn } from "@/lib/operations/api";
import type { OperationalSimulationResult } from "@/lib/operations/execution-sandbox";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export type RunSandboxSimulationVars = {
  proposalId: string;
  maxAffectedEntities?: number;
};

export function useOperationalSandboxMutation() {
  const qc = useQueryClient();
  return useMutation<OperationalSimulationResult, unknown, RunSandboxSimulationVars>({
    mutationFn: async (vars) =>
      unwrap(
        await runOperationalSandboxSimulationFn({
          data: {
            proposalId: vars.proposalId,
            maxAffectedEntities: vars.maxAffectedEntities,
          },
        }),
      ),
    onSuccess: () => {
      // Sandbox grava trilha em operational_events — invalidação leve da timeline.
      void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      void qc.invalidateQueries({ queryKey: [...opsKeys.all, "operational-mutation-executions"] });
    },
  });
}
