/**
 * Service de atribuições (shift_assignments).
 *
 * Regras enforçadas:
 * - shift deve existir no tenant, não pode estar cancelled/completed;
 * - professional deve pertencer ao mesmo tenant;
 * - role `professional` só pode operar sobre o próprio professional_id;
 * - apenas managers podem confirmar/rejeitar em nome de terceiros;
 * - unicidade de `confirmed` por shift é garantida pelo índice parcial no DB;
 * - transições: pending → confirmed | rejected; confirmed → rejected (revoga).
 */
import { assertCan, isOperationalManager } from "@/lib/auth/rbac";
import {
  ConflictError,
  DomainError,
  NotFoundError,
  PermissionError,
  StatusTransitionError,
  TenantMismatchError,
  mapPostgresError,
} from "@/lib/domain/operations/errors";
import { assignmentTransitions, canTransition } from "@/lib/domain/operations/status";
import { expectUuid } from "@/lib/domain/operations/validation";
import {
  assignmentConfirmedEvent,
  assignmentCreatedEvent,
  assignmentRejectedEvent,
} from "@/lib/operations/timeline";
import type { ServiceCtx, ShiftAssignmentRow, ShiftRow } from "./types";
import { recordOperationalEventSafe } from "./operational-event-service";

export type CreateAssignmentInput = {
  shiftId: string;
  professionalId: string;
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

async function assertProfessionalInTenant(ctx: ServiceCtx, professionalId: string): Promise<void> {
  const { data, error } = await ctx.client
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new TenantMismatchError("Profissional");
}

export async function createAssignment(
  ctx: ServiceCtx,
  input: CreateAssignmentInput,
): Promise<ShiftAssignmentRow> {
  const shiftId = expectUuid(input.shiftId, "shiftId");
  const professionalId = expectUuid(input.professionalId, "professionalId");

  // Quem pode atribuir? manager (qualquer) OU professional (apenas a si).
  if (professionalId === ctx.professionalId) {
    assertCan(ctx.role, "assignments:assign:self");
  } else {
    assertCan(ctx.role, "assignments:assign:any");
  }

  const shift = await loadShift(ctx, shiftId);
  if (shift.status === "cancelled" || shift.status === "completed") {
    throw new DomainError(
      "shift_cancelled",
      `Plantão em estado ${shift.status} não aceita novas atribuições.`,
      { status: shift.status },
    );
  }

  await assertProfessionalInTenant(ctx, professionalId);

  const { data, error } = await ctx.client
    .from("shift_assignments")
    .insert({
      tenant_id: ctx.tenantId,
      shift_id: shiftId,
      professional_id: professionalId,
      assignment_status: "pending",
    })
    .select("*")
    .single();

  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, assignmentCreatedEvent(data));
  return data;
}

/**
 * Auto-atribuição: profissional reivindica uma vaga aberta com um único
 * clique. Reaproveita create+confirm (nenhuma regra nova) — a exclusividade
 * continua garantida pelo índice parcial `one_confirmed_per_shift` no DB, o
 * mesmo que já protege a confirmação feita por um gestor. Se outro
 * profissional confirmou primeiro, a atribuição 'pending' recém-criada é
 * liberada (rejeitada) para não sobrar órfã — o profissional só vê o
 * conflito, não sobra lixo em `shift_assignments`.
 */
export async function selfAssignOpenShift(
  ctx: ServiceCtx,
  shiftId: string,
): Promise<ShiftAssignmentRow> {
  if (!ctx.professionalId) {
    throw new PermissionError("Apenas profissionais vinculados podem se auto-atribuir a um plantão.");
  }

  const created = await createAssignment(ctx, { shiftId, professionalId: ctx.professionalId });

  try {
    return await confirmAssignment(ctx, created.id);
  } catch (err) {
    await rejectAssignment(ctx, created.id).catch(() => undefined);
    throw err;
  }
}

function assertCanActOnAssignment(
  ctx: ServiceCtx,
  assignment: ShiftAssignmentRow,
  selfCap: "assignments:confirm:self" | "assignments:reject:self",
  anyCap: "assignments:confirm:any" | "assignments:reject:any",
) {
  const isSelf = ctx.professionalId != null && assignment.professional_id === ctx.professionalId;

  if (isSelf) {
    assertCan(ctx.role, selfCap);
    return;
  }

  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Profissional só pode operar sobre a própria atribuição.", {
      assignmentId: assignment.id,
    });
  }
  assertCan(ctx.role, anyCap);
}

export async function confirmAssignment(
  ctx: ServiceCtx,
  assignmentId: string,
): Promise<ShiftAssignmentRow> {
  const id = expectUuid(assignmentId, "assignmentId");
  const current = await loadAssignment(ctx, id);

  assertCanActOnAssignment(ctx, current, "assignments:confirm:self", "assignments:confirm:any");

  if (current.assignment_status === "confirmed") return current;
  if (!canTransition(assignmentTransitions, current.assignment_status, "confirmed")) {
    throw new StatusTransitionError(current.assignment_status, "confirmed", "assignment");
  }

  const shift = await loadShift(ctx, current.shift_id);
  if (shift.status === "cancelled" || shift.status === "completed") {
    throw new DomainError(
      "shift_cancelled",
      `Plantão em estado ${shift.status} não pode ter confirmações.`,
      { status: shift.status },
    );
  }

  const { data, error } = await ctx.client
    .from("shift_assignments")
    .update({ assignment_status: "confirmed" })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .select("*")
    .single();

  if (error) {
    const mapped = mapPostgresError(error);
    // O índice parcial `one_confirmed_per_shift` gera 23505 quando há
    // outro confirmado para o mesmo shift.
    if (mapped instanceof ConflictError) {
      throw new ConflictError("Já existe uma confirmação para este plantão.", {
        shiftId: shift.id,
      });
    }
    throw mapped;
  }
  await recordOperationalEventSafe(ctx, assignmentConfirmedEvent(data));
  return data;
}

export async function rejectAssignment(
  ctx: ServiceCtx,
  assignmentId: string,
): Promise<ShiftAssignmentRow> {
  const id = expectUuid(assignmentId, "assignmentId");
  const current = await loadAssignment(ctx, id);

  assertCanActOnAssignment(ctx, current, "assignments:reject:self", "assignments:reject:any");

  if (current.assignment_status === "rejected") return current;
  if (!canTransition(assignmentTransitions, current.assignment_status, "rejected")) {
    throw new StatusTransitionError(current.assignment_status, "rejected", "assignment");
  }

  const { data, error } = await ctx.client
    .from("shift_assignments")
    .update({ assignment_status: "rejected" })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .select("*")
    .single();

  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, assignmentRejectedEvent(data));
  return data;
}
