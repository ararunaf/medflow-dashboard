/**
 * Service de presença (check-in/check-out) — F4-S4.
 *
 * Regras enforçadas:
 * - só em atribuição `confirmed` (pending/rejected não fazem sentido);
 * - role `professional` só pode operar sobre a própria atribuição;
 * - apenas managers podem registrar check-in/out em nome de terceiros;
 * - check-out exige check-in prévio (também garantido por CHECK no banco);
 * - idempotente: check-in/out repetido não sobrescreve o horário já
 *   registrado, só devolve o estado atual;
 * - check-out confirmado é o que finalmente conclui o plantão
 *   (`shifts.status` -> 'completed') — via trigger no banco
 *   (`complete_shift_on_checkout`, F4-S4), não aqui.
 */
import { assertCan, isOperationalManager } from "@/lib/auth/rbac";
import { DomainError, NotFoundError, PermissionError, mapPostgresError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { assignmentCheckedInEvent, assignmentCheckedOutEvent } from "@/lib/operations/timeline";
import type { ServiceCtx, ShiftAssignmentRow } from "./types";
import { recordOperationalEventSafe } from "./operational-event-service";

async function loadAssignment(ctx: ServiceCtx, assignmentId: string): Promise<ShiftAssignmentRow> {
  const { data, error } = await ctx.client
    .from("shift_assignments")
    .select("*")
    .eq("id", assignmentId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new NotFoundError("Atribuição", assignmentId);
  return data;
}

function assertCanActOnAttendance(ctx: ServiceCtx, assignment: ShiftAssignmentRow): void {
  const isSelf = ctx.professionalId != null && assignment.professional_id === ctx.professionalId;
  if (isSelf) {
    assertCan(ctx.role, "attendance:checkin:self");
    return;
  }
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Profissional só pode registrar presença na própria atribuição.", {
      assignmentId: assignment.id,
    });
  }
  assertCan(ctx.role, "attendance:checkin:any");
}

export async function checkIn(ctx: ServiceCtx, assignmentId: string): Promise<ShiftAssignmentRow> {
  const id = expectUuid(assignmentId, "assignmentId");
  const current = await loadAssignment(ctx, id);
  assertCanActOnAttendance(ctx, current);

  if (current.assignment_status !== "confirmed") {
    throw new DomainError(
      "invalid_status_transition",
      `Check-in só é possível em atribuição confirmada (status atual: ${current.assignment_status}).`,
      { status: current.assignment_status },
    );
  }
  if (current.checked_in_at) return current;

  const { data, error } = await ctx.client
    .from("shift_assignments")
    .update({ checked_in_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, assignmentCheckedInEvent(data));
  return data;
}

export async function checkOut(ctx: ServiceCtx, assignmentId: string): Promise<ShiftAssignmentRow> {
  const id = expectUuid(assignmentId, "assignmentId");
  const current = await loadAssignment(ctx, id);
  assertCanActOnAttendance(ctx, current);

  if (!current.checked_in_at) {
    throw new DomainError("validation_failed", "É preciso fazer check-in antes do check-out.", {
      assignmentId: id,
    });
  }
  if (current.checked_out_at) return current;

  const { data, error } = await ctx.client
    .from("shift_assignments")
    .update({ checked_out_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, assignmentCheckedOutEvent(data));
  return data;
}
