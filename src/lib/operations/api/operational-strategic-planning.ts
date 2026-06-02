/**
 * Server functions — planejamento operacional estratégico supervisionado.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  expectUuid,
  expectStrategicPlanningPatchLifecycleState,
} from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  patchStrategicPlanningCycleLifecycle,
  runStrategicOperationalPlanningCycle,
  type PatchStrategicPlanningCycleLifecycleInput,
} from "@/lib/services/operations/operational-strategic-planning-service";

export type { PatchStrategicPlanningCycleLifecycleInput };

export const runStrategicOperationalPlanningCycleFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<MutationResult<{ cycleId: string; skippedDuplicate?: boolean }>> => {
    return runMutation((ctx) => runStrategicOperationalPlanningCycle(ctx));
  },
);

export const patchStrategicPlanningCycleLifecycleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): PatchStrategicPlanningCycleLifecycleInput => {
    const obj = requireObject(raw);
    return {
      cycleId: expectUuid(obj.cycleId, "cycleId"),
      nextLifecycleState: expectStrategicPlanningPatchLifecycleState(
        obj.nextLifecycleState,
        "nextLifecycleState",
      ),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => patchStrategicPlanningCycleLifecycle(ctx, data));
  });
