/**
 * Server functions de escalas (schedules) — chamadas via TanStack Start RPC.
 *
 * Cada função:
 *   1. valida payload com os helpers de domínio;
 *   2. resolve `OperationalAuthContext` (sessão obrigatória);
 *   3. delega ao service correspondente;
 *   4. devolve `MutationResult<T>` tipado (sucesso ou erro de domínio).
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import {
  expectDateISO,
  expectDateRange,
  expectNonEmptyString,
  expectScheduleStatus,
  expectUuid,
} from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  createSchedule,
  updateSchedule,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "@/lib/services/operations/schedules";
import type { ScheduleRow } from "@/lib/services/operations/types";

export const createScheduleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): CreateScheduleInput => {
    const obj = requireObject(raw);
    const departmentId = expectUuid(obj.departmentId, "departmentId");
    const name = expectNonEmptyString(obj.name, "name", 120);
    const startDate = expectDateISO(obj.startDate, "startDate");
    const endDate = expectDateISO(obj.endDate, "endDate");
    expectDateRange(startDate, endDate, "dateRange");
    const status =
      obj.status === undefined ? undefined : expectScheduleStatus(obj.status, "status");
    return { departmentId, name, startDate, endDate, status };
  })
  .handler(async ({ data }): Promise<MutationResult<ScheduleRow>> => {
    return runMutation((ctx) => createSchedule(ctx, data));
  });

export const updateScheduleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): UpdateScheduleInput => {
    const obj = requireObject(raw);
    const scheduleId = expectUuid(obj.scheduleId, "scheduleId");
    const input: UpdateScheduleInput = { scheduleId };

    if (obj.name !== undefined) input.name = expectNonEmptyString(obj.name, "name", 120);
    if (obj.startDate !== undefined) input.startDate = expectDateISO(obj.startDate, "startDate");
    if (obj.endDate !== undefined) input.endDate = expectDateISO(obj.endDate, "endDate");
    if (input.startDate !== undefined && input.endDate !== undefined) {
      expectDateRange(input.startDate, input.endDate, "dateRange");
    }
    if (obj.status !== undefined) input.status = expectScheduleStatus(obj.status, "status");

    if (Object.keys(input).length === 1) {
      throw new ValidationError("Nenhum campo informado para atualização.");
    }
    return input;
  })
  .handler(async ({ data }): Promise<MutationResult<ScheduleRow>> => {
    return runMutation((ctx) => updateSchedule(ctx, data));
  });
