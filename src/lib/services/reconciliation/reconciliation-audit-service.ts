import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { Json } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type {
  OperationalReconciliationAuditAction,
  OperationalReconciliationAuditRow,
} from "./types";

export async function appendReconciliationAudit(
  ctx: ServiceCtx,
  input: {
    reconciliationId: string;
    action: OperationalReconciliationAuditAction;
    payload?: Record<string, unknown>;
  },
): Promise<OperationalReconciliationAuditRow> {
  assertCan(ctx.role, "financial_closing:write");
  const payload = (input.payload ?? {}) as Json;
  const { data, error } = await ctx.client
    .from("operational_reconciliation_audit")
    .insert({
      tenant_id: ctx.tenantId,
      reconciliation_id: input.reconciliationId,
      action: input.action,
      actor_profile_id: ctx.actorProfileId,
      payload,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  if (!data) throw new Error("operational_reconciliation_audit insert sem retorno.");
  return data as OperationalReconciliationAuditRow;
}

export async function listReconciliationAudit(
  ctx: ServiceCtx,
  reconciliationId: string,
  limit = 200,
): Promise<OperationalReconciliationAuditRow[]> {
  assertCan(ctx.role, "financial_closing:read");
  const { data, error } = await ctx.client
    .from("operational_reconciliation_audit")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", reconciliationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgresError(error);
  return (data ?? []) as OperationalReconciliationAuditRow[];
}
