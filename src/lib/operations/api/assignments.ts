/**
 * Server functions de atribuições (shift_assignments).
 */
import { createServerFn } from "@tanstack/react-start";
import { expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  confirmAssignment,
  createAssignment,
  rejectAssignment,
  selfAssignOpenShift,
  type CreateAssignmentInput,
} from "@/lib/services/operations/assignments";
import type { ShiftAssignmentRow } from "@/lib/services/operations/types";

export const createAssignmentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): CreateAssignmentInput => {
    const obj = requireObject(raw);
    return {
      shiftId: expectUuid(obj.shiftId, "shiftId"),
      professionalId: expectUuid(obj.professionalId, "professionalId"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftAssignmentRow>> => {
    return runMutation((ctx) => createAssignment(ctx, data));
  });

export const selfAssignOpenShiftFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { shiftId: string } => {
    const obj = requireObject(raw);
    return { shiftId: expectUuid(obj.shiftId, "shiftId") };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftAssignmentRow>> => {
    return runMutation((ctx) => selfAssignOpenShift(ctx, data.shiftId));
  });

export const confirmAssignmentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { assignmentId: string } => {
    const obj = requireObject(raw);
    return { assignmentId: expectUuid(obj.assignmentId, "assignmentId") };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftAssignmentRow>> => {
    return runMutation((ctx) => confirmAssignment(ctx, data.assignmentId));
  });

export const rejectAssignmentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { assignmentId: string } => {
    const obj = requireObject(raw);
    return { assignmentId: expectUuid(obj.assignmentId, "assignmentId") };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftAssignmentRow>> => {
    return runMutation((ctx) => rejectAssignment(ctx, data.assignmentId));
  });
