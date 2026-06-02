/**
 * Server function — sandbox de execução (dry-run only, sem mutation real).
 */
import { createServerFn } from "@tanstack/react-start";
import { expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import { runOperationalSandboxSimulation } from "@/lib/services/operations/operational-execution-sandbox-service";
import type { OperationalSimulationResult } from "@/lib/operations/execution-sandbox";

export const runOperationalSandboxSimulationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const proposalId = expectUuid(o.proposalId, "proposalId");
    const max = typeof o.maxAffectedEntities === "number" ? o.maxAffectedEntities : undefined;
    return { proposalId, maxAffectedEntities: max };
  })
  .handler(async ({ data }): Promise<MutationResult<OperationalSimulationResult>> => {
    return runMutation(async (ctx) => {
      return runOperationalSandboxSimulation(ctx, {
        proposalId: data.proposalId,
        maxAffectedEntities: data.maxAffectedEntities,
      });
    });
  });

export type { OperationalSimulationResult } from "@/lib/operations/execution-sandbox";
