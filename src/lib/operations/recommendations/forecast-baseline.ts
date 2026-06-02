/**
 * Baseline de “forecast” operacional: leitura conservadora de sinais já materializados
 * (scores, urgência, tendências curtas) — não é modelo de ML.
 */
import type { NumericTrendPoint } from "@/lib/operations/analytics/trend-adapters";
import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import type { AlertSeverityCounts, OperationalScoringResult } from "@/lib/operations/scoring/types";
import type {
  OperationalForecastBaseline,
  OperationalForecastProjection,
} from "@/lib/operations/recommendations/types";

function trendDelta(points: readonly NumericTrendPoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0]!.value;
  const last = points[points.length - 1]!.value;
  return last - first;
}

export function buildOperationalForecastBaselineLive(input: {
  core: OperationalCommandCenterCore;
  scoring: OperationalScoringResult;
  alertCounts: AlertSeverityCounts;
}): OperationalForecastBaseline {
  const { core, scoring, alertCounts } = input;
  const rationale: string[] = [];
  let projection: OperationalForecastProjection = "stable";

  const { consolidatedRiskScore, healthState, scores } = scoring;
  const urgency = core.coordination.urgency;

  if (
    urgency === "critica" ||
    healthState === "critical" ||
    alertCounts.critical >= 2 ||
    (scores.coverage_risk_score.value >= 62 && core.indicators.coveragePercent < 62)
  ) {
    projection = "critical_projection";
    rationale.push(
      "Urgência de coordenação elevada e/ou risco de cobertura sustentam uma projeção severa na janela viva atual.",
    );
  } else if (
    consolidatedRiskScore >= 56 ||
    urgency === "elevada" ||
    alertCounts.critical >= 1 ||
    scores.coordination_stress_score.value >= 58
  ) {
    projection = "deteriorating";
    rationale.push(
      "Risco sintético e estresse de coordenação indicam trajetória de piora caso pendências permaneçam acumuladas.",
    );
  } else {
    rationale.push(
      "Indicadores instantâneos compatíveis com estabilidade relativa na janela observada (sem projeção agressiva).",
    );
  }

  return {
    computedAt: core.asOf,
    basis: "live_window",
    projection,
    rationale,
  };
}

/**
 * Baseline a partir das mini-séries do analytics (últimos dias) + scoring do período.
 */
export function buildOperationalForecastBaselineFromPeriodTrends(input: {
  asOf: string;
  miniCoverage: readonly NumericTrendPoint[];
  miniPressure: readonly NumericTrendPoint[];
  scoring: OperationalScoringResult;
}): OperationalForecastBaseline {
  const { asOf, miniCoverage, miniPressure, scoring } = input;
  const covDelta = trendDelta(miniCoverage);
  const presDelta = trendDelta(miniPressure);
  const lastCov = miniCoverage.length > 0 ? miniCoverage[miniCoverage.length - 1]!.value : null;

  const rationale: string[] = [];
  let projection: OperationalForecastProjection = "stable";

  if (lastCov != null && lastCov < 62 && covDelta != null && covDelta < -1.2) {
    projection = "critical_projection";
    rationale.push(
      `Cobertura recente em torno de ${Math.round(lastCov)}% com inclinação negativa na mini-janela (${covDelta.toFixed(1)} pts).`,
    );
  } else if (scoring.healthState === "critical" || scoring.consolidatedRiskScore >= 68) {
    projection = "critical_projection";
    rationale.push("Scoring consolidado do período primário encontra-se em zona crítica.");
  } else if (
    (covDelta != null && covDelta < -0.6) ||
    (presDelta != null && presDelta > 2.5) ||
    scoring.consolidatedRiskScore >= 54
  ) {
    projection = "deteriorating";
    rationale.push(
      "Tendências curtas de cobertura/pressão e o risco consolidado sugerem deterioração se o ritmo se mantiver.",
    );
  } else {
    rationale.push(
      "Séries curtas do período não evidenciam colapso imediato; manter monitoramento dos KPIs de cobertura e pressão.",
    );
  }

  return {
    computedAt: asOf,
    basis: "period_trends",
    projection,
    rationale,
  };
}
