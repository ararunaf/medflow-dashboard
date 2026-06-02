import type { AdaptiveSignalSnapshot } from "@/lib/operations/adaptive-prioritization/types";
import {
  DEFAULT_ADAPTATION_BOUNDARIES,
  hasEnoughSample,
} from "@/lib/operations/adaptive-prioritization/adaptation-boundaries";
import type { OperationalPolicyFinding } from "./types";

export function evaluateAdaptiveGovernanceStress(
  signals: AdaptiveSignalSnapshot,
): OperationalPolicyFinding | null {
  const enough = hasEnoughSample(signals.sampleSize, DEFAULT_ADAPTATION_BOUNDARIES);
  if (!enough) return null;

  const rollbackHot = signals.rollbackFrequency >= 0.38;
  const recCold = (signals.recommendationEffectiveness ?? 1) < 0.48;
  const orchCold = (signals.orchestrationOutcomes ?? 1) < 0.5;

  if (!rollbackHot && !(recCold && orchCold)) return null;

  const severity =
    rollbackHot && recCold ? "critical" : rollbackHot || (recCold && orchCold) ? "warning" : "info";

  return {
    code: "adaptation_instability",
    severity,
    headline: "Estresse nos limites adaptativos supervisionados",
    narrative: [
      `Sinais agregados: rollbackFrequency=${signals.rollbackFrequency.toFixed(2)}, recommendationEffectiveness=${
        signals.recommendationEffectiveness?.toFixed(2) ?? "n/a"
      }, orchestrationOutcomes=${signals.orchestrationOutcomes?.toFixed(2) ?? "n/a"}.`,
      `Limites padrão de adaptação (peso ∈ [${DEFAULT_ADAPTATION_BOUNDARIES.minWeight}, ${DEFAULT_ADAPTATION_BOUNDARIES.maxWeight}]) continuam válidos — o foco é calibrar thresholds humanos e políticas de gate, não expandir autonomia.`,
    ],
    references: [{ kind: "adaptive_signal_digest", id: signals.computedAt }],
  };
}

export function evaluateIneffectiveThresholds(
  signals: AdaptiveSignalSnapshot,
): OperationalPolicyFinding | null {
  if (!hasEnoughSample(signals.sampleSize, DEFAULT_ADAPTATION_BOUNDARIES)) return null;
  if (signals.rollbackFrequency < 0.32 || (signals.recommendationEffectiveness ?? 0.6) >= 0.55)
    return null;

  return {
    code: "ineffective_thresholds",
    severity: signals.rollbackFrequency >= 0.42 ? "warning" : "info",
    headline: "Thresholds operacionais possivelmente ineficazes",
    narrative: [
      "Rollback frequente com effectiveness de recomendações moderada sugere que limiares de alerta, confirmação ou priorização podem estar gerando ruído.",
      "Ajustes propostos são apenas sugestões documentadas — implementação futura continua supervisionada.",
    ],
    references: [{ kind: "adaptive_signal_digest", id: signals.computedAt }],
  };
}
