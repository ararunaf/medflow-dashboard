/**
 * Scoring a partir do payload de analytics (sem importar o serviço de snapshot — evita ciclo).
 */
import type { KpiValueMap } from "@/lib/operations/analytics/kpi-aggregators";
import type { NumericTrendPoint } from "@/lib/operations/analytics/trend-adapters";
import { evaluateConsolidatedOperationalState } from "@/lib/operations/scoring/operational-state-evaluator";
import {
  computeScoresFromAnalyticsContext,
  type AnalyticsScoringKpiContext,
} from "@/lib/operations/scoring/score-calculators";
import type { OperationalScoringResult } from "@/lib/operations/scoring/types";

export type AnalyticsScoringPayload = {
  asOf: string;
  primary: { dayKeys: readonly string[] };
  kpis: {
    primary: KpiValueMap;
    deltaPct: Partial<Record<keyof KpiValueMap, number | null>>;
  };
  trends: {
    miniCoverage: readonly NumericTrendPoint[];
    miniPressure: readonly NumericTrendPoint[];
  };
};

function toContext(payload: AnalyticsScoringPayload): AnalyticsScoringKpiContext {
  return {
    kpis: payload.kpis.primary,
    coverageDeltaPct: payload.kpis.deltaPct.avg_coverage_pct ?? null,
    recentCoveragePoints: payload.trends.miniCoverage,
    recentPressurePoints: payload.trends.miniPressure,
    periodDays: payload.primary.dayKeys.length,
  };
}

function buildHighlightsAnalytics(
  scores: OperationalScoringResult["scores"],
  consolidatedRiskScore: number,
): { highlights: string[]; riskNotes: string[] } {
  const highlights: string[] = [];
  const riskNotes: string[] = [
    `Risco sintético ${consolidatedRiskScore.toFixed(1)}/100 (base: KPIs históricos agregados).`,
  ];

  if (scores.coverage_risk_score.value >= 58) {
    highlights.push("Cobertura histórica ou buracos frequentes elevando risco.");
  } else if (scores.coverage_risk_score.value >= 40) {
    highlights.push("Cobertura em zona de atenção — monitore furos e confirmações.");
  }

  if (scores.coordination_stress_score.value >= 58) {
    highlights.push("Fila de coordenação (pressão, pendências ou swaps) acima do confortável.");
  }

  if (scores.workforce_stability_score.value < 48) {
    highlights.push("Sinais de fragilidade na força de trabalho (confirmações / disponibilidade).");
  }

  if (highlights.length === 0) {
    highlights.push("Sinais operacionais dentro de faixas típicas para o período analisado.");
  }

  return { highlights, riskNotes };
}

export function buildOperationalScoringForAnalyticsPayload(
  payload: AnalyticsScoringPayload,
): OperationalScoringResult {
  const ctx = toContext(payload);
  const { scores, consolidatedRiskScore, operationalHealthScore } =
    computeScoresFromAnalyticsContext(ctx);

  const healthState = evaluateConsolidatedOperationalState({
    consolidatedRiskScore,
    operationalHealthScore,
    alertCounts: null,
  });

  const { highlights, riskNotes } = buildHighlightsAnalytics(scores, consolidatedRiskScore);

  return {
    basis: "period_analytics",
    computedAt: payload.asOf,
    scores,
    consolidatedRiskScore,
    operationalHealthScore,
    healthState,
    highlights,
    riskNotes,
  };
}
