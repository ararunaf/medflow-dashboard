import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import type { OperationalOrchestrationDto } from "@/lib/operations/orchestration/types";
import {
  advanceOperationalProposalGateFn,
  approveOperationalOrchestrationFn,
  createOperationalOrchestrationFn,
  executeNextOperationalOrchestrationMutationFn,
  getOperationalOrchestrationByIdFn,
  listOperationalOrchestrationsFn,
  previewOperationalOrchestrationRollbackFn,
  rollbackNextOperationalOrchestrationExecutionFn,
  runNextOperationalOrchestrationSandboxFn,
  submitOperationalOrchestrationForApprovalFn,
} from "@/lib/operations/api";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function useOperationalOrchestrationsQuery(opts: { enabled: boolean }) {
  return useQuery({
    queryKey: opsKeys.orchestrations(),
    queryFn: async () =>
      unwrap(
        (await listOperationalOrchestrationsFn()) as QueryResult<OperationalOrchestrationDto[]>,
      ),
    staleTime: 15_000,
    enabled: opts.enabled,
  });
}

export function useOperationalOrchestrationDetailQuery(opts: {
  orchestrationId: string | null;
  enabled: boolean;
}) {
  const id = opts.orchestrationId;
  return useQuery({
    queryKey: id ? opsKeys.orchestration(id) : ["operations", "operational-orchestrations", "none"],
    queryFn: async () =>
      unwrap(
        (await getOperationalOrchestrationByIdFn({
          data: { orchestrationId: id! },
        })) as QueryResult<OperationalOrchestrationDto>,
      ),
    enabled: !!id && opts.enabled,
    staleTime: 10_000,
  });
}

export function useOperationalOrchestrationMutations() {
  const qc = useQueryClient();
  const inv = (orchId?: string) => {
    void qc.invalidateQueries({ queryKey: opsKeys.orchestrations() });
    void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
    void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
    if (orchId) void qc.invalidateQueries({ queryKey: opsKeys.orchestration(orchId) });
  };

  const createOrch = useMutation({
    mutationFn: async (input: { title: string; summary?: string; proposalIds: string[] }) => {
      const chain = input.proposalIds.map((proposalId) => ({ proposalId }));
      return unwrap(
        (await createOperationalOrchestrationFn({
          data: { title: input.title, summary: input.summary, chain },
        })) as MutationResult<OperationalOrchestrationDto>,
      );
    },
    onSuccess: (data) => inv(data.id),
  });

  const submit = useMutation({
    mutationFn: async (orchestrationId: string) =>
      unwrap(
        (await submitOperationalOrchestrationForApprovalFn({
          data: { orchestrationId },
        })) as MutationResult<OperationalOrchestrationDto>,
      ),
    onSuccess: (_, id) => inv(id),
  });

  const approve = useMutation({
    mutationFn: async (input: { orchestrationId: string; approvalNote?: string }) =>
      unwrap(
        (await approveOperationalOrchestrationFn({
          data: input,
        })) as MutationResult<OperationalOrchestrationDto>,
      ),
    onSuccess: (_, v) => inv(v.orchestrationId),
  });

  const advanceGate = useMutation({
    mutationFn: async (orchestrationId: string) =>
      unwrap(
        (await advanceOperationalProposalGateFn({
          data: { orchestrationId },
        })) as MutationResult<OperationalOrchestrationDto>,
      ),
    onSuccess: (_, id) => inv(id),
  });

  const runSandbox = useMutation({
    mutationFn: async (orchestrationId: string) =>
      unwrap(
        (await runNextOperationalOrchestrationSandboxFn({
          data: { orchestrationId },
        })) as MutationResult<OperationalOrchestrationDto>,
      ),
    onSuccess: (_, id) => {
      inv(id);
      void qc.invalidateQueries({ queryKey: [...opsKeys.all, "operational-mutation-executions"] });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (input: {
      orchestrationId: string;
      approvalConfirmed: boolean;
      idempotencyKey: string;
    }) =>
      unwrap(
        (await executeNextOperationalOrchestrationMutationFn({
          data: input,
        })) as MutationResult<OperationalOrchestrationDto>,
      ),
    onSuccess: (_, v) => {
      inv(v.orchestrationId);
      void qc.invalidateQueries({ queryKey: [...opsKeys.all, "operational-mutation-executions"] });
    },
  });

  const previewRollback = useMutation({
    mutationFn: async (orchestrationId: string) =>
      unwrap(
        (await previewOperationalOrchestrationRollbackFn({
          data: { orchestrationId },
        })) as MutationResult<OperationalOrchestrationDto>,
      ),
    onSuccess: (_, id) => inv(id),
  });

  const rollbackNext = useMutation({
    mutationFn: async (orchestrationId: string) =>
      unwrap(
        (await rollbackNextOperationalOrchestrationExecutionFn({
          data: { orchestrationId },
        })) as MutationResult<OperationalOrchestrationDto>,
      ),
    onSuccess: (_, id) => {
      inv(id);
      void qc.invalidateQueries({ queryKey: [...opsKeys.all, "operational-mutation-executions"] });
    },
  });

  return {
    createOrch,
    submit,
    approve,
    advanceGate,
    runSandbox,
    executeMutation,
    previewRollback,
    rollbackNext,
  };
}
