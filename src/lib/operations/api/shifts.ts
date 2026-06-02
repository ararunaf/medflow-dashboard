/**
 * Server functions de plantões (shifts).
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import {
  expectInterval,
  expectOptionalString,
  expectTimestamp,
  expectUuid,
} from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  cancelShift,
  createShift,
  updateShift,
  type CreateShiftInput,
  type UpdateShiftInput,
} from "@/lib/services/operations/shifts";
import type { ShiftRow } from "@/lib/services/operations/types";

export const createShiftFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): CreateShiftInput => {
    const obj = requireObject(raw);
    const scheduleId = expectUuid(obj.scheduleId, "scheduleId");
    const startsAt = expectTimestamp(obj.startsAt, "startsAt");
    const endsAt = expectTimestamp(obj.endsAt, "endsAt");
    expectInterval(startsAt, endsAt, "shiftInterval");
    const roleRequired =
      obj.roleRequired === undefined
        ? undefined
        : expectOptionalString(obj.roleRequired, "roleRequired", 60);
    return { scheduleId, startsAt, endsAt, roleRequired };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftRow>> => {
    return runMutation((ctx) => createShift(ctx, data));
  });

export const updateShiftFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): UpdateShiftInput => {
    const obj = requireObject(raw);
    const shiftId = expectUuid(obj.shiftId, "shiftId");
    const input: UpdateShiftInput = { shiftId };
    if (obj.startsAt !== undefined) input.startsAt = expectTimestamp(obj.startsAt, "startsAt");
    if (obj.endsAt !== undefined) input.endsAt = expectTimestamp(obj.endsAt, "endsAt");
    if (input.startsAt !== undefined && input.endsAt !== undefined) {
      expectInterval(input.startsAt, input.endsAt, "shiftInterval");
    }
    if (obj.roleRequired !== undefined)
      input.roleRequired = expectOptionalString(obj.roleRequired, "roleRequired", 60);
    if (Object.keys(input).length === 1) {
      throw new ValidationError("Nenhum campo informado para atualização.");
    }
    return input;
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftRow>> => {
    return runMutation((ctx) => updateShift(ctx, data));
  });

export const cancelShiftFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { shiftId: string } => {
    const obj = requireObject(raw);
    return { shiftId: expectUuid(obj.shiftId, "shiftId") };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftRow>> => {
    return runMutation((ctx) => cancelShift(ctx, data.shiftId));
  });
