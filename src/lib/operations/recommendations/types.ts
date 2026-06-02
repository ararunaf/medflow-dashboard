/**
 * Camada de recomendações operacionais determinística (sem ML / LLM).
 * Estados e tipos estáveis para UI, API e futuro copiloto.
 */
import type { OperationalAlertRuleId } from "@/lib/operations/alerts/types";
import type { OperationalScoreId } from "@/lib/operations/scoring/types";

export const OPERATIONAL_RECOMMENDATION_TYPES = [
  "mitigation",
  "coordination",
  "staffing",
  "escalation",
  "monitoring",
] as const;

export type OperationalRecommendationType = (typeof OPERATIONAL_RECOMMENDATION_TYPES)[number];

export const OPERATIONAL_RECOMMENDATION_STATES = ["suggested", "recommended", "urgent"] as const;

export type OperationalRecommendationState = (typeof OPERATIONAL_RECOMMENDATION_STATES)[number];

export const OPERATIONAL_RECOMMENDATION_TRIGGERS = [
  "coverage_low",
  "rising_risk",
  "predicted_deterioration",
  "operational_pressure",
  "critical_swaps",
  "rising_unavailability",
  "pending_assignments",
  "operational_conflicts",
] as const;

export type OperationalRecommendationTrigger = (typeof OPERATIONAL_RECOMMENDATION_TRIGGERS)[number];

export const OPERATIONAL_FORECAST_PROJECTIONS = [
  "stable",
  "deteriorating",
  "critical_projection",
] as const;

export type OperationalForecastProjection = (typeof OPERATIONAL_FORECAST_PROJECTIONS)[number];

export type OperationalForecastBasis = "live_window" | "period_trends";

/** Baseline de projeção operacional (heurística explícita, sem modelo preditivo). */
export type OperationalForecastBaseline = {
  computedAt: string;
  basis: OperationalForecastBasis;
  projection: OperationalForecastProjection;
  /** Frases curtas justificando a projeção (auditável). */
  rationale: string[];
};

export type OperationalRecommendation = {
  /** Identificador estável para dedupe e telemetria futura. */
  id: string;
  trigger: OperationalRecommendationTrigger;
  type: OperationalRecommendationType;
  state: OperationalRecommendationState;
  title: string;
  body: string;
  /** Cadeia causal legível (explicabilidade). */
  because: string[];
  linkedAlertIds?: OperationalAlertRuleId[];
  linkedScoreIds?: OperationalScoreId[];
  forecastProjection?: OperationalForecastProjection;
  /** Passos de mitigação sugeridos (planejamento, não execução automática). */
  mitigationPlan?: string[];
};

export type OperationalRecommendationSummary = {
  headline: string;
  topMitigationId: string | null;
  countsByState: Record<OperationalRecommendationState, number>;
  countsByType: Record<OperationalRecommendationType, number>;
};

export type OperationalRecommendationBundle = {
  computedAt: string;
  forecast: OperationalForecastBaseline;
  summary: OperationalRecommendationSummary;
  items: OperationalRecommendation[];
};
