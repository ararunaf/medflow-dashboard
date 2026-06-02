/**
 * Server functions — coordenação colaborativa supervisionada entre agentes operacionais.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  loadOperationalAgentCoordinationBundle,
  runOperationalAgentCoordinationCycle,
} from "@/lib/services/operations/operational-agent-coordination-service";
import {
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";

export const loadOperationalAgentCoordinationBundleFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    QueryResult<Awaited<ReturnType<typeof loadOperationalAgentCoordinationBundle>>>
  > => {
    return runQuery((ctx) => loadOperationalAgentCoordinationBundle(ctx));
  },
);

export const runOperationalAgentCoordinationCycleFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<
    MutationResult<Awaited<ReturnType<typeof runOperationalAgentCoordinationCycle>>>
  > => {
    return runMutation((ctx) => runOperationalAgentCoordinationCycle(ctx));
  },
);
