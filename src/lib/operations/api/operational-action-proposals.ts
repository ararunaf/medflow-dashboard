/**
 * Server functions — propostas de ação operacional supervisionadas (governança humana).
 */
import { createServerFn } from "@tanstack/react-start";
import { expectUuid } from "@/lib/domain/operations/validation";
import {
  optionalString,
  requireObject,
  requireString,
  runMutation,
  type MutationResult,
} from "@/lib/server/fn-helpers";
import {
  approveOperationalActionProposal,
  rejectOperationalActionProposal,
  submitOperationalActionProposalForConfirmation,
} from "@/lib/services/operations/operational-action-proposal-service";

export const submitOperationalActionProposalForConfirmationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { proposalId: expectUuid(o.proposalId, "proposalId") };
  })
  .handler(async ({ data }): Promise<MutationResult<{ ok: true }>> => {
    return runMutation(async (ctx) => {
      await submitOperationalActionProposalForConfirmation(ctx, data.proposalId);
      return { ok: true as const };
    });
  });

export const approveOperationalActionProposalFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const notesRaw = optionalString(o.note, "note");
    const note = notesRaw === undefined ? null : notesRaw.length > 0 ? notesRaw : null;
    return {
      proposalId: expectUuid(o.proposalId, "proposalId"),
      note,
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ ok: true }>> => {
    return runMutation(async (ctx) => {
      await approveOperationalActionProposal(ctx, { proposalId: data.proposalId, note: data.note });
      return { ok: true as const };
    });
  });

export const rejectOperationalActionProposalFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      proposalId: expectUuid(o.proposalId, "proposalId"),
      justification: requireString(o.justification, "justification"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ ok: true }>> => {
    return runMutation(async (ctx) => {
      await rejectOperationalActionProposal(ctx, {
        proposalId: data.proposalId,
        justification: data.justification,
      });
      return { ok: true as const };
    });
  });
