/**
 * Leitura paginada da timeline operacional (keyset por created_at + id).
 */
import { assertCan } from "@/lib/auth/rbac";
import type {
  Database,
  OperationalEntityType,
  OperationalEventSeverity,
} from "@/lib/database.types";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import {
  professionalTimelineOrFilter,
  shiftTimelineOrFilter,
  type TimelineScope,
} from "@/lib/operations/timeline";
import type { ServiceCtx } from "./types";

export type OperationalEventRow = Database["public"]["Tables"]["operational_events"]["Row"];

export type OperationalTimelineCursor = { createdAt: string; id: string };

export type ListOperationalTimelineInput = {
  scope: TimelineScope;
  /** Default 30; máximo 100 no servidor. */
  limit?: number;
  cursor?: OperationalTimelineCursor | null;
  severity?: OperationalEventSeverity | null;
  entityType?: OperationalEntityType | null;
};

export type OperationalTimelinePage = {
  rows: OperationalEventRow[];
  nextCursor: OperationalTimelineCursor | null;
};

export async function listOperationalEventsPage(
  ctx: ServiceCtx,
  input: ListOperationalTimelineInput,
): Promise<OperationalTimelinePage> {
  assertCan(ctx.role, "shifts:read");

  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);

  let q = ctx.client.from("operational_events").select("*").eq("tenant_id", ctx.tenantId);

  if (input.scope.kind === "shift") {
    q = q.or(shiftTimelineOrFilter(input.scope.shiftId));
  } else if (input.scope.kind === "professional") {
    q = q.or(professionalTimelineOrFilter(input.scope.professionalId));
  } else if (input.scope.kind === "swap") {
    q = q.eq("entity_type", "swap").eq("entity_id", input.scope.swapId);
  }

  if (input.severity) {
    q = q.eq("severity", input.severity);
  }
  if (input.entityType) {
    q = q.eq("entity_type", input.entityType);
  }

  if (input.cursor) {
    const c = input.cursor;
    q = q.or(
      `created_at.lt.${encodeURIComponent(c.createdAt)},and(created_at.eq.${encodeURIComponent(c.createdAt)},id.lt.${encodeURIComponent(c.id)})`,
    );
  }

  q = q
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  const { data, error } = await q;
  if (error) throw mapPostgresError(error);

  const rows = (data ?? []) as OperationalEventRow[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const tail = page[page.length - 1];
  const nextCursor =
    hasMore && tail
      ? {
          createdAt: tail.created_at,
          id: tail.id,
        }
      : null;

  return { rows: page, nextCursor };
}
