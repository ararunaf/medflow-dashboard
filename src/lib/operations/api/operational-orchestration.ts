/**
 * Server functions — orquestração operacional supervisionada (multi-passo, policy-driven).
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { CreateOperationalOrchestrationInput } from "@/lib/operations/orchestration/types";
import {
  advanceOperationalProposalGate,
  approveOperationalOrchestration,
  createOperationalOrchestration,
  executeNextOperationalOrchestrationMutation,
  getOperationalOrchestrationById,
  listOperationalOrchestrations,
  previewOperationalOrchestrationRollback,
  rollbackNextOperationalOrchestrationExecution,
  runNextOperationalOrchestrationSandbox,
  submitOperationalOrchestrationForApproval,
} from "@/lib/services/operations/operational-orchestration-service";
import {
  requireObject,
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";

function parseCreateOrchestrationInput(raw: unknown): CreateOperationalOrchestrationInput {
  const o = requireObject(raw);
  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title) throw new ValidationError("title é obrigatório.");
  const summary = typeof o.summary === "string" ? o.summary : undefined;
  const chainRaw = o.chain;
  if (!Array.isArray(chainRaw) || chainRaw.length === 0) {
    throw new ValidationError("chain deve ser um array com ao menos um item.");
  }
  const chain = chainRaw.map((item, idx) => {
    const it = requireObject(item, `chain[${idx}]`);
    const proposalId = expectUuid(it.proposalId, `chain[${idx}].proposalId`);
    let dependsOnItemIndex: number | null | undefined;
    if ("dependsOnItemIndex" in it) {
      if (it.dependsOnItemIndex === null) dependsOnItemIndex = null;
      else if (it.dependsOnItemIndex === undefined) dependsOnItemIndex = undefined;
      else {
        const n = Number(it.dependsOnItemIndex);
        if (!Number.isInteger(n))
          throw new ValidationError(`chain[${idx}].dependsOnItemIndex inválido.`);
        dependsOnItemIndex = n;
      }
    }
    return {
      proposalId,
      dependsOnItemIndex,
      includeProposalGate:
        typeof it.includeProposalGate === "boolean" ? it.includeProposalGate : undefined,
      includeSimulation:
        typeof it.includeSimulation === "boolean" ? it.includeSimulation : undefined,
      includeExecution: typeof it.includeExecution === "boolean" ? it.includeExecution : undefined,
    };
  });
  return { title, summary, chain };
}

export const createOperationalOrchestrationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => parseCreateOrchestrationInput(raw))
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof createOperationalOrchestration>>>> => {
      return runMutation((ctx) => createOperationalOrchestration(ctx, data));
    },
  );

export const listOperationalOrchestrationsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<Awaited<ReturnType<typeof listOperationalOrchestrations>>>> => {
    return runQuery((ctx) => listOperationalOrchestrations(ctx));
  },
);

export const getOperationalOrchestrationByIdFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { orchestrationId: expectUuid(o.orchestrationId, "orchestrationId") };
  })
  .handler(
    async ({
      data,
    }): Promise<QueryResult<Awaited<ReturnType<typeof getOperationalOrchestrationById>>>> => {
      return runQuery((ctx) => getOperationalOrchestrationById(ctx, data.orchestrationId));
    },
  );

export const submitOperationalOrchestrationForApprovalFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { orchestrationId: expectUuid(o.orchestrationId, "orchestrationId") };
  })
  .handler(
    async ({
      data,
    }): Promise<
      MutationResult<Awaited<ReturnType<typeof submitOperationalOrchestrationForApproval>>>
    > => {
      return runMutation((ctx) =>
        submitOperationalOrchestrationForApproval(ctx, data.orchestrationId),
      );
    },
  );

export const approveOperationalOrchestrationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      orchestrationId: expectUuid(o.orchestrationId, "orchestrationId"),
      approvalNote: typeof o.approvalNote === "string" ? o.approvalNote : undefined,
    };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof approveOperationalOrchestration>>>> => {
      return runMutation((ctx) =>
        approveOperationalOrchestration(ctx, {
          orchestrationId: data.orchestrationId,
          approvalNote: data.approvalNote,
        }),
      );
    },
  );

export const advanceOperationalProposalGateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { orchestrationId: expectUuid(o.orchestrationId, "orchestrationId") };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof advanceOperationalProposalGate>>>> => {
      return runMutation((ctx) => advanceOperationalProposalGate(ctx, data.orchestrationId));
    },
  );

export const runNextOperationalOrchestrationSandboxFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { orchestrationId: expectUuid(o.orchestrationId, "orchestrationId") };
  })
  .handler(
    async ({
      data,
    }): Promise<
      MutationResult<Awaited<ReturnType<typeof runNextOperationalOrchestrationSandbox>>>
    > => {
      return runMutation((ctx) =>
        runNextOperationalOrchestrationSandbox(ctx, data.orchestrationId),
      );
    },
  );

export const executeNextOperationalOrchestrationMutationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      orchestrationId: expectUuid(o.orchestrationId, "orchestrationId"),
      approvalConfirmed: o.approvalConfirmed === true,
      idempotencyKey: typeof o.idempotencyKey === "string" ? o.idempotencyKey : "",
    };
  })
  .handler(
    async ({
      data,
    }): Promise<
      MutationResult<Awaited<ReturnType<typeof executeNextOperationalOrchestrationMutation>>>
    > => {
      return runMutation((ctx) => executeNextOperationalOrchestrationMutation(ctx, data));
    },
  );

export const previewOperationalOrchestrationRollbackFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { orchestrationId: expectUuid(o.orchestrationId, "orchestrationId") };
  })
  .handler(
    async ({
      data,
    }): Promise<
      MutationResult<Awaited<ReturnType<typeof previewOperationalOrchestrationRollback>>>
    > => {
      return runMutation((ctx) =>
        previewOperationalOrchestrationRollback(ctx, data.orchestrationId),
      );
    },
  );

export const rollbackNextOperationalOrchestrationExecutionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { orchestrationId: expectUuid(o.orchestrationId, "orchestrationId") };
  })
  .handler(
    async ({
      data,
    }): Promise<
      MutationResult<Awaited<ReturnType<typeof rollbackNextOperationalOrchestrationExecution>>>
    > => {
      return runMutation((ctx) =>
        rollbackNextOperationalOrchestrationExecution(ctx, data.orchestrationId),
      );
    },
  );

export type {
  CreateOperationalOrchestrationInput,
  OperationalOrchestrationDto,
} from "@/lib/operations/orchestration/types";
