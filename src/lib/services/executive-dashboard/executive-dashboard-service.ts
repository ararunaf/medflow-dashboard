/**
 * Agregação leve para dashboard executivo (V1): reutiliza fechamentos,
 * conciliações e bundle operacional de uma competência foco — sem scans analíticos pesados.
 */
import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { listFinancialClosings } from "@/lib/services/financial-closing/financial-closing-service";
import { loadOperationalConsolidationBundle } from "@/lib/services/financial-closing/operational-consolidation-service";
import { listOperationalReconciliations } from "@/lib/services/reconciliation/reconciliation-service";
import { normalizeCompetenceMonth } from "@/lib/services/medical-payout/production-service";
import type { FinancialClosingRow } from "@/lib/services/financial-closing/types";
import type { OperationalReconciliationRow } from "@/lib/services/reconciliation/types";

const EPS = 0.01;
const CLOSING_LIST_LIMIT = 36;
const RECON_LIST_LIMIT = 48;

export type ExecutiveCompetenceRollup = {
  competence_month: string;
  closing: FinancialClosingRow | null;
  reconciliation: OperationalReconciliationRow | null;
};

export type ExecutiveProductionRow = {
  professional_id: string;
  display_name: string;
  guide_count: number;
  total_approved: number;
  payout_final_value: number;
};

export type ExecutiveDashboardKpis = {
  /** Glosa % = denied / billed quando billed > 0 */
  glosa_percent: number | null;
  /** Média em dias (created → updated) para fechamentos locked/finalized */
  mean_closing_days: number | null;
  /** Soma recebido em conciliações finalizadas (amostra listada) */
  total_reconciled_received: number;
  /** Itens de issue não resolvidos + conciliações divergentes */
  open_divergence_signals: number;
  /** Top produção por profissional (foco competência) */
  production_by_professional: ExecutiveProductionRow[];
  /** Repasse líquido consolidado (soma payout_final no bundle) */
  net_payout_total: number;
  /** Fechamentos locked+finalized vs restante */
  closed_closings: number;
  open_closings: number;
};

export type ExecutiveDashboardSnapshot = {
  as_of: string;
  competence_focus: string;
  bundle_present: boolean;
  /** Totais do bundle da competência foco */
  consolidated_billing: number;
  glosas_value: number;
  operational_loss_estimate: number;
  medical_production_approved: number;
  transfers_payouts: number;
  financial_divergence_abs: number;
  kpis: ExecutiveDashboardKpis;
  /** Merge por competência (últimos meses com dado) */
  rollups: ExecutiveCompetenceRollup[];
};

function pickCompetenceFocus(
  requested: string | undefined,
  closings: FinancialClosingRow[],
  recons: OperationalReconciliationRow[],
): string {
  if (requested && /^\d{4}-\d{2}-01$/.test(requested)) {
    return normalizeCompetenceMonth(requested);
  }
  const fromClosing = closings[0]?.competence_month;
  if (fromClosing) return normalizeCompetenceMonth(fromClosing);
  const fromRecon = recons[0]?.competence_month;
  if (fromRecon) return normalizeCompetenceMonth(fromRecon);
  return normalizeCompetenceMonth(new Date().toISOString().slice(0, 10));
}

function mergeRollups(
  closings: FinancialClosingRow[],
  recons: OperationalReconciliationRow[],
): ExecutiveCompetenceRollup[] {
  const map = new Map<string, ExecutiveCompetenceRollup>();
  for (const c of closings) {
    const cm = normalizeCompetenceMonth(c.competence_month);
    const cur = map.get(cm) ?? { competence_month: cm, closing: null, reconciliation: null };
    cur.closing = c;
    map.set(cm, cur);
  }
  for (const r of recons) {
    const cm = normalizeCompetenceMonth(r.competence_month);
    const cur = map.get(cm) ?? { competence_month: cm, closing: null, reconciliation: null };
    cur.reconciliation = r;
    map.set(cm, cur);
  }
  return [...map.values()].sort((a, b) => (a.competence_month < b.competence_month ? 1 : -1));
}

function meanClosingDays(closings: FinancialClosingRow[]): number | null {
  const done = closings.filter((c) => c.status === "locked" || c.status === "finalized");
  if (done.length === 0) return null;
  let sumMs = 0;
  for (const c of done) {
    const a = new Date(c.created_at).getTime();
    const b = new Date(c.updated_at).getTime();
    sumMs += Math.max(0, b - a);
  }
  const avgDays = sumMs / done.length / (86400 * 1000);
  return Math.round(avgDays * 10) / 10;
}

export async function loadExecutiveDashboardSnapshot(
  ctx: ServiceCtx,
  opts: { competence_month?: string } = {},
): Promise<ExecutiveDashboardSnapshot> {
  assertCan(ctx.role, "financial_closing:read");

  const [closings, recons, issuesOpen] = await Promise.all([
    listFinancialClosings(ctx, { limit: CLOSING_LIST_LIMIT }),
    listOperationalReconciliations(ctx, { limit: RECON_LIST_LIMIT }),
    ctx.client
      .from("operational_reconciliation_issues")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("resolved", false),
  ]);

  if (issuesOpen.error) throw mapPostgresError(issuesOpen.error);
  const issueOpenCount = issuesOpen.count ?? 0;

  const competence_focus = pickCompetenceFocus(opts.competence_month, closings, recons);

  let bundle = null as Awaited<ReturnType<typeof loadOperationalConsolidationBundle>> | null;
  try {
    bundle = await loadOperationalConsolidationBundle(ctx, competence_focus);
  } catch {
    bundle = null;
  }

  const closed_closings = closings.filter(
    (c) => c.status === "locked" || c.status === "finalized",
  ).length;
  const open_closings = closings.length - closed_closings;

  const total_reconciled_received = recons
    .filter((r) => r.status === "finalized")
    .reduce((s, r) => s + Number(r.received_value), 0);

  const divergentRecons = recons.filter((r) => r.status === "divergent").length;
  const open_divergence_signals = issueOpenCount + divergentRecons;

  const billed = bundle?.total_billed ?? 0;
  const denied = bundle?.total_denied ?? 0;
  const glosa_percent = billed > EPS ? Math.round((denied / billed) * 1000) / 10 : null;

  const byPro = (bundle?.by_professional ?? [])
    .map((p) => ({
      professional_id: p.professional_id,
      display_name: p.display_name,
      guide_count: p.guide_count,
      total_approved: p.total_approved,
      payout_final_value: p.payout_final_value,
    }))
    .sort((a, b) => b.total_approved - a.total_approved)
    .slice(0, 12);

  const net_payout_total = (bundle?.by_professional ?? []).reduce(
    (s, p) => s + p.payout_final_value,
    0,
  );

  const operational_loss_estimate =
    denied + Math.max(0, Number(bundle?.operational_difference ?? 0));

  return {
    as_of: new Date().toISOString(),
    competence_focus,
    bundle_present: bundle != null,
    consolidated_billing: bundle?.total_billed ?? 0,
    glosas_value: denied,
    operational_loss_estimate,
    medical_production_approved: bundle?.total_approved ?? 0,
    transfers_payouts: bundle?.total_payouts ?? 0,
    financial_divergence_abs: Math.abs(Number(bundle?.operational_difference ?? 0)),
    kpis: {
      glosa_percent,
      mean_closing_days: meanClosingDays(closings),
      total_reconciled_received: Math.round(total_reconciled_received * 100) / 100,
      open_divergence_signals,
      production_by_professional: byPro,
      net_payout_total: Math.round(net_payout_total * 100) / 100,
      closed_closings,
      open_closings,
    },
    rollups: mergeRollups(closings, recons),
  };
}
