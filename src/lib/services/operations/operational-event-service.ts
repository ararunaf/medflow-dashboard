/**
 * Serviço de persistência de operational_events (audit trail append-only).
 * Falhas de auditoria são registradas no console e nunca interrompem o fluxo principal.
 */
import { isOperationalManager } from "@/lib/auth/rbac";
import type { Database } from "@/lib/database.types";
import { PermissionError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "./types";

export type OperationalEventInsertBody = Omit<
  Database["public"]["Tables"]["operational_events"]["Insert"],
  "tenant_id" | "actor_profile_id"
>;

export async function recordOperationalEventSafe(
  ctx: ServiceCtx,
  body: OperationalEventInsertBody,
): Promise<void> {
  const { error } = await ctx.client.from("operational_events").insert({
    ...body,
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
  });
  if (error) {
    console.warn("[operational_events] insert failed", error.message);
  }
}

export type CriticalAlertObservationInput = {
  eventType: "critical_alert_generated";
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export type OperationalActionObservationInput = {
  eventType: "operational_action_triggered";
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export type TimelineObservationInput =
  | CriticalAlertObservationInput
  | OperationalActionObservationInput;

/**
 * Observações disparadas a partir da central (alertas críticos visíveis, atalhos contextuais).
 * Restrito a gestores operacionais; não bloqueia a UI se o insert falhar.
 */
export async function appendOperationalTimelineObservation(
  ctx: ServiceCtx,
  input: TimelineObservationInput,
): Promise<void> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Apenas gestores operacionais registram observações na timeline.", {
      eventType: input.eventType,
    });
  }

  if (input.eventType === "critical_alert_generated") {
    await recordOperationalEventSafe(ctx, {
      entity_type: "alert",
      entity_id: input.entityId,
      event_type: "critical_alert_generated",
      severity: "critical",
      description: input.description,
      metadata: input.metadata ?? {},
    });
    return;
  }

  await recordOperationalEventSafe(ctx, {
    entity_type: "coordinator_action",
    entity_id: input.entityId,
    event_type: "operational_action_triggered",
    severity: "info",
    description: input.description,
    metadata: input.metadata ?? {},
  });
}
