/**
 * Calculadores puros de scores a partir de KPIs agregados ou indicadores da janela viva.
 */
import type { KpiValueMap } from "@/lib/operations/analytics/kpi-aggregators";
import { operationalPressureNumeric } from "@/lib/operations/metrics/status-helpers";
import { clamp, invertUnit, linearUnit, unitToScore } from "@/lib/operations/scoring/normalization";
import {
  CONSOLIDATED_RISK_WEIGHTS,
  OPERATIONAL_HEALTH_WEIGHTS,
  OPERATIONAL_SCORE_LABELS,
} from "@/lib/operations/scoring/scoring-registry";
import type { OperationalScoreId, OperationalScoreSnapshot } from "@/lib/operations/scoring/types";
import { weightedAverage } from "@/lib/operations/scoring/weighting";

export type AnalyticsScoringKpiContext = {
  kpis: KpiValueMap;
  /** Delta % do período vs anterior para cobertura (negativo = piora). */
  coverageDeltaPct: number | null;
  /** Últimos pontos de cobertura diária (0–100) — usa inclinação simples. */
  recentCoveragePoints: readonly { value: number }[];
  /** Últimos pontos de pressão — inclinação simples. */
  recentPressurePoints: readonly { value: number }[];
  periodDays: number;
};

function slope01(points: readonly { value: number }[]): number {
  if (points.length < 2) return 0;
  const a = points[0]!.value;
  const b = points[points.length - 1]!.value;
  const span = Math.max(1, points.length - 1);
  const delta = (b - a) / span;
  // Normaliza inclinação típica (~5 pts/dia) → unidade
  return clamp(delta / 5, -1, 1);
}

function scoreSnapshots(
  coverageRisk: number,
  coordinationStress: number,
  workforceStability: number,
): Record<OperationalScoreId, OperationalScoreSnapshot> {
  const coverageHealth = 100 - clamp(coverageRisk, 0, 100);
  const coordinationHealth = 100 - clamp(coordinationStress, 0, 100);
  const operationalHealth = weightedAverage([
    { value: coverageHealth, weight: OPERATIONAL_HEALTH_WEIGHTS.coverageHealth },
    { value: coordinationHealth, weight: OPERATIONAL_HEALTH_WEIGHTS.coordinationHealth },
    { value: workforceStability, weight: OPERATIONAL_HEALTH_WEIGHTS.workforceStability },
  ]);

  return {
    operational_health_score: {
      id: "operational_health_score",
      value: Math.round(clamp(operationalHealth, 0, 100) * 10) / 10,
      interpretation: "higher_is_better",
      label: OPERATIONAL_SCORE_LABELS.operational_health_score,
    },
    coverage_risk_score: {
      id: "coverage_risk_score",
      value: Math.round(clamp(coverageRisk, 0, 100) * 10) / 10,
      interpretation: "higher_is_worse",
      label: OPERATIONAL_SCORE_LABELS.coverage_risk_score,
    },
    coordination_stress_score: {
      id: "coordination_stress_score",
      value: Math.round(clamp(coordinationStress, 0, 100) * 10) / 10,
      interpretation: "higher_is_worse",
      label: OPERATIONAL_SCORE_LABELS.coordination_stress_score,
    },
    workforce_stability_score: {
      id: "workforce_stability_score",
      value: Math.round(clamp(workforceStability, 0, 100) * 10) / 10,
      interpretation: "higher_is_better",
      label: OPERATIONAL_SCORE_LABELS.workforce_stability_score,
    },
  };
}

/** Scores a partir do mapa de KPIs históricos (janela primária do analytics). */
export function computeScoresFromAnalyticsContext(ctx: AnalyticsScoringKpiContext): {
  scores: Record<OperationalScoreId, OperationalScoreSnapshot>;
  consolidatedRiskScore: number;
  operationalHealthScore: number;
} {
  const k = ctx.kpis;
  const days = Math.max(1, ctx.periodDays);

  const coveragePct = k.avg_coverage_pct ?? 72;
  const gapU = linearUnit(100 - coveragePct, 0, 100);
  const noCov = k.avg_shifts_without_coverage_per_day ?? 0;
  const conflicts = k.avg_conflict_shifts_per_day ?? 0;

  const trendCoverage = slope01(ctx.recentCoveragePoints);
  const trendWorsenU = trendCoverage < 0 ? linearUnit(-trendCoverage, 0, 1) : 0;
  const deltaWorsenU =
    ctx.coverageDeltaPct != null && ctx.coverageDeltaPct < 0
      ? linearUnit(-ctx.coverageDeltaPct, 0, 35)
      : 0;

  const coverageRiskU = clamp(
    gapU * 0.5 +
      linearUnit(noCov, 0, 8) * 0.22 +
      linearUnit(conflicts, 0, 6) * 0.14 +
      trendWorsenU * 0.08 +
      deltaWorsenU * 0.06,
    0,
    1,
  );
  const coverageRisk = unitToScore(coverageRiskU);

  const pressure = k.avg_pressure_score ?? 0;
  const pending = k.pending_assignments_now ?? 0;
  const swaps = k.swaps_requested ?? 0;
  const swapsPerDay = swaps / days;
  const confLatH = k.avg_confirmation_latency_hours;

  const latU = confLatH == null || !Number.isFinite(confLatH) ? 0.35 : linearUnit(confLatH, 0, 48);
  const trendPressure = slope01(ctx.recentPressurePoints);
  const pressureRiseU = trendPressure > 0 ? linearUnit(trendPressure, 0, 1) : 0;

  const coordinationStressU = clamp(
    linearUnit(pressure, 5, 55) * 0.36 +
      linearUnit(pending, 0, 45) * 0.26 +
      linearUnit(swapsPerDay, 0, 10) * 0.2 +
      latU * 0.14 +
      pressureRiseU * 0.04,
    0,
    1,
  );
  const coordinationStress = unitToScore(coordinationStressU);

  const confRate = k.avg_confirmation_rate_pct ?? 70;
  const avail = k.avg_availability_windows;
  const assigns = k.assignments_created ?? 0;
  const swapRatio = assigns > 0 ? swaps / assigns : swaps / (days * 2);

  const workforceStabilityU = clamp(
    linearUnit(confRate, 52, 100) * 0.4 +
      (avail == null || !Number.isFinite(avail) ? 0.55 : linearUnit(avail, 0, 20)) * 0.28 +
      invertUnit(linearUnit(conflicts, 0, 5)) * 0.18 +
      invertUnit(linearUnit(swapRatio, 0, 1.5)) * 0.14,
    0,
    1,
  );
  const workforceStability = unitToScore(workforceStabilityU);

  const scores = scoreSnapshots(coverageRisk, coordinationStress, workforceStability);
  const consolidatedRiskScore =
    scores.coverage_risk_score.value * CONSOLIDATED_RISK_WEIGHTS.coverageRisk +
    scores.coordination_stress_score.value * CONSOLIDATED_RISK_WEIGHTS.coordinationStress +
    (100 - scores.workforce_stability_score.value) * CONSOLIDATED_RISK_WEIGHTS.workforceFragility;

  return {
    scores,
    consolidatedRiskScore: Math.round(clamp(consolidatedRiskScore, 0, 100) * 10) / 10,
    operationalHealthScore: scores.operational_health_score.value,
  };
}

export type CommandCenterScoringMetrics = {
  coveragePercent: number;
  shiftsWithoutAssignment: number;
  pendingAssignments: number;
  swapsAwaitingApproval: number;
  operationalConflicts: number;
  openShifts: number;
  confirmationRatePercent: number;
  unavailableProfessionals: number;
  totalProfessionals: number;
  unconfirmedStartingWithin24h: number;
  overdueOpenShifts: number;
};

/** Scores instantâneos na janela viva do command center (sem séries históricas). */
export function computeScoresFromCommandCenterMetrics(m: CommandCenterScoringMetrics): {
  scores: Record<OperationalScoreId, OperationalScoreSnapshot>;
  consolidatedRiskScore: number;
  operationalHealthScore: number;
} {
  const gap = clamp(100 - m.coveragePercent, 0, 100);
  const coverageRiskU = clamp(
    linearUnit(gap, 0, 100) * 0.52 +
      linearUnit(m.shiftsWithoutAssignment, 0, 14) * 0.26 +
      linearUnit(m.operationalConflicts, 0, 8) * 0.22,
    0,
    1,
  );
  const coverageRisk = unitToScore(coverageRiskU);

  const numericPressure = operationalPressureNumeric({
    openShifts: m.openShifts,
    pendingSwaps: m.swapsAwaitingApproval,
    pendingAssignments: m.pendingAssignments,
    coverageGapPercent: gap,
    conflicts: m.operationalConflicts,
  });

  const coordinationStressU = clamp(
    linearUnit(numericPressure, 10, 70) * 0.38 +
      linearUnit(m.pendingAssignments, 0, 35) * 0.24 +
      linearUnit(m.swapsAwaitingApproval, 0, 20) * 0.2 +
      linearUnit(m.unconfirmedStartingWithin24h, 0, 8) * 0.18,
    0,
    1,
  );
  const coordinationStress = unitToScore(coordinationStressU);

  const availRatio =
    m.totalProfessionals <= 0
      ? 0.5
      : clamp((m.totalProfessionals - m.unavailableProfessionals) / m.totalProfessionals, 0, 1);

  const workforceStabilityU = clamp(
    linearUnit(m.confirmationRatePercent, 50, 99) * 0.44 +
      availRatio * 0.32 +
      invertUnit(linearUnit(m.operationalConflicts, 0, 6)) * 0.14 +
      invertUnit(linearUnit(m.overdueOpenShifts, 0, 5)) * 0.1,
    0,
    1,
  );
  const workforceStability = unitToScore(workforceStabilityU);

  const scores = scoreSnapshots(coverageRisk, coordinationStress, workforceStability);
  const consolidatedRiskScore =
    scores.coverage_risk_score.value * CONSOLIDATED_RISK_WEIGHTS.coverageRisk +
    scores.coordination_stress_score.value * CONSOLIDATED_RISK_WEIGHTS.coordinationStress +
    (100 - scores.workforce_stability_score.value) * CONSOLIDATED_RISK_WEIGHTS.workforceFragility;

  return {
    scores,
    consolidatedRiskScore: Math.round(clamp(consolidatedRiskScore, 0, 100) * 10) / 10,
    operationalHealthScore: scores.operational_health_score.value,
  };
}
