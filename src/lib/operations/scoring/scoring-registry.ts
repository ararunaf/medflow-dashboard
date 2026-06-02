/**
 * Registro canônico de scores operacionais — IDs estáveis para evolução (IA futura).
 */
import type { OperationalScoreId } from "@/lib/operations/scoring/types";

export const OPERATIONAL_SCORE_LABELS: Record<OperationalScoreId, string> = {
  operational_health_score: "Saúde operacional",
  coverage_risk_score: "Risco de cobertura",
  coordination_stress_score: "Estresse de coordenação",
  workforce_stability_score: "Estabilidade da força de trabalho",
};

/** Pesos da síntese de risco consolidado (componentes 0–100, maior = pior onde aplicável). */
export const CONSOLIDATED_RISK_WEIGHTS = {
  coverageRisk: 0.38,
  coordinationStress: 0.37,
  workforceFragility: 0.25,
} as const;

/** Pesos do score de saúde (componentes 0–100 “saúde” antes da composição final). */
export const OPERATIONAL_HEALTH_WEIGHTS = {
  coverageHealth: 0.4,
  coordinationHealth: 0.35,
  workforceStability: 0.25,
} as const;
