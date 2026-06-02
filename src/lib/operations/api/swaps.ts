/**
 * Server functions de trocas de plantão (shift_swap_requests).
 */
import { createServerFn } from "@tanstack/react-start";
import { expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  approveSwap,
  denySwap,
  requestSwap,
  type RequestSwapInput,
} from "@/lib/services/operations/swaps";
import type { ShiftAssignmentRow, ShiftSwapRequestRow } from "@/lib/services/operations/types";

export type { RequestSwapInput };

export const requestSwapFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): RequestSwapInput => {
    const obj = requireObject(raw);
    return {
      shiftId: expectUuid(obj.shiftId, "shiftId"),
      targetProfessionalId: expectUuid(obj.targetProfessionalId, "targetProfessionalId"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftSwapRequestRow>> => {
    return runMutation((ctx) => requestSwap(ctx, data));
  });

export const approveSwapFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { swapId: string } => {
    const obj = requireObject(raw);
    return { swapId: expectUuid(obj.swapId, "swapId") };
  })
  .handler(
    async ({
      data,
    }): Promise<
      MutationResult<{ swap: ShiftSwapRequestRow; targetAssignment: ShiftAssignmentRow }>
    > => {
      return runMutation((ctx) => approveSwap(ctx, data.swapId));
    },
  );

export const denySwapFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { swapId: string } => {
    const obj = requireObject(raw);
    return { swapId: expectUuid(obj.swapId, "swapId") };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftSwapRequestRow>> => {
    return runMutation((ctx) => denySwap(ctx, data.swapId));
  });
