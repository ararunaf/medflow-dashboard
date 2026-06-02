import type { OperationalActionProposalAuditEvent } from "@/lib/database.types";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

export async function insertProposalAuditRow(
  ctx: ServiceCtx,
  input: {
    proposalId: string;
    event: OperationalActionProposalAuditEvent;
    note?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await ctx.client.from("operational_action_proposal_audit").insert({
    tenant_id: ctx.tenantId,
    proposal_id: input.proposalId,
    actor_profile_id: ctx.actorProfileId,
    event: input.event,
    note: input.note?.trim() ? input.note.trim() : null,
    metadata: input.metadata ?? {},
  });
  if (error) throw mapPostgresError(error);
}

export async function recordProposalTimelineObservationSafe(
  ctx: ServiceCtx,
  input: {
    proposalId: string;
    title: string;
    actionKind: string;
    state: string;
  },
): Promise<void> {
  try {
    await recordOperationalEventSafe(ctx, {
      entity_type: "coordinator_action",
      entity_id: input.proposalId,
      event_type: "operational_action_triggered",
      severity: "info",
      description: `Proposta operacional supervisionada: ${input.title.slice(0, 160)}`,
      metadata: {
        proposal_id: input.proposalId,
        action_kind: input.actionKind,
        state: input.state,
        channel: "operational_action_proposal",
      },
    });
  } catch (e) {
    console.warn("[operational_action_proposal] timeline mirror skipped", e);
  }
}
