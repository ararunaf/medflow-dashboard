/**
 * Service de trocas de plantão (shift_swap_requests).
 *
 * Regras enforçadas:
 * - somente o próprio professional pode solicitar troca de seu plantão;
 * - troca apenas em shift futuro (`starts_at > now()`), não cancelado;
 * - target deve ser profissional do mesmo tenant, distinto do requester;
 * - somente coordinator/tenant_admin/super_admin aprovam ou negam;
 * - aprovar: revoga assignment confirmado do requester e cria/confirma
 *   atribuição para o target (mantendo a unicidade do índice parcial).
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
import { canTransition, swapRequestTransitions } from "@/lib/domain/operations/status";
import { expectFutureTimestamp, expectUuid } from "@/lib/domain/operations/validation";
import { swapApprovedEvent, swapDeniedEvent, swapRequestedEvent } from "@/lib/operations/timeline";
import type { ServiceCtx, ShiftAssignmentRow, ShiftRow, ShiftSwapRequestRow } from "./types";
import { recordOperationalEventSafe } from "./operational-event-service";

export type RequestSwapInput = {
  shiftId: string;
  targetProfessionalId: string;
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

async function loadSwap(ctx: ServiceCtx, swapId: string): Promise<ShiftSwapRequestRow> {
  const { data, error } = await ctx.client
    .from("shift_swap_requests")
    .select("*")
    .eq("id", swapId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new NotFoundError("Solicitação de troca", swapId);
  return data;
}

async function loadConfirmedAssignment(
  ctx: ServiceCtx,
  shiftId: string,
  professionalId: string,
): Promise<ShiftAssignmentRow | null> {
  const { data, error } = await ctx.client
    .from("shift_assignments")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("shift_id", shiftId)
    .eq("professional_id", professionalId)
    .eq("assignment_status", "confirmed")
    .maybeSingle();
  if (error) throw mapPostgresError(error);
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

export async function requestSwap(
  ctx: ServiceCtx,
  input: RequestSwapInput,
): Promise<ShiftSwapRequestRow> {
  assertCan(ctx.role, "swaps:request:self");
  if (!ctx.professionalId) {
    throw new PermissionError("Usuário não está vinculado a um profissional.");
  }

  const shiftId = expectUuid(input.shiftId, "shiftId");
  const targetProfessionalId = expectUuid(input.targetProfessionalId, "targetProfessionalId");

  if (targetProfessionalId === ctx.professionalId) {
    throw new DomainError(
      "validation_failed",
      "Profissional alvo deve ser diferente do solicitante.",
    );
  }

  const shift = await loadShift(ctx, shiftId);
  if (shift.status === "cancelled" || shift.status === "completed") {
    throw new DomainError(
      "shift_cancelled",
      `Plantão em estado ${shift.status} não admite troca.`,
      { status: shift.status },
    );
  }
  expectFutureTimestamp(shift.starts_at, "shift.startsAt");

  const requesterAssignment = await loadConfirmedAssignment(ctx, shiftId, ctx.professionalId);
  if (!requesterAssignment) {
    throw new DomainError(
      "swap_not_owner",
      "Você não possui atribuição confirmada para este plantão.",
      { shiftId },
    );
  }

  await assertProfessionalInTenant(ctx, targetProfessionalId);

  const { data, error } = await ctx.client
    .from("shift_swap_requests")
    .insert({
      tenant_id: ctx.tenantId,
      shift_id: shiftId,
      requester_professional_id: ctx.professionalId,
      target_professional_id: targetProfessionalId,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, swapRequestedEvent(data));
  return data;
}

async function transitionSwap(
  ctx: ServiceCtx,
  swap: ShiftSwapRequestRow,
  nextStatus: "approved" | "denied",
): Promise<ShiftSwapRequestRow> {
  if (!canTransition(swapRequestTransitions, swap.status, nextStatus)) {
    throw new StatusTransitionError(swap.status, nextStatus, "swap_request");
  }
  const { data, error } = await ctx.client
    .from("shift_swap_requests")
    .update({ status: nextStatus })
    .eq("id", swap.id)
    .eq("tenant_id", ctx.tenantId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}

export async function approveSwap(
  ctx: ServiceCtx,
  swapId: string,
): Promise<{ swap: ShiftSwapRequestRow; targetAssignment: ShiftAssignmentRow }> {
  assertCan(ctx.role, "swaps:approve");
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenadores/admins aprovam trocas.");
  }

  const id = expectUuid(swapId, "swapId");
  const swap = await loadSwap(ctx, id);

  const shift = await loadShift(ctx, swap.shift_id);
  if (shift.status === "cancelled" || shift.status === "completed") {
    throw new DomainError(
      "shift_cancelled",
      `Plantão em estado ${shift.status}; troca não aplicável.`,
      { status: shift.status },
    );
  }

  // 1. Rejeita assignment confirmado do requester (libera índice parcial).
  const requesterAssignment = await loadConfirmedAssignment(
    ctx,
    shift.id,
    swap.requester_professional_id,
  );
  if (!requesterAssignment) {
    throw new ConflictError("Requester não possui mais atribuição confirmada para este plantão.");
  }
  {
    const { error } = await ctx.client
      .from("shift_assignments")
      .update({ assignment_status: "rejected" })
      .eq("id", requesterAssignment.id)
      .eq("tenant_id", ctx.tenantId);
    if (error) throw mapPostgresError(error);
  }

  // 2. Reabilita uma atribuição confirmada para o target.
  // Tenta atualizar uma pré-existente (qualquer status) para `confirmed`,
  // senão cria uma nova já confirmada.
  let targetAssignment: ShiftAssignmentRow;
  {
    const { data: existing, error: lookupErr } = await ctx.client
      .from("shift_assignments")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("shift_id", shift.id)
      .eq("professional_id", swap.target_professional_id)
      .maybeSingle();
    if (lookupErr) throw mapPostgresError(lookupErr);

    if (existing && existing.assignment_status !== "rejected") {
      const { data, error } = await ctx.client
        .from("shift_assignments")
        .update({ assignment_status: "confirmed" })
        .eq("id", existing.id)
        .eq("tenant_id", ctx.tenantId)
        .select("*")
        .single();
      if (error) throw mapPostgresError(error);
      targetAssignment = data;
    } else {
      const { data, error } = await ctx.client
        .from("shift_assignments")
        .insert({
          tenant_id: ctx.tenantId,
          shift_id: shift.id,
          professional_id: swap.target_professional_id,
          assignment_status: "confirmed",
        })
        .select("*")
        .single();
      if (error) throw mapPostgresError(error);
      targetAssignment = data;
    }
  }

  // 3. Marca o swap como approved.
  const updatedSwap = await transitionSwap(ctx, swap, "approved");
  await recordOperationalEventSafe(ctx, swapApprovedEvent(updatedSwap));
  return { swap: updatedSwap, targetAssignment };
}

export async function denySwap(ctx: ServiceCtx, swapId: string): Promise<ShiftSwapRequestRow> {
  assertCan(ctx.role, "swaps:deny");
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas coordenadores/admins negam trocas.");
  }

  const id = expectUuid(swapId, "swapId");
  const swap = await loadSwap(ctx, id);
  const updated = await transitionSwap(ctx, swap, "denied");
  await recordOperationalEventSafe(ctx, swapDeniedEvent(updated));
  return updated;
}
