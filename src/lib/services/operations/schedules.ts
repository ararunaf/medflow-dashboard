/**
 * Service de escalas (schedules).
 *
 * Regras enforçadas aqui (em adição às RLS/triggers do Postgres):
 * - `department_id` deve pertencer ao tenant do usuário;
 * - `start_date` ≤ `end_date`;
 * - apenas managers (coordinator / tenant_admin / super_admin) podem
 *   criar/atualizar/arquivar;
 * - transições de status seguem `scheduleTransitions`.
 */
import { assertCan } from "@/lib/auth/rbac";
import {
  NotFoundError,
  StatusTransitionError,
  TenantMismatchError,
  mapPostgresError,
} from "@/lib/domain/operations/errors";
import type { ScheduleStatus } from "@/lib/domain/operations/enums";
import { canTransition, scheduleTransitions } from "@/lib/domain/operations/status";
import {
  expectDateISO,
  expectDateRange,
  expectNonEmptyString,
  expectScheduleStatus,
  expectUuid,
} from "@/lib/domain/operations/validation";
import type { ScheduleRow, ServiceCtx } from "./types";

export type CreateScheduleInput = {
  departmentId: string;
  name: string;
  startDate: string;
  endDate: string;
  status?: ScheduleStatus;
};

export type UpdateScheduleInput = {
  scheduleId: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: ScheduleStatus;
};

async function loadSchedule(ctx: ServiceCtx, scheduleId: string): Promise<ScheduleRow> {
  const { data, error } = await ctx.client
    .from("schedules")
    .select("*")
    .eq("id", scheduleId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new NotFoundError("Escala", scheduleId);
  return data;
}

async function assertDepartmentInTenant(ctx: ServiceCtx, departmentId: string): Promise<void> {
  const { data, error } = await ctx.client
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new TenantMismatchError("Setor");
}

export async function createSchedule(
  ctx: ServiceCtx,
  input: CreateScheduleInput,
): Promise<ScheduleRow> {
  assertCan(ctx.role, "schedules:create");

  const departmentId = expectUuid(input.departmentId, "departmentId");
  const name = expectNonEmptyString(input.name, "name", 120);
  const startDate = expectDateISO(input.startDate, "startDate");
  const endDate = expectDateISO(input.endDate, "endDate");
  expectDateRange(startDate, endDate, "dateRange");
  const status = input.status ? expectScheduleStatus(input.status, "status") : "draft";

  await assertDepartmentInTenant(ctx, departmentId);

  const { data, error } = await ctx.client
    .from("schedules")
    .insert({
      tenant_id: ctx.tenantId,
      department_id: departmentId,
      name,
      start_date: startDate,
      end_date: endDate,
      status,
    })
    .select("*")
    .single();

  if (error) throw mapPostgresError(error);
  return data;
}

export async function updateSchedule(
  ctx: ServiceCtx,
  input: UpdateScheduleInput,
): Promise<ScheduleRow> {
  assertCan(ctx.role, "schedules:update");

  const scheduleId = expectUuid(input.scheduleId, "scheduleId");
  const current = await loadSchedule(ctx, scheduleId);

  const patch: Partial<ScheduleRow> = {};

  if (input.name !== undefined) {
    patch.name = expectNonEmptyString(input.name, "name", 120);
  }

  const nextStart =
    input.startDate !== undefined
      ? expectDateISO(input.startDate, "startDate")
      : current.start_date;
  const nextEnd =
    input.endDate !== undefined ? expectDateISO(input.endDate, "endDate") : current.end_date;
  if (input.startDate !== undefined) patch.start_date = nextStart;
  if (input.endDate !== undefined) patch.end_date = nextEnd;
  expectDateRange(nextStart, nextEnd, "dateRange");

  if (input.status !== undefined) {
    const nextStatus = expectScheduleStatus(input.status, "status");
    if (!canTransition(scheduleTransitions, current.status, nextStatus)) {
      throw new StatusTransitionError(current.status, nextStatus, "schedule");
    }
    if (nextStatus === "archived") {
      assertCan(ctx.role, "schedules:archive");
    }
    patch.status = nextStatus;
  }

  if (Object.keys(patch).length === 0) {
    return current;
  }

  const { data, error } = await ctx.client
    .from("schedules")
    .update(patch)
    .eq("id", scheduleId)
    .eq("tenant_id", ctx.tenantId)
    .select("*")
    .single();

  if (error) throw mapPostgresError(error);
  return data;
}
