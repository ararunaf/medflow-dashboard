/**
 * Tipos da camada de scoring operacional (determinístico, sem ML).
 * Estados consolidados distintos da severidade de alertas individuais.
 */

export type OperationalHealthState = "healthy" | "attention" | "warning" | "critical";

export const OPERATIONAL_SCORE_IDS = [
  "operational_health_score",
  "coverage_risk_score",
  "coordination_stress_score",
  "workforce_stability_score",
] as const;

export type OperationalScoreId = (typeof OPERATIONAL_SCORE_IDS)[number];

export type ScoreInterpretation = "higher_is_better" | "higher_is_worse";

export type OperationalScoreSnapshot = {
  id: OperationalScoreId;
  /** Sempre 0–100 para comparabilidade na UI. */
  value: number;
  interpretation: ScoreInterpretation;
  label: string;
};

export type ScoringBasis = "period_analytics" | "live_window";

export type OperationalScoringResult = {
  basis: ScoringBasis;
  /** ISO instant — espelha o snapshot de origem. */
  computedAt: string;
  scores: Record<OperationalScoreId, OperationalScoreSnapshot>;
  /** 0–100 · maior = pior (síntese de risco operacional). */
  consolidatedRiskScore: number;
  /** 0–100 · maior = mais saudável (espelha operational_health_score). */
  operationalHealthScore: number;
  healthState: OperationalHealthState;
  /** Frases curtas para destaque na UI (pt-BR). */
  highlights: string[];
  /** Notas de risco legíveis por humanos. */
  riskNotes: string[];
};

export type AlertSeverityCounts = {
  critical: number;
  warning: number;
  info: number;
};
