/**
 * Notificações operacionais derivadas (sem fila push): digest para UI executiva.
 */
import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { listFinancialClosings } from "@/lib/services/financial-closing/financial-closing-service";
import { listOperationalReconciliations } from "@/lib/services/reconciliation/reconciliation-service";

const EPS = 0.01;

export type OperationalNotificationSeverity = "info" | "warning" | "critical";

export type OperationalNotificationItem = {
  id: string;
  severity: OperationalNotificationSeverity;
  title: string;
  body: string;
  /** Rota interna sugerida */
  href: string;
  kind:
    | "glosas_pending"
    | "competence_not_reconciled"
    | "payout_awaiting_approval"
    | "closing_divergent"
    | "operational_inconsistency";
};

export type OperationalNotificationDigest = {
  as_of: string;
  items: OperationalNotificationItem[];
};

export async function loadOperationalNotificationDigest(
  ctx: ServiceCtx,
): Promise<OperationalNotificationDigest> {
  assertCan(ctx.role, "financial_closing:read");

  const [closings, recons, issuesOpen, payoutPending] = await Promise.all([
    listFinancialClosings(ctx, { limit: 48 }),
    listOperationalReconciliations(ctx, { limit: 48 }),
    ctx.client
      .from("operational_reconciliation_issues")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("resolved", false),
    ctx.client
      .from("medical_payouts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .in("status", ["calculated", "reviewed"]),
  ]);

  if (issuesOpen.error) throw mapPostgresError(issuesOpen.error);
  if (payoutPending.error) throw mapPostgresError(payoutPending.error);

  const items: OperationalNotificationItem[] = [];
  const issueCount = issuesOpen.count ?? 0;
  if (issueCount > 0) {
    items.push({
      id: "issues-open",
      severity: issueCount > 5 ? "critical" : "warning",
      title: "Inconsistências em conciliação",
      body: `${issueCount} apontamento(ns) de divergência ainda não resolvido(s).`,
      href: "/financeiro/conciliacao-operacional",
      kind: "operational_inconsistency",
    });
  }

  const payoutN = payoutPending.count ?? 0;
  if (payoutN > 0) {
    items.push({
      id: "payout-pending",
      severity: "warning",
      title: "Repasse aguardando aprovação",
      body: `${payoutN} repasse(s) em calculado/revisado — aprovar ou ajustar antes do fechamento.`,
      href: "/tiss",
      kind: "payout_awaiting_approval",
    });
  }

  for (const r of recons) {
    if (r.status === "draft" || r.status === "processing") {
      items.push({
        id: `recon-open-${r.id}`,
        severity: "info",
        title: "Competência em conciliação",
        body: `Conciliação ${r.competence_month.slice(0, 7)} ainda em ${r.status}.`,
        href: "/financeiro/conciliacao-operacional",
        kind: "competence_not_reconciled",
      });
      break;
    }
  }

  for (const c of closings) {
    if (Math.abs(Number(c.operational_difference)) > EPS && c.status !== "finalized") {
      items.push({
        id: `closing-div-${c.id}`,
        severity: "warning",
        title: "Fechamento com divergência operacional",
        body: `Competência ${c.competence_month.slice(0, 7)} — diferença R$ ${Number(c.operational_difference).toFixed(2)}.`,
        href: "/financeiro/fechamento-operacional",
        kind: "closing_divergent",
      });
      break;
    }
  }

  const divergent = recons.filter((r) => r.status === "divergent");
  if (divergent.length > 0) {
    items.push({
      id: "recon-divergent",
      severity: "critical",
      title: "Conciliação divergente",
      body: `${divergent.length} conciliação(ões) marcada(s) como divergente — revisar itens e issues.`,
      href: "/financeiro/conciliacao-operacional",
      kind: "operational_inconsistency",
    });
  }

  const highDenied = closings.find(
    (c) => c.total_billed > EPS && c.total_denied / c.total_billed > 0.08,
  );
  if (highDenied) {
    items.push({
      id: `glosa-high-${highDenied.id}`,
      severity: "warning",
      title: "Glosas elevadas na competência",
      body: `${highDenied.competence_month.slice(0, 7)} — glosa acima de 8% do faturado.`,
      href: "/financeiro/fechamento-operacional",
      kind: "glosas_pending",
    });
  }

  items.sort((a, b) => {
    const rank = (s: OperationalNotificationSeverity) =>
      s === "critical" ? 0 : s === "warning" ? 1 : 2;
    return rank(a.severity) - rank(b.severity);
  });

  return { as_of: new Date().toISOString(), items: items.slice(0, 12) };
}
