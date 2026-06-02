/**
 * Avaliação de risco operacional agregada (0–100) → estado de saúde textual.
 */
import { clamp } from "@/lib/operations/scoring/normalization";
import type { OperationalHealthState } from "@/lib/operations/scoring/types";

export type RiskEvaluationInput = {
  consolidatedRiskScore: number;
  operationalHealthScore: number;
};

/** Estado base só a partir de métricas contínuas (antes de alertas). */
export function evaluateBaseOperationalState(input: RiskEvaluationInput): OperationalHealthState {
  const risk = clamp(input.consolidatedRiskScore, 0, 100);
  const health = clamp(input.operationalHealthScore, 0, 100);

  if (risk >= 68 || health < 38) return "critical";
  if (risk >= 52 || health < 52) return "warning";
  if (risk >= 36 || health < 66) return "attention";
  return "healthy";
}
