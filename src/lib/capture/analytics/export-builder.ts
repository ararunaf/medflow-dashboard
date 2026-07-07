/**
 * Exportação analítica — seções para PDF, Excel e CSV.
 * MEDICFLOW-ANALYTICS-01
 */
import type { ReportTableSection } from "@/lib/services/reporting/reporting-service";
import type { AnalyticsSnapshot } from "./types";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

function money(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function durationMs(ms: number): string {
  if (ms <= 0) return "—";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function buildAnalyticsExportSections(snapshot: AnalyticsSnapshot): ReportTableSection[] {
  const { executive: ex, quality: q, operators, trends } = snapshot;

  return [
    {
      title: "Resumo Executivo",
      columns: ["Indicador", "Valor"],
      rows: [
        { Indicador: "Guias processadas", Valor: String(ex.totalGuidesProcessed) },
        { Indicador: "Aprovadas", Valor: String(ex.guidesApproved) },
        { Indicador: "Reprovadas", Valor: String(ex.guidesRejected) },
        { Indicador: "Em revisão", Valor: String(ex.guidesInReview) },
        { Indicador: "Críticas", Valor: String(ex.guidesCritical) },
        { Indicador: "Impacto financeiro em risco", Valor: money(ex.financialRiskImpact) },
        {
          Indicador: "Economia potencial (correções)",
          Valor: money(ex.potentialSavingsFromCorrections),
        },
      ],
    },
    {
      title: "Guias por Operadora",
      columns: ["Operadora", "Quantidade"],
      rows: ex.guidesByOperator.map((r) => ({
        Operadora: r.label,
        Quantidade: String(r.count),
      })),
    },
    {
      title: "Guias por Tipo",
      columns: ["Tipo", "Quantidade"],
      rows: ex.guidesByType.map((r) => ({
        Tipo: r.label,
        Quantidade: String(r.count),
      })),
    },
    {
      title: "Distribuição de Risco",
      columns: ["Nível", "Quantidade"],
      rows: ex.riskDistribution.map((r) => ({
        Nível: r.level,
        Quantidade: String(r.count),
      })),
    },
    {
      title: "Indicadores de Qualidade",
      columns: ["Indicador", "Valor"],
      rows: [
        { Indicador: "Taxa de aceitação", Valor: pct(q.suggestionAcceptanceRate) },
        { Indicador: "Taxa de edição", Valor: pct(q.editRate) },
        { Indicador: "Taxa de rejeição", Valor: pct(q.rejectionRate) },
        { Indicador: "Precisão OCR (média)", Valor: pct(q.ocrAccuracyAvg) },
        { Indicador: "Precisão Parser (média)", Valor: pct(q.parserAccuracyAvg) },
        { Indicador: "Tempo médio de revisão", Valor: durationMs(q.avgReviewTimeMs) },
        { Indicador: "Tempo médio até aprovação", Valor: durationMs(q.avgApprovalTimeMs) },
      ],
    },
    {
      title: "Top Regras (Glosas)",
      columns: ["Regra", "Ocorrências"],
      rows: q.topGlosaRules.map((r) => ({
        Regra: r.ruleId,
        Ocorrências: String(r.count),
      })),
    },
    {
      title: "Top Campos Corrigidos",
      columns: ["Campo", "Ocorrências"],
      rows: q.topCorrectedFields.map((r) => ({
        Campo: r.field,
        Ocorrências: String(r.count),
      })),
    },
    {
      title: "Comparativo por Operadora",
      columns: [
        "Rank",
        "Operadora",
        "Guias",
        "Valor",
        "Risco médio",
        "Tempo médio",
      ],
      rows: operators.map((o) => ({
        Rank: String(o.operationalRank),
        Operadora: o.operator,
        Guias: String(o.guideCount),
        Valor: money(o.financialValue),
        "Risco médio": o.avgRiskScore != null ? String(o.avgRiskScore) : "—",
        "Tempo médio": durationMs(o.avgProcessingTimeMs),
      })),
    },
    {
      title: "Tendências — Volume (28d)",
      columns: ["Dia", "Guias"],
      rows: trends.volume.map((p) => ({ Dia: p.dayKey, Guias: String(p.value) })),
    },
    {
      title: "Tendências — Produtividade (28d)",
      columns: ["Dia", "Aprovações"],
      rows: trends.productivity.map((p) => ({
        Dia: p.dayKey,
        Aprovações: String(p.value),
      })),
    },
  ];
}

export function buildAnalyticsSummaryCsvRows(
  snapshot: AnalyticsSnapshot,
): Array<Record<string, string | number>> {
  const ex = snapshot.executive;
  return [
    {
      metric: "total_guides",
      value: ex.totalGuidesProcessed,
      generated_at: snapshot.asOf,
    },
    {
      metric: "guides_approved",
      value: ex.guidesApproved,
      generated_at: snapshot.asOf,
    },
    {
      metric: "guides_rejected",
      value: ex.guidesRejected,
      generated_at: snapshot.asOf,
    },
    {
      metric: "financial_risk",
      value: ex.financialRiskImpact,
      generated_at: snapshot.asOf,
    },
    {
      metric: "potential_savings",
      value: ex.potentialSavingsFromCorrections,
      generated_at: snapshot.asOf,
    },
  ];
}
