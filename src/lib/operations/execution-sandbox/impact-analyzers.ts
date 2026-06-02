/**
 * Analisadores de impacto do sandbox.
 *
 * Calculam deltas hipotéticos sobre scores e forecast a partir do snapshot
 * já carregado — não acionam analytics RPC nem recomputam KPIs.
 */
import { evaluateBaseOperationalState } from "@/lib/operations/scoring/risk-evaluator";
import type {
  OperationalForecastBaseline,
  OperationalForecastProjection,
} from "@/lib/operations/recommendations/types";
import type {
  OperationalHealthState,
  OperationalScoringResult,
} from "@/lib/operations/scoring/types";
import type {
  AffectedEntity,
  ImpactAnalysis,
  OperationalImpactSeverity,
  ProjectedConflict,
  ProjectedForecastChange,
  ProjectedScoreChange,
} from "@/lib/operations/execution-sandbox/types";

/** Ordem semântica de severidade — usado para escolher o pior nível. */
const SEVERITY_ORDER: OperationalImpactSeverity[] = ["none", "low", "moderate", "high", "critical"];

export function severityRank(s: OperationalImpactSeverity): number {
  return SEVERITY_ORDER.indexOf(s);
}

export function maxSeverity(
  a: OperationalImpactSeverity,
  b: OperationalImpactSeverity,
): OperationalImpactSeverity {
  return severityRank(a) >= severityRank(b) ? a : b;
}

/**
 * Aplica deltas de score (conservadores) sobre o scoring atual e devolve o
 * `health state` projetado. Não muta o objeto de entrada.
 */
export function projectHealthStateAfter(input: {
  scoring: OperationalScoringResult;
  scoreDeltas: readonly ProjectedScoreChange[];
}): OperationalHealthState {
  const s = input.scoring;
  let coverageRisk = s.scores.coverage_risk_score.value;
  let coordinationStress = s.scores.coordination_stress_score.value;
  let workforceStability = s.scores.workforce_stability_score.value;
  let health = s.operationalHealthScore;

  for (const d of input.scoreDeltas) {
    if (d.scoreId === "coverage_risk_score") coverageRisk -= d.projectedDeltaPoints;
    else if (d.scoreId === "coordination_stress_score")
      coordinationStress -= d.projectedDeltaPoints;
    else if (d.scoreId === "workforce_stability_score")
      workforceStability += d.projectedDeltaPoints;
    else if (d.scoreId === "operational_health_score") health += d.projectedDeltaPoints;
  }
  // Hard-clamp para 0..100 evita propagar deltas absurdos.
  coverageRisk = clamp(coverageRisk, 0, 100);
  coordinationStress = clamp(coordinationStress, 0, 100);
  workforceStability = clamp(workforceStability, 0, 100);
  // Reconstituição leve (não recomputa, apenas aproxima).
  const approxHealth = clamp(
    health > 0
      ? health
      : (100 - coverageRisk) * 0.4 + (100 - coordinationStress) * 0.35 + workforceStability * 0.25,
    0,
    100,
  );
  // Recalcula risco consolidado de forma conservadora.
  const consolidated = clamp(
    coverageRisk * 0.45 + coordinationStress * 0.4 + (100 - workforceStability) * 0.15,
    0,
    100,
  );
  return evaluateBaseOperationalState({
    consolidatedRiskScore: consolidated,
    operationalHealthScore: approxHealth,
  });
}

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/**
 * Avalia projeção de forecast — heurística simples:
 *  - melhoria significativa em score → forecast melhora um nível;
 *  - piora projetada (deltas negativos) → forecast piora.
 */
export function projectForecastTransition(input: {
  current: OperationalForecastBaseline;
  scoreDeltas: readonly ProjectedScoreChange[];
}): ProjectedForecastChange {
  const before = input.current.projection;
  const positivePts = sumPositiveScoreImpact(input.scoreDeltas);
  const negativePts = sumNegativeScoreImpact(input.scoreDeltas);

  let after: OperationalForecastProjection = before;
  let rationale = "Projeção mantida — deltas sandbox dentro da tolerância.";

  if (positivePts >= 6 && before === "critical_projection") {
    after = "deteriorating";
    rationale =
      "Mitigação simulada reduz risco — forecast projetado migra de crítico → deterioração.";
  } else if (positivePts >= 6 && before === "deteriorating") {
    after = "stable";
    rationale =
      "Mitigação simulada cobre lacunas — forecast projetado migra de deterioração → estável.";
  } else if (negativePts >= 6 && before === "stable") {
    after = "deteriorating";
    rationale = "Simulação aprofunda pendências (sem mitigação) — forecast tende a deteriorar.";
  } else if (negativePts >= 10 && before === "deteriorating") {
    after = "critical_projection";
    rationale = "Simulação amplia risco — forecast projetado escala para crítico.";
  }

  return { before, after, rationale };
}

function sumPositiveScoreImpact(deltas: readonly ProjectedScoreChange[]): number {
  let sum = 0;
  for (const d of deltas) {
    if (d.scoreId === "coverage_risk_score" || d.scoreId === "coordination_stress_score") {
      // Para scores "higher_is_worse", reduzir = positivo.
      if (d.projectedDeltaPoints > 0) sum += d.projectedDeltaPoints;
    } else if (d.projectedDeltaPoints > 0) {
      sum += d.projectedDeltaPoints;
    }
  }
  return sum;
}

function sumNegativeScoreImpact(deltas: readonly ProjectedScoreChange[]): number {
  let sum = 0;
  for (const d of deltas) {
    if (d.scoreId === "coverage_risk_score" || d.scoreId === "coordination_stress_score") {
      if (d.projectedDeltaPoints < 0) sum += -d.projectedDeltaPoints;
    } else if (d.projectedDeltaPoints < 0) {
      sum += -d.projectedDeltaPoints;
    }
  }
  return sum;
}

/** Consolida análise de impacto para o resultado final. */
export function buildImpactAnalysis(input: {
  scoring: OperationalScoringResult;
  forecast: OperationalForecastBaseline;
  affectedEntities: readonly AffectedEntity[];
  projectedScoreChanges: readonly ProjectedScoreChange[];
  projectedConflicts: readonly ProjectedConflict[];
}): ImpactAnalysis {
  const overall = computeOverallSeverity({
    entities: input.affectedEntities,
    conflicts: input.projectedConflicts,
  });

  const projectedForecast = projectForecastTransition({
    current: input.forecast,
    scoreDeltas: input.projectedScoreChanges,
  });

  const projectedHealthStateAfter = projectHealthStateAfter({
    scoring: input.scoring,
    scoreDeltas: input.projectedScoreChanges,
  });

  return {
    overallSeverity: overall,
    affectedEntityCount: input.affectedEntities.length,
    affectedEntities: input.affectedEntities.slice(),
    projectedScoreChanges: input.projectedScoreChanges.slice(),
    projectedForecast,
    projectedConflicts: input.projectedConflicts.slice(),
    projectedHealthStateAfter,
  };
}

function computeOverallSeverity(input: {
  entities: readonly AffectedEntity[];
  conflicts: readonly ProjectedConflict[];
}): OperationalImpactSeverity {
  let s: OperationalImpactSeverity = "none";
  for (const e of input.entities) s = maxSeverity(s, e.impactSeverity);
  for (const c of input.conflicts) s = maxSeverity(s, c.severity);
  return s;
}
