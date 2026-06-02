/**
 * Server functions — agentes operacionais supervisionados (domínio escopado, sem autonomia).
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import {
  approveOperationalAgentSession,
  assertOperationalAgentType,
  blockOperationalAgentSession,
  loadOperationalAgentGovernanceBundle,
  runOperationalAgentReasoningCycles,
  unblockOperationalAgentSession,
} from "@/lib/services/operations/operational-agent-service";
import {
  requireObject,
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";

export const loadOperationalAgentGovernanceBundleFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    QueryResult<Awaited<ReturnType<typeof loadOperationalAgentGovernanceBundle>>>
  > => {
    return runQuery((ctx) => loadOperationalAgentGovernanceBundle(ctx));
  },
);

export const runOperationalAgentReasoningCyclesFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<
    MutationResult<Awaited<ReturnType<typeof runOperationalAgentReasoningCycles>>>
  > => {
    return runMutation((ctx) => runOperationalAgentReasoningCycles(ctx));
  },
);

export const approveOperationalAgentSessionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const rawType = typeof o.agentType === "string" ? o.agentType.trim() : "";
    if (!rawType) throw new ValidationError("agentType é obrigatório.", { field: "agentType" });
    const agentType = assertOperationalAgentType(rawType);
    const note = typeof o.note === "string" ? o.note : undefined;
    return { agentType, note };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof approveOperationalAgentSession>>>> => {
      return runMutation((ctx) => approveOperationalAgentSession(ctx, data));
    },
  );

export const blockOperationalAgentSessionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const rawType = typeof o.agentType === "string" ? o.agentType.trim() : "";
    if (!rawType) throw new ValidationError("agentType é obrigatório.", { field: "agentType" });
    const agentType = assertOperationalAgentType(rawType);
    const reason = typeof o.reason === "string" ? o.reason : "";
    if (!reason.trim())
      throw new ValidationError("Motivo do bloqueio é obrigatório.", { field: "reason" });
    return { agentType, reason: reason.trim() };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof blockOperationalAgentSession>>>> => {
      return runMutation((ctx) => blockOperationalAgentSession(ctx, data));
    },
  );

export const unblockOperationalAgentSessionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const rawType = typeof o.agentType === "string" ? o.agentType.trim() : "";
    if (!rawType) throw new ValidationError("agentType é obrigatório.", { field: "agentType" });
    const agentType = assertOperationalAgentType(rawType);
    return { agentType };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof unblockOperationalAgentSession>>>> => {
      return runMutation((ctx) => unblockOperationalAgentSession(ctx, data));
    },
  );
