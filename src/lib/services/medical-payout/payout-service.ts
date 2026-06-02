import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { appendMedicalPayoutAudit } from "./payout-audit-service";
import type {
  MedicalPayoutItemRow,
  MedicalPayoutRow,
  MedicalPayoutStatus,
  PayoutRuleRow,
  PayoutRuleType,
} from "./types";
import { normalizeCompetenceMonth } from "./production-service";

export async function listPayoutRules(ctx: ServiceCtx): Promise<PayoutRuleRow[]> {
  assertCan(ctx.role, "payouts:read");
  const { data, error } = await ctx.client
    .from("payout_rules")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw mapPostgresError(error);
  return (data ?? []) as PayoutRuleRow[];
}

export async function createPayoutRule(
  ctx: ServiceCtx,
  input: {
    professional_id?: string | null;
    specialty?: string;
    insurance_provider_id?: string | null;
    payout_type: PayoutRuleType;
    payout_percentage?: number | null;
    fixed_value?: number | null;
    active?: boolean;
  },
): Promise<PayoutRuleRow> {
  assertCan(ctx.role, "payouts:write");
  const row = {
    tenant_id: ctx.tenantId,
    professional_id: input.professional_id ?? null,
    specialty: input.specialty ?? "",
    insurance_provider_id: input.insurance_provider_id ?? null,
    payout_type: input.payout_type,
    payout_percentage: input.payout_percentage ?? null,
    fixed_value: input.fixed_value ?? null,
    active: input.active ?? true,
  };
  const { data, error } = await ctx.client.from("payout_rules").insert(row).select("*").single();
  if (error) throw mapPostgresError(error);

  await recordOperationalEventSafe(ctx, {
    entity_type: "payout_rule",
    entity_id: data.id,
    event_type: "payout_rule_created",
    severity: "info",
    description: "Regra de repasse / retenção criada.",
    metadata: { payout_type: input.payout_type },
  });
  return data as PayoutRuleRow;
}

export async function setPayoutRuleActive(
  ctx: ServiceCtx,
  ruleId: string,
  active: boolean,
): Promise<void> {
  assertCan(ctx.role, "payouts:write");
  const { error } = await ctx.client
    .from("payout_rules")
    .update({ active })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", ruleId);
  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, {
    entity_type: "payout_rule",
    entity_id: ruleId,
    event_type: "payout_rule_updated",
    severity: "info",
    description: active ? "Regra ativada." : "Regra desativada.",
    metadata: { active },
  });
}

export async function listMedicalPayoutsForCompetence(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<MedicalPayoutRow[]> {
  assertCan(ctx.role, "payouts:read");
  const cm = normalizeCompetenceMonth(competenceMonth);
  const { data, error } = await ctx.client
    .from("medical_payouts")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("competence_month", cm)
    .order("created_at", { ascending: false });
  if (error) throw mapPostgresError(error);
  return (data ?? []) as MedicalPayoutRow[];
}

export async function getMedicalPayoutWithItems(
  ctx: ServiceCtx,
  payoutId: string,
): Promise<{ payout: MedicalPayoutRow; items: MedicalPayoutItemRow[] } | null> {
  assertCan(ctx.role, "payouts:read");
  const { data: payout, error: pErr } = await ctx.client
    .from("medical_payouts")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", payoutId)
    .maybeSingle();
  if (pErr) throw mapPostgresError(pErr);
  if (!payout) return null;
  const { data: items, error: iErr } = await ctx.client
    .from("medical_payout_items")
    .select("*")
    .eq("payout_id", payoutId)
    .order("id");
  if (iErr) throw mapPostgresError(iErr);
  return { payout: payout as MedicalPayoutRow, items: (items ?? []) as MedicalPayoutItemRow[] };
}

export async function ensureDraftMedicalPayout(
  ctx: ServiceCtx,
  professionalId: string,
  competenceMonth: string,
): Promise<MedicalPayoutRow> {
  assertCan(ctx.role, "payouts:write");
  const cm = normalizeCompetenceMonth(competenceMonth);
  const { data: existing, error: e0 } = await ctx.client
    .from("medical_payouts")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("professional_id", professionalId)
    .eq("competence_month", cm)
    .maybeSingle();
  if (e0) throw mapPostgresError(e0);
  if (existing) return existing as MedicalPayoutRow;

  const { data, error } = await ctx.client
    .from("medical_payouts")
    .insert({
      tenant_id: ctx.tenantId,
      professional_id: professionalId,
      competence_month: cm,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  const row = data as MedicalPayoutRow;

  await appendMedicalPayoutAudit(ctx, {
    payout_id: row.id,
    action: "status_change",
    payload: { to: "draft", note: "rascunho criado" },
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "medical_payout",
    entity_id: row.id,
    event_type: "medical_payout_status_changed",
    severity: "info",
    description: `Rascunho de repasse (${cm}).`,
    metadata: { professional_id: professionalId, status: "draft" },
  });

  return row;
}

async function updatePayoutStatus(
  ctx: ServiceCtx,
  payoutId: string,
  from: MedicalPayoutStatus,
  to: MedicalPayoutStatus,
  auditAction: "review" | "approval" | "payment",
  eventSuffix: "reviewed" | "approved" | "paid",
): Promise<MedicalPayoutRow> {
  assertCan(ctx.role, "payouts:write");
  const { data, error } = await ctx.client
    .from("medical_payouts")
    .update({ status: to })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", payoutId)
    .eq("status", from)
    .select("*")
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) {
    throw new ValidationError(`Transição inválida: esperado status '${from}'.`, {
      field: "status",
    });
  }
  const row = data as MedicalPayoutRow;

  await appendMedicalPayoutAudit(ctx, {
    payout_id: payoutId,
    action: auditAction,
    payload: { from, to },
  });

  const eventType =
    eventSuffix === "reviewed"
      ? "medical_payout_reviewed"
      : eventSuffix === "approved"
        ? "medical_payout_approved"
        : "medical_payout_paid";

  await recordOperationalEventSafe(ctx, {
    entity_type: "medical_payout",
    entity_id: payoutId,
    event_type: eventType,
    severity: "info",
    description: `Repasse ${eventSuffix}.`,
    metadata: { from, to },
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "medical_payout",
    entity_id: payoutId,
    event_type: "medical_payout_status_changed",
    severity: "info",
    description: `Status do repasse: ${to}.`,
    metadata: { from, to },
  });

  return row;
}

export async function markMedicalPayoutReviewed(
  ctx: ServiceCtx,
  payoutId: string,
): Promise<MedicalPayoutRow> {
  return updatePayoutStatus(ctx, payoutId, "calculated", "reviewed", "review", "reviewed");
}

export async function markMedicalPayoutApproved(
  ctx: ServiceCtx,
  payoutId: string,
): Promise<MedicalPayoutRow> {
  return updatePayoutStatus(ctx, payoutId, "reviewed", "approved", "approval", "approved");
}

export async function markMedicalPayoutPaid(
  ctx: ServiceCtx,
  payoutId: string,
): Promise<MedicalPayoutRow> {
  return updatePayoutStatus(ctx, payoutId, "approved", "paid", "payment", "paid");
}
