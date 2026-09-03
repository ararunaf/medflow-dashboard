/**
 * Server functions de presença (check-in/check-out) — F4-S4.
 */
import { createServerFn } from "@tanstack/react-start";
import { expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import { checkIn, checkOut } from "@/lib/services/operations/attendance";
import type { ShiftAssignmentRow } from "@/lib/services/operations/types";

export const checkInFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { assignmentId: string } => {
    const obj = requireObject(raw);
    return { assignmentId: expectUuid(obj.assignmentId, "assignmentId") };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftAssignmentRow>> => {
    return runMutation((ctx) => checkIn(ctx, data.assignmentId));
  });

export const checkOutFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { assignmentId: string } => {
    const obj = requireObject(raw);
    return { assignmentId: expectUuid(obj.assignmentId, "assignmentId") };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftAssignmentRow>> => {
    return runMutation((ctx) => checkOut(ctx, data.assignmentId));
  });
