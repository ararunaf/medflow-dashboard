/**
 * Helpers de guidance adaptativo — geram narrativa explicável que acompanha
 * cada ajuste e o resumo da camada.
 */
import { OPERATIONAL_GUIDANCE_REGISTRY } from "@/lib/operations/recommendations/operational-guidance-registry";
import type { OperationalRecommendationTrigger } from "@/lib/operations/recommendations/types";
import type {
  AdaptivePriorityAdjustment,
  AdaptivePriorityRationale,
  AdaptiveSignalKind,
  AdaptiveSignalSnapshot,
} from "./types";

const SIGNAL_LABEL: Record<AdaptiveSignalKind, string> = {
  recommendation_effectiveness: "Eficácia de recomendações",
  rollback_frequency: "Frequência de rollback",
  mitigation_success: "Sucesso de mitigação",
  deterioration_recurrence: "Recorrência de deterioração",
  coordination_effectiveness: "Eficácia de coordenação",
  forecast_accuracy: "Accuracy de forecast",
  orchestration_outcomes: "Outcomes de orquestração",
};

export function signalLabel(kind: AdaptiveSignalKind): string {
  return SIGNAL_LABEL[kind];
}

export function describeSignalSnapshot(snapshot: AdaptiveSignalSnapshot): string[] {
  const out: string[] = [];
  const pushPct = (label: string, value: number | null) => {
    if (value == null) return;
    out.push(`${label}: ${(value * 100).toFixed(0)}%.`);
  };
  pushPct("Eficácia de recomendações", snapshot.recommendationEffectiveness);
  pushPct("Sucesso de mitigação", snapshot.mitigationSuccess);
  pushPct("Eficácia de coordenação", snapshot.coordinationEffectiveness);
  pushPct("Outcomes de orquestração", snapshot.orchestrationOutcomes);
  pushPct("Accuracy de forecast", snapshot.forecastAccuracy);
  out.push(`Rollback: ${(snapshot.rollbackFrequency * 100).toFixed(0)}% da amostra.`);
  out.push(`Recorrência de deterioração: ${(snapshot.deteriorationRecurrence * 100).toFixed(0)}%.`);
  return out;
}

export function buildAdjustmentRationale(input: {
  trigger?: OperationalRecommendationTrigger;
  weightingRationale: string;
  signalsUsed: AdaptiveSignalKind[];
  baselineLabel: string;
  adjustedLabel: string;
  nudge: number;
}): AdaptivePriorityRationale {
  const direction = input.nudge > 0.05 ? "elevar" : input.nudge < -0.05 ? "reduzir" : "manter";
  const headline =
    direction === "manter"
      ? `Sem ajuste — peso histórico próximo de neutro (${input.baselineLabel}).`
      : `Adaptativo: ${direction} prioridade (${input.baselineLabel} → ${input.adjustedLabel}).`;

  const narrative: string[] = [];
  narrative.push(input.weightingRationale);
  if (input.trigger) {
    const guidance = OPERATIONAL_GUIDANCE_REGISTRY[input.trigger]?.summary;
    if (guidance) narrative.push(`Guidance base do trigger: ${guidance}`);
  }
  if (direction !== "manter") {
    narrative.push(
      `Sinal dominante recomenda ${direction} prioridade dentro dos limites de adaptação (bounded weighting).`,
    );
  }
  narrative.push("Ajuste sugerido — execução continua exclusivamente sob supervisão humana.");

  return {
    headline,
    narrative,
    dominantSignals: input.signalsUsed.slice(0, 3),
  };
}

export function adjustmentNarrative(adj: AdaptivePriorityAdjustment): string {
  const dir = adj.nudge > 0.05 ? "↑" : adj.nudge < -0.05 ? "↓" : "→";
  return `${dir} ${adj.subjectKind}:${adj.subjectId.slice(0, 8)}… · ${adj.rationale.headline}`;
}
