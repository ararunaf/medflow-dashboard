/**
 * Query — lista propostas de ação operacional supervisionadas.
 */
import { createServerFn } from "@tanstack/react-start";
import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import { listOperationalActionProposals } from "@/lib/services/operations/operational-action-proposal-service";

export const listOperationalActionProposalsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<OperationalActionProposalDto[]>> => {
    return runQuery((ctx) => listOperationalActionProposals(ctx, { limit: 36 }));
  },
);

export type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
