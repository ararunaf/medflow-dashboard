import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { Database, TissReturnStatus } from "@/lib/database.types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { TissReturnRow } from "./types";

type ReturnInsert = Database["public"]["Tables"]["tiss_returns"]["Insert"];

export async function listTissReturns(ctx: ServiceCtx): Promise<TissReturnRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tiss_returns")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function createTissReturn(
  ctx: ServiceCtx,
  input: { batch_id: string; return_reference: string },
): Promise<TissReturnRow> {
  assertCan(ctx.role, "tiss:write");
  const row: ReturnInsert = {
    tenant_id: ctx.tenantId,
    batch_id: input.batch_id,
    return_reference: input.return_reference.trim(),
    status: "received",
  };
  const { data, error } = await ctx.client.from("tiss_returns").insert(row).select("*").single();
  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_return",
    entity_id: data.id,
    event_type: "tiss_return_received",
    severity: "info",
    description: `Retorno TISS registrado (${data.return_reference})`,
    metadata: { return_id: data.id, batch_id: data.batch_id },
  });
  return data;
}

export async function updateTissReturnStatus(
  ctx: ServiceCtx,
  returnId: string,
  patch: { status: TissReturnStatus; processed_at?: string | null },
): Promise<TissReturnRow> {
  assertCan(ctx.role, "tiss:write");
  const processed_at =
    patch.processed_at !== undefined
      ? patch.processed_at
      : patch.status === "processed"
        ? new Date().toISOString()
        : null;
  const { data, error } = await ctx.client
    .from("tiss_returns")
    .update({
      status: patch.status,
      processed_at,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", returnId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  if (patch.status === "processed") {
    await recordOperationalEventSafe(ctx, {
      entity_type: "tiss_return",
      entity_id: data.id,
      event_type: "tiss_return_processed",
      severity: "info",
      description: `Retorno TISS processado (${data.return_reference})`,
      metadata: { return_id: data.id, batch_id: data.batch_id },
    });
  }
  return data;
}
