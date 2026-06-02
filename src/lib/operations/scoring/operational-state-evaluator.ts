/**
 * Consolida estado operacional com sinais discretos (alertas) sem recomputar KPIs.
 */
import { evaluateBaseOperationalState } from "@/lib/operations/scoring/risk-evaluator";
import type { AlertSeverityCounts, OperationalHealthState } from "@/lib/operations/scoring/types";

const STATE_ORDER: OperationalHealthState[] = ["healthy", "attention", "warning", "critical"];

function stateRank(s: OperationalHealthState): number {
  return STATE_ORDER.indexOf(s);
}

function maxState(a: OperationalHealthState, b: OperationalHealthState): OperationalHealthState {
  return stateRank(a) >= stateRank(b) ? a : b;
}

function bumpState(s: OperationalHealthState, levels: number): OperationalHealthState {
  const idx = Math.min(STATE_ORDER.length - 1, Math.max(0, stateRank(s) + levels));
  return STATE_ORDER[idx]!;
}

/**
 * Ajusta o estado contínuo com a severidade dos alertas do motor existente.
 * Regra conservadora: alertas críticos puxam o estado para cima, sem inventar novos sinais.
 */
export function evaluateConsolidatedOperationalState(input: {
  consolidatedRiskScore: number;
  operationalHealthScore: number;
  alertCounts?: AlertSeverityCounts | null;
}): OperationalHealthState {
  let state = evaluateBaseOperationalState({
    consolidatedRiskScore: input.consolidatedRiskScore,
    operationalHealthScore: input.operationalHealthScore,
  });

  const c = input.alertCounts?.critical ?? 0;
  const w = input.alertCounts?.warning ?? 0;

  if (c >= 1) state = maxState(state, bumpState(state, 1));
  if (c >= 3) state = maxState(state, "warning");
  if (c >= 5) state = maxState(state, "critical");
  if (c === 0 && w >= 8) state = maxState(state, bumpState(state, 1));

  return state;
}
