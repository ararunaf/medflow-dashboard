import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { listMedicalProductionForCompetence } from "@/lib/services/medical-payout/production-service";
import { appendReconciliationAudit } from "./reconciliation-audit-service";
import { getOperationalReconciliationById } from "./reconciliation-service";
import type {
  OperationalReconciliationIssueSeverity,
  OperationalReconciliationIssueType,
} from "./types";

const MONEY_EPS = 0.01;

async function ensureOpenIssue(
  ctx: ServiceCtx,
  input: {
    reconciliationId: string;
    issueType: OperationalReconciliationIssueType;
    description: string;
    severity: OperationalReconciliationIssueSeverity;
  },
): Promise<boolean> {
  const { data: existing, error: e0 } = await ctx.client
    .from("operational_reconciliation_issues")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", input.reconciliationId)
    .eq("issue_type", input.issueType)
    .eq("resolved", false)
    .maybeSingle();
  if (e0) throw mapPostgresError(e0);
  if (existing?.id) return false;

  const { error } = await ctx.client.from("operational_reconciliation_issues").insert({
    tenant_id: ctx.tenantId,
    reconciliation_id: input.reconciliationId,
    issue_type: input.issueType,
    description: input.description,
    severity: input.severity,
    resolved: false,
  });
  if (error) throw mapPostgresError(error);
  return true;
}

export async function runDivergenceDetectionAfterMatch(
  ctx: ServiceCtx,
  reconciliationId: string,
): Promise<void> {
  assertCan(ctx.role, "financial_closing:write");
  const rec = await getOperationalReconciliationById(ctx, reconciliationId);

  const { data: items, error: iErr } = await ctx.client
    .from("operational_reconciliation_items")
    .select("expected_value, received_value, difference_value, status, reference_type")
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", reconciliationId);
  if (iErr) throw mapPostgresError(iErr);
  const list = items ?? [];

  const sumExpected = list.reduce((a, r) => a + Number(r.expected_value), 0);
  const sumReceived = list.reduce((a, r) => a + Number(r.received_value), 0);
  const diff = Math.round((sumReceived - sumExpected) * 100) / 100;

  let created = false;
  if (Math.abs(diff) >= MONEY_EPS) {
    const inserted = await ensureOpenIssue(ctx, {
      reconciliationId,
      issueType: "financial_difference",
      description: `Diferença financeira líquida: esperado ${sumExpected.toFixed(2)} vs recebido ${sumReceived.toFixed(2)} (Δ ${diff.toFixed(2)}).`,
      severity: "warning",
    });
    created ||= inserted;
  }

  const production = await listMedicalProductionForCompetence(ctx, rec.competence_month);
  const deniedSum = production.reduce((a, p) => a + Number(p.denied_value), 0);
  if (deniedSum >= MONEY_EPS) {
    const inserted = await ensureOpenIssue(ctx, {
      reconciliationId,
      issueType: "glosa_not_reflected",
      description: `Produção com valor negado acumulado (${deniedSum.toFixed(2)}). Conferir glosas TISS e retornos.`,
      severity: "info",
    });
    created ||= inserted;
  }

  if (rec.financial_closing_id) {
    const { data: closing, error: cErr } = await ctx.client
      .from("financial_closings")
      .select("total_approved")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", rec.financial_closing_id)
      .maybeSingle();
    if (!cErr && closing) {
      const approvedProd = production.reduce((a, p) => a + Number(p.approved_value), 0);
      const gap = Math.abs(Number(closing.total_approved) - approvedProd);
      if (gap >= MONEY_EPS) {
        const inserted = await ensureOpenIssue(ctx, {
          reconciliationId,
          issueType: "closing_divergent",
          description: `Fechamento operacional (total aprovado ${Number(closing.total_approved).toFixed(2)}) diverge da produção médica consolidada (${approvedProd.toFixed(2)}).`,
          severity: "critical",
        });
        created ||= inserted;
      }
    }
  }

  const { data: payouts, error: pErr } = await ctx.client
    .from("medical_payouts")
    .select("id, professional_id, final_value, competence_month")
    .eq("tenant_id", ctx.tenantId)
    .eq("competence_month", rec.competence_month);
  if (!pErr && payouts?.length) {
    const byProf = new Map<string, number>();
    for (const pr of production) {
      const k = pr.professional_id;
      byProf.set(k, (byProf.get(k) ?? 0) + Number(pr.approved_value));
    }
    for (const po of payouts) {
      const prod = byProf.get(po.professional_id) ?? 0;
      const fin = Number(po.final_value);
      if (Math.abs(prod - fin) >= MONEY_EPS) {
        const inserted = await ensureOpenIssue(ctx, {
          reconciliationId,
          issueType: "payout_inconsistent",
          description: `Repasse ${po.id.slice(0, 8)}… inconsistente com produção aprovada do profissional (produção ${prod.toFixed(2)} vs repasse ${fin.toFixed(2)}).`,
          severity: "warning",
        });
        created ||= inserted;
        break;
      }
    }
  }

  for (const it of list) {
    if (it.reference_type !== "medical_payout") continue;
    const ev = Number(it.expected_value);
    const rv = Number(it.received_value);
    if (ev >= MONEY_EPS && rv > 0 && rv < ev - MONEY_EPS) {
      const inserted = await ensureOpenIssue(ctx, {
        reconciliationId,
        issueType: "partial_receipt",
        description: "Recebimento parcial detectado em linha de repasse (recebido < esperado).",
        severity: "warning",
      });
      created ||= inserted;
      break;
    }
  }

  const pendingBlocking = list.some(
    (it) => it.status === "pending" && Number(it.expected_value) >= MONEY_EPS,
  );
  if (pendingBlocking) {
    const inserted = await ensureOpenIssue(ctx, {
      reconciliationId,
      issueType: "operational_pending",
      description: "Existem linhas pendentes de conferência (esperado sem recebimento alinhado).",
      severity: "info",
    });
    created ||= inserted;
  }

  if (created) {
    await appendReconciliationAudit(ctx, {
      reconciliationId,
      action: "divergence_detected",
      payload: { source: "post_match_scan" },
    });
    await recordOperationalEventSafe(ctx, {
      entity_type: "operational_reconciliation",
      entity_id: reconciliationId,
      event_type: "operational_reconciliation_divergence_detected",
      severity: "warning",
      description: `Divergências operacionais detectadas · ${rec.competence_month}`,
      metadata: { reconciliation_id: reconciliationId },
    });
  }
}
