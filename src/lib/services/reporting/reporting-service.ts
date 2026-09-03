/**
 * Relatórios operacionais V1: payloads estruturados para exportação / impressão
 * (sem motor de template pesado).
 */
import type { ExecutiveDashboardSnapshot } from "@/lib/services/executive-dashboard/executive-dashboard-service";
import type { OperationalNotificationDigest } from "@/lib/services/operational-notifications/operational-notification-service";
import type { WorkGroupProductionRow } from "./work-group-report-service";

export type ReportTableSection = {
  title: string;
  columns: string[];
  rows: Record<string, string | number>[];
};

export type OperationalReportPayload = {
  report: "operacional";
  generated_at: string;
  sections: ReportTableSection[];
};

export type FinancialReportPayload = {
  report: "financeiro";
  generated_at: string;
  sections: ReportTableSection[];
};

function money(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function buildOperationalReport(
  snap: ExecutiveDashboardSnapshot,
  notif?: OperationalNotificationDigest | null,
): OperationalReportPayload {
  const sections: ReportTableSection[] = [
    {
      title: "Resumo executivo",
      columns: ["Indicador", "Valor"],
      rows: [
        { Indicador: "Competência foco", Valor: snap.competence_focus },
        { Indicador: "Faturamento consolidado", Valor: money(snap.consolidated_billing) },
        { Indicador: "Produção aprovada", Valor: money(snap.medical_production_approved) },
        { Indicador: "Glosas (valor)", Valor: money(snap.glosas_value) },
        { Indicador: "Repasses", Valor: money(snap.transfers_payouts) },
        { Indicador: "Divergência operacional |Δ|", Valor: money(snap.financial_divergence_abs) },
      ],
    },
    {
      title: "KPIs",
      columns: ["KPI", "Valor"],
      rows: [
        {
          KPI: "% glosa",
          Valor: snap.kpis.glosa_percent != null ? `${snap.kpis.glosa_percent}%` : "—",
        },
        { KPI: "Tempo médio fechamento (dias)", Valor: snap.kpis.mean_closing_days ?? "—" },
        { KPI: "Total conciliado (recebido)", Valor: money(snap.kpis.total_reconciled_received) },
        { KPI: "Sinais de divergência abertos", Valor: snap.kpis.open_divergence_signals },
        { KPI: "Repasse líquido (profissionais)", Valor: money(snap.kpis.net_payout_total) },
        {
          KPI: "Fechamentos fechados vs abertos",
          Valor: `${snap.kpis.closed_closings} / ${snap.kpis.open_closings}`,
        },
      ],
    },
  ];

  if (notif?.items.length) {
    sections.push({
      title: "Alertas operacionais",
      columns: ["Severidade", "Título", "Detalhe"],
      rows: notif.items.map((i) => ({
        Severidade: i.severity,
        Título: i.title,
        Detalhe: i.body,
      })),
    });
  }

  return { report: "operacional", generated_at: snap.as_of, sections };
}

export function buildFinancialReport(snap: ExecutiveDashboardSnapshot): FinancialReportPayload {
  return {
    report: "financeiro",
    generated_at: snap.as_of,
    sections: [
      {
        title: "Consolidado por competência (cadastro)",
        columns: [
          "Competência",
          "Fechamento",
          "Conciliação",
          "Faturado",
          "Glosa",
          "Repasse",
          "Δ op.",
        ],
        rows: snap.rollups.slice(0, 24).map((r) => ({
          Competência: r.competence_month,
          Fechamento: r.closing?.status ?? "—",
          Conciliação: r.reconciliation?.status ?? "—",
          Faturado: r.closing != null ? money(Number(r.closing.total_billed)) : "—",
          Glosa: r.closing != null ? money(Number(r.closing.total_denied)) : "—",
          Repasse: r.closing != null ? money(Number(r.closing.total_payouts)) : "—",
          "Δ op.": r.closing != null ? money(Number(r.closing.operational_difference)) : "—",
        })),
      },
    ],
  };
}

export function buildGlosasReport(snap: ExecutiveDashboardSnapshot): OperationalReportPayload {
  return {
    report: "operacional",
    generated_at: snap.as_of,
    sections: [
      {
        title: "Glosas por competência (totais de fechamento)",
        columns: ["Competência", "Faturado", "Glosa", "% glosa"],
        rows: snap.rollups
          .filter((r) => r.closing)
          .map((r) => {
            const c = r.closing!;
            const pct =
              c.total_billed > 0.01
                ? Math.round((c.total_denied / c.total_billed) * 1000) / 10
                : null;
            return {
              Competência: r.competence_month,
              Faturado: money(Number(c.total_billed)),
              Glosa: money(Number(c.total_denied)),
              "% glosa": pct != null ? `${pct}%` : "—",
            };
          }),
      },
    ],
  };
}

export function buildProductionReport(snap: ExecutiveDashboardSnapshot): OperationalReportPayload {
  return {
    report: "operacional",
    generated_at: snap.as_of,
    sections: [
      {
        title: `Produção por profissional — ${snap.competence_focus}`,
        columns: ["Profissional", "Guias", "Aprovado", "Repasse líquido"],
        rows: snap.kpis.production_by_professional.map((p) => ({
          Profissional: p.display_name,
          Guias: p.guide_count,
          Aprovado: money(p.total_approved),
          "Repasse líquido": money(p.payout_final_value),
        })),
      },
    ],
  };
}

export function buildWorkGroupProductionReport(
  rows: readonly WorkGroupProductionRow[],
  competenceMonth: string,
  generatedAt: string,
): OperationalReportPayload {
  return {
    report: "operacional",
    generated_at: generatedAt,
    sections: [
      {
        title: `Produção por grupo de trabalho — ${competenceMonth}`,
        columns: ["Grupo de trabalho", "Profissionais", "Guias", "Aprovado", "Repasse líquido"],
        rows: rows.map((r) => ({
          "Grupo de trabalho": r.workGroupName,
          Profissionais: r.professionalCount,
          Guias: r.guideCount,
          Aprovado: money(r.totalApproved),
          "Repasse líquido": money(r.payoutFinalValue),
        })),
      },
    ],
  };
}

export function buildPayoutsReport(snap: ExecutiveDashboardSnapshot): OperationalReportPayload {
  return {
    report: "operacional",
    generated_at: snap.as_of,
    sections: [
      {
        title: "Repasses consolidados (competência foco)",
        columns: ["Indicador", "Valor"],
        rows: [
          { Indicador: "Total repasses (bundle)", Valor: money(snap.transfers_payouts) },
          { Indicador: "Repasse líquido profissionais", Valor: money(snap.kpis.net_payout_total) },
        ],
      },
      {
        title: "Detalhe por profissional",
        columns: ["Profissional", "Repasse líquido"],
        rows: snap.kpis.production_by_professional.map((p) => ({
          Profissional: p.display_name,
          "Repasse líquido": money(p.payout_final_value),
        })),
      },
    ],
  };
}

export function buildDivergencesReport(snap: ExecutiveDashboardSnapshot): OperationalReportPayload {
  return {
    report: "operacional",
    generated_at: snap.as_of,
    sections: [
      {
        title: "Divergências financeiras (fechamento)",
        columns: ["Competência", "Status", "Δ operacional"],
        rows: snap.rollups
          .filter((r) => r.closing && Math.abs(Number(r.closing.operational_difference)) > 0.01)
          .map((r) => ({
            Competência: r.competence_month,
            Status: r.closing!.status,
            "Δ operacional": money(Number(r.closing!.operational_difference)),
          })),
      },
      {
        title: "Conciliações divergentes ou em aberto",
        columns: ["Competência", "Status", "Diferença"],
        rows: snap.rollups
          .filter((r) => r.reconciliation && r.reconciliation.status !== "finalized")
          .map((r) => ({
            Competência: r.competence_month,
            Status: r.reconciliation!.status,
            Diferença: money(Number(r.reconciliation!.difference_value)),
          })),
      },
    ],
  };
}
