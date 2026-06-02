/**
 * Server functions — execução supervisionada de mutações (pós-sandbox seguro).
 */
import { createServerFn } from "@tanstack/react-start";
import { expectUuid } from "@/lib/domain/operations/validation";
import {
  requireObject,
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import {
  executeSupervisedOperationalMutations,
  listOperationalMutationExecutionsForProposal,
  rollbackSupervisedOperationalMutationExecution,
} from "@/lib/services/operations/operational-mutation-execution-service";
import type {
  ExecuteSupervisedOperationalMutationsInput,
  ExecuteSupervisedOperationalMutationsResult,
  OperationalMutationExecutionDto,
} from "@/lib/operations/mutation-execution/types";

export const executeSupervisedOperationalMutationsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      proposalId: expectUuid(o.proposalId, "proposalId"),
      sandboxRunId: expectUuid(o.sandboxRunId, "sandboxRunId"),
      approvalConfirmed: o.approvalConfirmed === true,
      idempotencyKey: typeof o.idempotencyKey === "string" ? o.idempotencyKey : "",
    } satisfies ExecuteSupervisedOperationalMutationsInput;
  })
  .handler(
    async ({ data }): Promise<MutationResult<ExecuteSupervisedOperationalMutationsResult>> => {
      return runMutation((ctx) => executeSupervisedOperationalMutations(ctx, data));
    },
  );

export const rollbackSupervisedOperationalMutationExecutionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { executionId: expectUuid(o.executionId, "executionId") };
  })
  .handler(async ({ data }): Promise<MutationResult<OperationalMutationExecutionDto>> => {
    return runMutation((ctx) => rollbackSupervisedOperationalMutationExecution(ctx, data));
  });

export const listOperationalMutationExecutionsForProposalFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { proposalId: expectUuid(o.proposalId, "proposalId") };
  })
  .handler(async ({ data }): Promise<QueryResult<OperationalMutationExecutionDto[]>> => {
    return runQuery((ctx) => listOperationalMutationExecutionsForProposal(ctx, data.proposalId));
  });

export type {
  ExecuteSupervisedOperationalMutationsInput,
  ExecuteSupervisedOperationalMutationsResult,
  OperationalMutationExecutionDto,
} from "@/lib/operations/mutation-execution/types";
