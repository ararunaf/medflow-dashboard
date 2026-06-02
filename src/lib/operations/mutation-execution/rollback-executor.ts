/**
 * Compensação supervisionada: reverte atribuições pendentes criadas na execução
 * e registra eventos de timeline para mutações apenas informativas (append-only).
 */
import { mapPostgresError, ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { AppliedForwardStep } from "@/lib/operations/mutation-execution/types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";

export type RollbackOutcome = {
  reversedSteps: number;
  detail: string;
};

async function deletePendingAssignmentIfPossible(
  ctx: ServiceCtx,
  assignmentId: string,
): Promise<boolean> {
  const id = expectUuid(assignmentId, "assignmentId");
  const { data, error } = await ctx.client
    .from("shift_assignments")
    .select("id, assignment_status")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) return false;
  if (data.assignment_status !== "pending") return false;
  const { error: delErr } = await ctx.client
    .from("shift_assignments")
    .delete()
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (delErr) throw mapPostgresError(delErr);
  return true;
}

export async function rollbackAppliedSteps(
  ctx: ServiceCtx,
  input: { executionId: string; proposalId: string; steps: readonly AppliedForwardStep[] },
): Promise<RollbackOutcome> {
  let reversed = 0;
  const reversedList: string[] = [];
  const steps = [...input.steps].reverse();

  for (const step of steps) {
    if (step.kind === "pending_assignment") {
      const ok = await deletePendingAssignmentIfPossible(ctx, step.assignmentId);
      if (ok) {
        reversed += 1;
        reversedList.push(`assignment:${step.assignmentId}`);
      }
      continue;
    }

    await recordOperationalEventSafe(ctx, {
      entity_type: "coordinator_action",
      entity_id: input.proposalId,
      event_type: "operational_action_triggered",
      severity: "warning",
      description: `Rollback supervisionado — evento correlato ${step.eventId.slice(0, 8)}…`,
      metadata: {
        channel: "supervised_mutation_rollback",
        supervised_execution_id: input.executionId,
        rolled_forward_event_id: step.eventId,
        mutation_id: step.mutationId,
        entity_type: step.entityType,
        entity_id: step.entityId,
      },
    });
    reversed += 1;
    reversedList.push(`event:${step.eventId}`);
  }

  return {
    reversedSteps: reversed,
    detail: reversedList.length ? reversedList.join("; ") : "Nada a compensar.",
  };
}

export async function validateRollbackAllowed(
  ctx: ServiceCtx,
  steps: readonly AppliedForwardStep[],
): Promise<void> {
  for (const step of steps) {
    if (step.kind !== "pending_assignment") continue;
    const id = expectUuid(step.assignmentId, "assignmentId");
    const { data, error } = await ctx.client
      .from("shift_assignments")
      .select("assignment_status")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw mapPostgresError(error);
    if (!data) {
      throw new ValidationError("Atribuição alvo do rollback não existe mais.", {
        assignmentId: id,
      });
    }
    if (data.assignment_status !== "pending") {
      throw new ValidationError(
        "Rollback bloqueado: atribuição já não está pendente (estado alterado após a execução).",
        { assignmentId: id, status: data.assignment_status },
      );
    }
  }
}
