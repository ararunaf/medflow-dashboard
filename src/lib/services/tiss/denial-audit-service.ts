import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { Database, Json, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";

type AuditInsert = Database["public"]["Tables"]["tiss_denial_audit"]["Insert"];

export type DenialAuditAction =
  | "denial_created"
  | "denial_updated"
  | "denial_reversed"
  | "appeal_created"
  | "appeal_updated";

/**
 * Auditoria granular de glosas (complementa `operational_events` na timeline).
 * Falhas são logadas e não interrompem fluxos críticos quando `soft` é true.
 */
export async function appendDenialAudit(
  ctx: ServiceCtx,
  input: {
    denial_id: string;
    action: DenialAuditAction;
    payload?: JsonObject;
    soft?: boolean;
  },
): Promise<void> {
  const row: AuditInsert = {
    tenant_id: ctx.tenantId,
    denial_id: input.denial_id,
    action: input.action,
    actor_profile_id: ctx.actorProfileId,
    payload: (input.payload ?? {}) as Json,
  };
  const { error } = await ctx.client.from("tiss_denial_audit").insert(row);
  if (error) {
    if (input.soft) {
      console.warn("[tiss_denial_audit] insert failed", error.message);
      return;
    }
    throw mapPostgresError(error);
  }
}

export async function listDenialAuditForDenial(ctx: ServiceCtx, denialId: string) {
  const { data, error } = await ctx.client
    .from("tiss_denial_audit")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("denial_id", denialId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw mapPostgresError(error);
  return data ?? [];
}
