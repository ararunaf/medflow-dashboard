import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { Json } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { FinancialClosingAuditRow } from "./types";

export async function appendFinancialClosingAudit(
  ctx: ServiceCtx,
  input: {
    closingId: string;
    action: string;
    payload?: Record<string, unknown>;
  },
): Promise<FinancialClosingAuditRow> {
  assertCan(ctx.role, "financial_closing:write");
  const payload = (input.payload ?? {}) as Json;
  const { data, error } = await ctx.client
    .from("financial_closing_audit")
    .insert({
      tenant_id: ctx.tenantId,
      closing_id: input.closingId,
      action: input.action,
      actor_profile_id: ctx.actorProfileId,
      payload,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  if (!data) throw new Error("financial_closing_audit insert sem retorno.");
  return data as FinancialClosingAuditRow;
}

export async function listFinancialClosingAudit(
  ctx: ServiceCtx,
  closingId: string,
  limit = 200,
): Promise<FinancialClosingAuditRow[]> {
  assertCan(ctx.role, "financial_closing:read");
  const { data, error } = await ctx.client
    .from("financial_closing_audit")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("closing_id", closingId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgresError(error);
  return (data ?? []) as FinancialClosingAuditRow[];
}
