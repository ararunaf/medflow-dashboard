import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { Database, TissAppealStatus } from "@/lib/database.types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { appendDenialAudit } from "./denial-audit-service";
import type { TissDenialAppealRow } from "./types";

type AppealInsert = Database["public"]["Tables"]["tiss_denial_appeals"]["Insert"];

export async function listTissDenialAppeals(ctx: ServiceCtx): Promise<TissDenialAppealRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tiss_denial_appeals")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function createTissDenialAppeal(
  ctx: ServiceCtx,
  input: { denial_id: string; appeal_reason: string },
): Promise<TissDenialAppealRow> {
  assertCan(ctx.role, "tiss:write");
  const row: AppealInsert = {
    tenant_id: ctx.tenantId,
    denial_id: input.denial_id,
    appeal_reason: input.appeal_reason.trim(),
    appeal_status: "submitted",
    created_by: ctx.actorProfileId,
  };
  const { data, error } = await ctx.client
    .from("tiss_denial_appeals")
    .insert(row)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);

  const { error: dErr } = await ctx.client
    .from("tiss_denials")
    .update({ status: "appealed" })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.denial_id);
  if (dErr) throw mapPostgresError(dErr);

  await appendDenialAudit(ctx, {
    denial_id: input.denial_id,
    action: "appeal_created",
    payload: { appeal_id: data.id, appeal_status: data.appeal_status },
    soft: true,
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_denial_appeal",
    entity_id: data.id,
    event_type: "tiss_denial_appeal_created",
    severity: "info",
    description: "Recurso de glosa registrado",
    metadata: { appeal_id: data.id, denial_id: input.denial_id },
  });
  return data;
}

export async function updateTissDenialAppealStatus(
  ctx: ServiceCtx,
  appealId: string,
  patch: { appeal_status: TissAppealStatus },
): Promise<TissDenialAppealRow> {
  assertCan(ctx.role, "tiss:write");
  const { data, error } = await ctx.client
    .from("tiss_denial_appeals")
    .update({ appeal_status: patch.appeal_status })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", appealId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  await appendDenialAudit(ctx, {
    denial_id: data.denial_id,
    action: "appeal_updated",
    payload: { appeal_id: data.id, appeal_status: data.appeal_status },
    soft: true,
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_denial_appeal",
    entity_id: data.id,
    event_type: "tiss_denial_appeal_updated",
    severity: "info",
    description: `Status do recurso: ${data.appeal_status}`,
    metadata: { appeal_id: data.id, denial_id: data.denial_id },
  });
  return data;
}
