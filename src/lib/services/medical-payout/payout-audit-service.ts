import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { Json } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type MedicalPayoutAuditAction =
  | "calculation"
  | "review"
  | "approval"
  | "payment"
  | "status_change"
  | "rule_change";

export async function appendMedicalPayoutAudit(
  ctx: ServiceCtx,
  input: {
    payout_id: string;
    action: MedicalPayoutAuditAction;
    payload?: Record<string, unknown>;
    soft?: boolean;
  },
): Promise<void> {
  const row = {
    tenant_id: ctx.tenantId,
    payout_id: input.payout_id,
    action: input.action,
    actor_profile_id: ctx.actorProfileId,
    payload: (input.payload ?? {}) as Json,
  };
  const { error } = await ctx.client.from("medical_payout_audit").insert(row);
  if (error) {
    if (input.soft) {
      console.warn("[medical_payout_audit] insert failed", error.message);
      return;
    }
    throw mapPostgresError(error);
  }
}

export async function listMedicalPayoutAudit(ctx: ServiceCtx, payoutId: string) {
  const { data, error } = await ctx.client
    .from("medical_payout_audit")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("payout_id", payoutId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw mapPostgresError(error);
  return data ?? [];
}
