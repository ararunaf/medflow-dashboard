/**
 * Aplicação ordenada das mutações simuladas → efeitos reais limitados e auditáveis.
 *
 * Não substitui transação ACID multi-tabela no Postgres: usa passos curtos +
 * trilha `AppliedForwardStep[]` para compensação controlada em caso de falha.
 */
import { mapPostgresError, ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
import { extractEntityIdsFromProposal } from "@/lib/operations/execution-sandbox";
import type {
  OperationalSimulationResult,
  SimulatedMutation,
} from "@/lib/operations/execution-sandbox/types";
import type { ExtractedPayloadEntityIds } from "@/lib/operations/execution-sandbox/simulation-validators";
import type { AppliedForwardStep } from "@/lib/operations/mutation-execution/types";
import { createAssignment } from "@/lib/services/operations/assignments";
import type { ServiceCtx } from "@/lib/services/operations/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function insertOperationalEventReturningId(
  ctx: ServiceCtx,
  input: {
    entityType: "shift" | "swap" | "coordinator_action";
    entityId: string;
    description: string;
    metadata: import("@/lib/database.types").JsonObject;
    severity?: "info" | "warning" | "critical";
  },
): Promise<string> {
  const { data, error } = await ctx.client
    .from("operational_events")
    .insert({
      tenant_id: ctx.tenantId,
      actor_profile_id: ctx.actorProfileId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      event_type: "operational_action_triggered",
      severity: input.severity ?? "info",
      description: input.description.slice(0, 4000),
      metadata: input.metadata as import("@/lib/database.types").Json,
    })
    .select("id")
    .single();
  if (error) throw mapPostgresError(error);
  return expectUuid(data.id, "eventId");
}

function resolveAssignmentPair(
  mutation: SimulatedMutation,
  ids: ExtractedPayloadEntityIds,
  createIndex: number,
): { shiftId: string; professionalId: string } | null {
  const patch = mutation.projectedPatch;
  if (patch && typeof patch.shift_id === "string" && typeof patch.professional_id === "string") {
    if (UUID_RE.test(patch.shift_id) && UUID_RE.test(patch.professional_id)) {
      return { shiftId: patch.shift_id, professionalId: patch.professional_id };
    }
  }
  const shiftId = mutation.referencesEntityIds.find((x) => UUID_RE.test(x));
  const professionalId = ids.professionalIds[createIndex];
  if (shiftId && professionalId && UUID_RE.test(shiftId) && UUID_RE.test(professionalId)) {
    return { shiftId, professionalId };
  }
  return null;
}

async function applyOneMutation(
  ctx: ServiceCtx,
  input: {
    proposal: OperationalActionProposalDto;
    executionId: string;
    mutation: SimulatedMutation;
    ids: ExtractedPayloadEntityIds;
    assignmentCreateIndex: number;
  },
): Promise<{ step: AppliedForwardStep | null; nextAssignmentIndex: number }> {
  const { proposal, executionId, mutation, ids } = input;
  let nextAssignmentIndex = input.assignmentCreateIndex;

  if (mutation.targetTable === "shift_assignments" && mutation.direction === "create") {
    const pair = resolveAssignmentPair(mutation, ids, nextAssignmentIndex);
    if (!pair) {
      throw new ValidationError(
        "Não foi possível resolver par (plantão, profissional) para criar atribuição supervisionada.",
        { mutationId: mutation.id },
      );
    }
    nextAssignmentIndex += 1;
    const row = await createAssignment(ctx, {
      shiftId: expectUuid(pair.shiftId, "shiftId"),
      professionalId: expectUuid(pair.professionalId, "professionalId"),
    });
    return {
      step: {
        kind: "pending_assignment",
        mutationId: mutation.id,
        assignmentId: row.id,
        shiftId: row.shift_id,
        professionalId: row.professional_id,
      },
      nextAssignmentIndex,
    };
  }

  if (mutation.targetTable === "operational_events") {
    const eventId = await insertOperationalEventReturningId(ctx, {
      entityType: "coordinator_action",
      entityId: proposal.id,
      description: mutation.describe,
      metadata: {
        channel: "supervised_mutation_execution",
        supervised_execution_id: executionId,
        mutation_id: mutation.id,
        proposal_id: proposal.id,
        action_kind: proposal.actionKind,
      },
    });
    return {
      step: {
        kind: "operational_event",
        mutationId: mutation.id,
        eventId,
        entityType: "coordinator_action",
        entityId: proposal.id,
      },
      nextAssignmentIndex,
    };
  }

  if (mutation.targetTable === "shifts") {
    const shiftId = mutation.referencesEntityIds.find((x) => UUID_RE.test(x)) ?? null;
    const entityId = shiftId ?? proposal.id;
    const eventId = await insertOperationalEventReturningId(ctx, {
      entityType: shiftId ? "shift" : "coordinator_action",
      entityId,
      description: mutation.describe,
      metadata: {
        channel: "supervised_mutation_execution",
        supervised_execution_id: executionId,
        mutation_id: mutation.id,
        proposal_id: proposal.id,
        action_kind: proposal.actionKind,
        staffing: true,
        shift_id: shiftId,
      },
    });
    return {
      step: {
        kind: "operational_event",
        mutationId: mutation.id,
        eventId,
        entityType: shiftId ? "shift" : "coordinator_action",
        entityId,
      },
      nextAssignmentIndex,
    };
  }

  if (mutation.targetTable === "shift_swap_requests") {
    const swapId = mutation.referencesEntityIds.find((x) => UUID_RE.test(x)) ?? proposal.id;
    const eventId = await insertOperationalEventReturningId(ctx, {
      entityType: "swap",
      entityId: swapId,
      description: mutation.describe,
      metadata: {
        channel: "supervised_mutation_execution",
        supervised_execution_id: executionId,
        mutation_id: mutation.id,
        proposal_id: proposal.id,
        coordination: true,
      },
    });
    return {
      step: {
        kind: "operational_event",
        mutationId: mutation.id,
        eventId,
        entityType: "swap",
        entityId: swapId,
      },
      nextAssignmentIndex,
    };
  }

  return { step: null, nextAssignmentIndex };
}

export async function applySimulationMutationsOrdered(
  ctx: ServiceCtx,
  input: {
    proposal: OperationalActionProposalDto;
    simulation: OperationalSimulationResult;
    executionId: string;
  },
): Promise<AppliedForwardStep[]> {
  const applied: AppliedForwardStep[] = [];
  const ids = extractEntityIdsFromProposal(input.proposal);
  let assignmentCreateIndex = 0;

  for (const mutation of input.simulation.mutations) {
    const { step, nextAssignmentIndex } = await applyOneMutation(ctx, {
      proposal: input.proposal,
      executionId: input.executionId,
      mutation,
      ids,
      assignmentCreateIndex,
    });
    assignmentCreateIndex = nextAssignmentIndex;
    if (step) applied.push(step);
  }

  return applied;
}
