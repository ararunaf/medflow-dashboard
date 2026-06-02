/**
 * Server functions — memória operacional supervisionada (estados, governança).
 */
import { createServerFn } from "@tanstack/react-start";
import { expectOperationalMemoryState, expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  patchOperationalMemoryState,
  type PatchOperationalMemoryStateInput,
} from "@/lib/services/operations/operational-memory-service";

export type { PatchOperationalMemoryStateInput };

export const patchOperationalMemoryStateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): PatchOperationalMemoryStateInput => {
    const obj = requireObject(raw);
    return {
      memoryEntryId: expectUuid(obj.memoryEntryId, "memoryEntryId"),
      nextState: expectOperationalMemoryState(obj.nextState, "nextState"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => patchOperationalMemoryState(ctx, data));
  });
