/**
 * Server functions da timeline operacional (leitura paginada + observações da central).
 */
import { createServerFn } from "@tanstack/react-start";
import { expectUuid } from "@/lib/domain/operations/validation";
import {
  optionalString,
  requireObject,
  requireString,
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import {
  appendOperationalTimelineObservation,
  type TimelineObservationInput,
} from "@/lib/services/operations/operational-event-service";
import {
  listOperationalEventsPage,
  type ListOperationalTimelineInput,
  type OperationalTimelinePage,
} from "@/lib/services/operations/operational-event-queries";
import type { OperationalEntityType, OperationalEventSeverity } from "@/lib/database.types";
import {
  isOperationalEntityType,
  isOperationalEventSeverity,
} from "@/lib/operations/timeline/event-registry";
import type { TimelineScope } from "@/lib/operations/timeline";

function parseScope(raw: unknown): TimelineScope {
  const obj = requireObject(raw);
  const kind = requireString(obj.kind, "scope.kind");
  if (kind === "global") return { kind: "global" };
  if (kind === "shift") return { kind: "shift", shiftId: expectUuid(obj.shiftId, "scope.shiftId") };
  if (kind === "professional") {
    return {
      kind: "professional",
      professionalId: expectUuid(obj.professionalId, "scope.professionalId"),
    };
  }
  if (kind === "swap") return { kind: "swap", swapId: expectUuid(obj.swapId, "scope.swapId") };
  throw new Error(`scope.kind inválido: ${kind}`);
}

function parseListInput(raw: unknown): ListOperationalTimelineInput {
  const obj = requireObject(raw);
  const scope = parseScope(obj.scope);
  const limit =
    typeof obj.limit === "number" && Number.isFinite(obj.limit) ? Math.floor(obj.limit) : undefined;
  let cursor: ListOperationalTimelineInput["cursor"] = null;
  if (obj.cursor != null && typeof obj.cursor === "object" && !Array.isArray(obj.cursor)) {
    const c = obj.cursor as Record<string, unknown>;
    cursor = {
      createdAt: requireString(c.createdAt, "cursor.createdAt"),
      id: expectUuid(c.id, "cursor.id"),
    };
  }
  const sevRaw = optionalString(obj.severity, "severity");
  let severity: OperationalEventSeverity | undefined;
  if (sevRaw !== undefined) {
    if (!isOperationalEventSeverity(sevRaw)) throw new Error("severity inválida.");
    severity = sevRaw;
  }
  const etRaw = optionalString(obj.entityType, "entityType");
  let entityType: OperationalEntityType | undefined;
  if (etRaw !== undefined) {
    if (!isOperationalEntityType(etRaw)) throw new Error("entityType inválido.");
    entityType = etRaw;
  }
  return {
    scope,
    limit,
    cursor: cursor ?? undefined,
    severity,
    entityType,
  };
}

export const listOperationalTimelinePageFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): ListOperationalTimelineInput => parseListInput(raw))
  .handler(async ({ data }): Promise<QueryResult<OperationalTimelinePage>> => {
    return runQuery((ctx) => listOperationalEventsPage(ctx, data));
  });

export const appendOperationalTimelineObservationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): TimelineObservationInput => {
    const obj = requireObject(raw);
    const eventType = requireString(obj.eventType, "eventType");
    if (eventType !== "critical_alert_generated" && eventType !== "operational_action_triggered") {
      throw new Error("eventType inválido para observação.");
    }
    const entityId = requireString(obj.entityId, "entityId");
    const description = requireString(obj.description, "description");
    const meta =
      obj.metadata != null && typeof obj.metadata === "object" && !Array.isArray(obj.metadata)
        ? (obj.metadata as import("@/lib/database.types").JsonObject)
        : undefined;
    if (eventType === "critical_alert_generated") {
      return { eventType, entityId, description, metadata: meta };
    }
    return { eventType: "operational_action_triggered", entityId, description, metadata: meta };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => appendOperationalTimelineObservation(ctx, data));
  });

export type {
  ListOperationalTimelineInput,
  OperationalTimelinePage,
} from "@/lib/services/operations/operational-event-queries";
