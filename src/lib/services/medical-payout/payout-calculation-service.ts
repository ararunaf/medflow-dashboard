import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { appendMedicalPayoutAudit } from "./payout-audit-service";
import { computeRetentionValue, isRepasseRuleType } from "./retention-service";
import type { MedicalProductionRow, PayoutRuleRow } from "./types";
import { listPayoutRules } from "./payout-service";
import { syncMedicalProductionForCompetence } from "./production-service";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function scoreRepasseRule(
  rule: PayoutRuleRow,
  guide: { professional_id: string; insurance_provider_id: string },
  professionalSpecialty: string,
): number {
  if (!rule.active || !isRepasseRuleType(rule.payout_type)) return -1;
  if (rule.professional_id && rule.professional_id !== guide.professional_id) return -1;
  if (rule.insurance_provider_id && rule.insurance_provider_id !== guide.insurance_provider_id)
    return -1;
  const spec = (rule.specialty ?? "").trim();
  if (
    spec &&
    spec !== "*" &&
    spec.toLowerCase() !== (professionalSpecialty ?? "").trim().toLowerCase()
  )
    return -1;

  let s = 0;
  if (rule.professional_id) s += 100;
  if (rule.insurance_provider_id) s += 10;
  if (spec && spec !== "*") s += 5;
  return s;
}

function pickRepasseRule(
  rules: PayoutRuleRow[],
  guide: { professional_id: string; insurance_provider_id: string },
  specialty: string,
): PayoutRuleRow | null {
  let best: PayoutRuleRow | null = null;
  let bestScore = -1;
  for (const r of rules) {
    const sc = scoreRepasseRule(r, guide, specialty);
    if (sc > bestScore) {
      bestScore = sc;
      best = r;
    }
  }
  return bestScore >= 0 ? best : null;
}

function calculatedFromApproved(rule: PayoutRuleRow | null, approved: number): number {
  if (!rule) return roundMoney(approved);
  const ap = Number(approved);
  switch (rule.payout_type) {
    case "percentage": {
      const p = Number(rule.payout_percentage ?? 0);
      return roundMoney((ap * p) / 100);
    }
    case "fixed": {
      const f = Number(rule.fixed_value ?? 0);
      return roundMoney(Math.min(ap, f));
    }
    case "operational_discount": {
      const d = Number(rule.fixed_value ?? 0);
      return roundMoney(Math.max(0, ap - d));
    }
    default:
      return roundMoney(ap);
  }
}

export async function calculateMedicalPayout(
  ctx: ServiceCtx,
  payoutId: string,
  opts: { syncProduction?: boolean } = {},
): Promise<void> {
  assertCan(ctx.role, "payouts:write");

  const { data: payout, error: pErr } = await ctx.client
    .from("medical_payouts")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", payoutId)
    .maybeSingle();
  if (pErr) throw mapPostgresError(pErr);
  if (!payout) throw new ValidationError("Repasse não encontrado.", { field: "payoutId" });
  if (payout.status !== "draft") {
    throw new ValidationError("Recálculo permitido apenas em status rascunho.", {
      field: "status",
    });
  }

  const competenceMonth =
    typeof payout.competence_month === "string"
      ? payout.competence_month.slice(0, 10)
      : `${(payout.competence_month as unknown as Date).toISOString().slice(0, 10)}`;

  if (opts.syncProduction !== false) {
    await syncMedicalProductionForCompetence(ctx, competenceMonth);
  }

  const { data: productions, error: prodErr } = await ctx.client
    .from("medical_production")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("professional_id", payout.professional_id)
    .eq("competence_month", competenceMonth);
  if (prodErr) throw mapPostgresError(prodErr);
  const prows = (productions ?? []) as MedicalProductionRow[];

  const { data: prof, error: prErr } = await ctx.client
    .from("professionals")
    .select("specialty")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", payout.professional_id)
    .maybeSingle();
  if (prErr) throw mapPostgresError(prErr);
  const specialty = prof?.specialty ?? "";

  const rules = await listPayoutRules(ctx);

  const guideIds = prows.map((p) => p.guide_id);
  type GuideLite = {
    id: string;
    professional_id: string;
    insurance_provider_id: string;
    batch_id: string | null;
    attendance_date: string;
    tiss_batches: { competence: string } | null;
  };
  const guidesById: Record<string, GuideLite> = {};
  if (guideIds.length > 0) {
    const { data: guides, error: gErr } = await ctx.client
      .from("tiss_guides")
      .select(
        "id, professional_id, insurance_provider_id, batch_id, attendance_date, tiss_batches(competence)",
      )
      .eq("tenant_id", ctx.tenantId)
      .in("id", guideIds);
    if (gErr) throw mapPostgresError(gErr);
    for (const g of (guides ?? []) as GuideLite[]) {
      guidesById[g.id] = g;
    }
  }

  await ctx.client.from("medical_payout_items").delete().eq("payout_id", payoutId);

  let gross = 0;
  let denied = 0;
  let net = 0;
  let sumCalculated = 0;

  for (const row of prows) {
    gross += Number(row.gross_value);
    denied += Number(row.denied_value);
    const approved = Number(row.approved_value);
    net += approved;

    const g = guidesById[row.guide_id];
    const rule = g
      ? pickRepasseRule(
          rules,
          { professional_id: g.professional_id, insurance_provider_id: g.insurance_provider_id },
          specialty,
        )
      : null;
    const calc = calculatedFromApproved(rule, approved);

    const { error: insErr } = await ctx.client.from("medical_payout_items").insert({
      payout_id: payoutId,
      production_id: row.id,
      guide_id: row.guide_id,
      approved_value: approved,
      denied_value: Number(row.denied_value),
      calculated_value: calc,
    });
    if (insErr) throw mapPostgresError(insErr);
    sumCalculated += calc;
  }

  sumCalculated = roundMoney(sumCalculated);
  const retention = computeRetentionValue(sumCalculated, rules, payout.professional_id);
  const finalVal = roundMoney(Math.max(0, sumCalculated - retention));

  const { error: upErr } = await ctx.client
    .from("medical_payouts")
    .update({
      gross_value: roundMoney(gross),
      denied_value: roundMoney(denied),
      net_value: roundMoney(net),
      retention_value: retention,
      final_value: finalVal,
      status: "calculated",
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", payoutId)
    .eq("status", "draft");
  if (upErr) throw mapPostgresError(upErr);

  await appendMedicalPayoutAudit(ctx, {
    payout_id: payoutId,
    action: "calculation",
    payload: {
      gross_value: roundMoney(gross),
      denied_value: roundMoney(denied),
      net_value: roundMoney(net),
      retention_value: retention,
      final_value: finalVal,
      items: prows.length,
    },
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "medical_payout",
    entity_id: payoutId,
    event_type: "medical_payout_calculated",
    severity: "info",
    description: `Repasse calculado (${competenceMonth}).`,
    metadata: {
      professional_id: payout.professional_id,
      items: prows.length,
      final_value: finalVal,
    },
  });
}
