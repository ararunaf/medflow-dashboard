/**
 * Service de plantões (shifts).
 *
 * Regras enforçadas aqui:
 * - schedule deve existir no tenant; não pode estar arquivado;
 * - `starts_at` < `ends_at`;
 * - department coincide com o do schedule (também enforçado por trigger);
 * - apenas managers criam/atualizam/cancelam;
 * - cancelar cascateia: assignments pendentes/confirmados → rejected;
 *   swap requests pendentes → cancelled.
 * - shifts em estado terminal (`completed`, `cancelled`) não são editáveis.
 */
import { assertCan } from "@/lib/auth/rbac";
import { DomainError, NotFoundError, mapPostgresError } from "@/lib/domain/operations/errors";
import {
  shiftCancelledEvent,
  shiftCreatedEvent,
  shiftUpdatedEvent,
} from "@/lib/operations/timeline";
import {
  expectInterval,
  expectNonEmptyString,
  expectOptionalString,
  expectTimestamp,
  expectUuid,
} from "@/lib/domain/operations/validation";
import type { ScheduleRow, ServiceCtx, ShiftRow } from "./types";
import { recordOperationalEventSafe } from "./operational-event-service";

export type CreateShiftInput = {
  scheduleId: string;
  startsAt: string;
  endsAt: string;
  roleRequired?: string;
};

export type UpdateShiftInput = {
  shiftId: string;
  startsAt?: string;
  endsAt?: string;
  roleRequired?: string;
};

async function loadShift(ctx: ServiceCtx, shiftId: string): Promise<ShiftRow> {
  const { data, error } = await ctx.client
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new NotFoundError("Plantão", shiftId);
  return data;
}

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

export async function createShift(ctx: ServiceCtx, input: CreateShiftInput): Promise<ShiftRow> {
  assertCan(ctx.role, "shifts:create");

  const scheduleId = expectUuid(input.scheduleId, "scheduleId");
  const startsAt = expectTimestamp(input.startsAt, "startsAt");
  const endsAt = expectTimestamp(input.endsAt, "endsAt");
  expectInterval(startsAt, endsAt, "shiftInterval");
  const roleRequired = expectOptionalString(input.roleRequired, "roleRequired", 60);

  const schedule = await loadSchedule(ctx, scheduleId);
  if (schedule.status === "archived") {
    throw new DomainError("schedule_archived", "Escala arquivada não aceita novos plantões.", {
      scheduleId,
    });
  }

  const { data, error } = await ctx.client
    .from("shifts")
    .insert({
      tenant_id: ctx.tenantId,
      schedule_id: schedule.id,
      department_id: schedule.department_id,
      starts_at: startsAt,
      ends_at: endsAt,
      role_required: roleRequired,
      status: "open",
    })
    .select("*")
    .single();

  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, shiftCreatedEvent(data));
  return data;
}

export async function updateShift(ctx: ServiceCtx, input: UpdateShiftInput): Promise<ShiftRow> {
  assertCan(ctx.role, "shifts:update");

  const shiftId = expectUuid(input.shiftId, "shiftId");
  const current = await loadShift(ctx, shiftId);

  if (current.status === "cancelled" || current.status === "completed") {
    throw new DomainError(
      "invalid_status_transition",
      `Plantão em estado ${current.status} não pode ser editado.`,
      { status: current.status },
    );
  }

  const patch: Partial<ShiftRow> = {};
  const nextStart =
    input.startsAt !== undefined ? expectTimestamp(input.startsAt, "startsAt") : current.starts_at;
  const nextEnd =
    input.endsAt !== undefined ? expectTimestamp(input.endsAt, "endsAt") : current.ends_at;
  if (input.startsAt !== undefined) patch.starts_at = nextStart;
  if (input.endsAt !== undefined) patch.ends_at = nextEnd;
  expectInterval(nextStart, nextEnd, "shiftInterval");

  if (input.roleRequired !== undefined) {
    patch.role_required = expectOptionalString(input.roleRequired, "roleRequired", 60);
  }

  if (Object.keys(patch).length === 0) {
    return current;
  }

  const { data, error } = await ctx.client
    .from("shifts")
    .update(patch)
    .eq("id", shiftId)
    .eq("tenant_id", ctx.tenantId)
    .select("*")
    .single();

  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, shiftUpdatedEvent(data, current));
  return data;
}

export async function cancelShift(ctx: ServiceCtx, shiftId: string): Promise<ShiftRow> {
  assertCan(ctx.role, "shifts:cancel");

  const id = expectUuid(shiftId, "shiftId");
  const current = await loadShift(ctx, id);

  if (current.status === "cancelled") return current;
  if (current.status === "completed") {
    throw new DomainError(
      "invalid_status_transition",
      "Plantão concluído não pode ser cancelado.",
      { status: current.status },
    );
  }

  // 1. Rejeita assignments pendentes/confirmados; a trigger
  // `sync_shift_status_from_assignment` cuidaria de devolver o shift para
  // `open`, mas em seguida marcamos o shift como `cancelled` explicitamente.
  const { error: assignErr } = await ctx.client
    .from("shift_assignments")
    .update({ assignment_status: "rejected" })
    .eq("tenant_id", ctx.tenantId)
    .eq("shift_id", id)
    .in("assignment_status", ["pending", "confirmed"]);
  if (assignErr) throw mapPostgresError(assignErr);

  // 2. Cancela swap requests pendentes vinculados ao shift.
  const { error: swapErr } = await ctx.client
    .from("shift_swap_requests")
    .update({ status: "cancelled" })
    .eq("tenant_id", ctx.tenantId)
    .eq("shift_id", id)
    .eq("status", "pending");
  if (swapErr) throw mapPostgresError(swapErr);

  // 3. Move shift -> cancelled.
  const { data, error } = await ctx.client
    .from("shifts")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .select("*")
    .single();

  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, shiftCancelledEvent(data));
  return data;
}
