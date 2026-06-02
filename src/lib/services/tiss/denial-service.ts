import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import type { Database, TissDenialStatus, TissDenialType } from "@/lib/database.types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { appendDenialAudit } from "./denial-audit-service";
import type { TissDenialRow } from "./types";

type DenialInsert = Database["public"]["Tables"]["tiss_denials"]["Insert"];
type DenialUpdate = Database["public"]["Tables"]["tiss_denials"]["Update"];

export async function listTissDenials(ctx: ServiceCtx): Promise<TissDenialRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tiss_denials")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function createTissDenial(
  ctx: ServiceCtx,
  input: {
    return_id: string;
    guide_id: string;
    denial_type: TissDenialType;
    denial_reason_code?: string;
    denial_reason_description?: string;
    denied_value: number;
    status?: TissDenialStatus;
  },
): Promise<TissDenialRow> {
  assertCan(ctx.role, "tiss:write");
  const row: DenialInsert = {
    tenant_id: ctx.tenantId,
    return_id: input.return_id,
    guide_id: input.guide_id,
    denial_type: input.denial_type,
    denial_reason_code: (input.denial_reason_code ?? "").trim(),
    denial_reason_description: (input.denial_reason_description ?? "").trim(),
    denied_value: input.denied_value,
    status: input.status ?? "identified",
  };
  const { data, error } = await ctx.client.from("tiss_denials").insert(row).select("*").single();
  if (error) throw mapPostgresError(error);
  await appendDenialAudit(ctx, {
    denial_id: data.id,
    action: "denial_created",
    payload: {
      return_id: data.return_id,
      guide_id: data.guide_id,
      denial_type: data.denial_type,
      denied_value: data.denied_value,
    },
    soft: true,
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_denial",
    entity_id: data.id,
    event_type: "tiss_denial_created",
    severity: "warning",
    description: `Glosa registrada (${data.denial_type}) — R$ ${Number(data.denied_value).toFixed(2)}`,
    metadata: {
      denial_id: data.id,
      guide_id: data.guide_id,
      return_id: data.return_id,
      denial_reason_code: data.denial_reason_code,
    },
  });
  return data;
}

export async function updateTissDenialStatus(
  ctx: ServiceCtx,
  denialId: string,
  patch: Partial<
    Pick<
      TissDenialRow,
      "status" | "denied_value" | "denial_reason_code" | "denial_reason_description"
    >
  >,
): Promise<TissDenialRow> {
  assertCan(ctx.role, "tiss:write");
  const { data: before, error: bErr } = await ctx.client
    .from("tiss_denials")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", denialId)
    .maybeSingle();
  if (bErr) throw mapPostgresError(bErr);
  if (!before) throw new ValidationError("Glosa não encontrada.", { field: "denialId" });

  const updateBody: DenialUpdate = { ...patch };
  if (patch.denial_reason_code !== undefined) {
    updateBody.denial_reason_code = patch.denial_reason_code.trim();
  }
  if (patch.denial_reason_description !== undefined) {
    updateBody.denial_reason_description = patch.denial_reason_description.trim();
  }
  const { data, error } = await ctx.client
    .from("tiss_denials")
    .update(updateBody)
    .eq("tenant_id", ctx.tenantId)
    .eq("id", denialId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);

  const reversed = patch.status === "reversed" && before.status !== "reversed";
  await appendDenialAudit(ctx, {
    denial_id: data.id,
    action: reversed ? "denial_reversed" : "denial_updated",
    payload: { before, after: data },
    soft: true,
  });
  if (reversed) {
    await recordOperationalEventSafe(ctx, {
      entity_type: "tiss_denial",
      entity_id: data.id,
      event_type: "tiss_denial_reversed",
      severity: "info",
      description: "Glosa revertida operacionalmente",
      metadata: { denial_id: data.id, guide_id: data.guide_id },
    });
  } else {
    await recordOperationalEventSafe(ctx, {
      entity_type: "tiss_denial",
      entity_id: data.id,
      event_type: "tiss_denial_updated",
      severity: "info",
      description: "Glosa atualizada",
      metadata: { denial_id: data.id, guide_id: data.guide_id },
    });
  }
  return data;
}
