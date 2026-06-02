/**
 * Motor de ponderação histórica — converte AdaptiveSignalSnapshot em
 * AdaptiveWeightingProfile bounded por trigger e por subject kind.
 *
 * Cada fator carrega: peso final (clamped), influence (0..1) e rationale
 * textual para o painel de explicabilidade.
 */
import type { OperationalRecommendationTrigger } from "@/lib/operations/recommendations/types";
import { clampWeight, hasEnoughSample } from "./adaptation-boundaries";
import type {
  AdaptationBoundaries,
  AdaptivePrioritySubjectKind,
  AdaptiveSignalKind,
  AdaptiveSignalSnapshot,
  AdaptiveWeightingFactor,
  AdaptiveWeightingProfile,
} from "./types";

/** Resultado bruto antes do clamp, usado para inspecionar influence. */
type FactorDraft = {
  rawWeight: number;
  dominantSignal: AdaptiveSignalKind;
  rationale: string;
};

function influenceFromWeight(weight: number, boundaries: AdaptationBoundaries): number {
  if (!Number.isFinite(weight)) return 0;
  const upRange = boundaries.maxWeight - 1;
  const downRange = 1 - boundaries.minWeight;
  if (weight >= 1) {
    return upRange > 0 ? Math.min(1, (weight - 1) / upRange) : 0;
  }
  return downRange > 0 ? Math.min(1, (1 - weight) / downRange) : 0;
}

function finalize(draft: FactorDraft, boundaries: AdaptationBoundaries): AdaptiveWeightingFactor {
  const weight = clampWeight(draft.rawWeight, boundaries);
  return {
    weight,
    influence: influenceFromWeight(weight, boundaries),
    dominantSignal: draft.dominantSignal,
    rationale: draft.rationale,
  };
}

function fromScore(score: number | null, baseline = 1): { delta: number; explain: string } {
  if (score == null) return { delta: 0, explain: "sem amostra histórica suficiente" };
  // score em 0..1. score=0.5 mantém peso; scores > 0.5 reforçam, < 0.5 desencorajam.
  const delta = (score - 0.5) * 0.6; // máximo +/-0.3 antes do clamp
  const pct = (score * 100).toFixed(0);
  return {
    delta: baseline * delta,
    explain: `${pct}% de effectiveness histórica recente`,
  };
}

function fromFrequency(
  freq: number,
  polarity: "higher_worse" | "higher_better",
): {
  delta: number;
  explain: string;
} {
  // freq em 0..1. polarity governa o sinal.
  const dir = polarity === "higher_worse" ? -1 : 1;
  const delta = dir * freq * 0.35;
  const pct = (freq * 100).toFixed(0);
  return {
    delta,
    explain:
      polarity === "higher_worse"
        ? `${pct}% de incidência (alto → desencorajar repriorização)`
        : `${pct}% de incidência (mais frequente → reforçar)`,
  };
}

function buildTriggerDraft(
  trigger: OperationalRecommendationTrigger,
  signals: AdaptiveSignalSnapshot,
): FactorDraft {
  // Cada trigger mapeia para sinais dominantes diferentes.
  switch (trigger) {
    case "coverage_low":
    case "rising_unavailability": {
      const m = fromScore(signals.mitigationSuccess);
      const r = fromFrequency(signals.rollbackFrequency, "higher_worse");
      return {
        rawWeight: 1 + m.delta + r.delta,
        dominantSignal:
          Math.abs(m.delta) >= Math.abs(r.delta) ? "mitigation_success" : "rollback_frequency",
        rationale: `${m.explain}; rollback ${r.explain}`,
      };
    }
    case "predicted_deterioration": {
      const f = fromScore(signals.forecastAccuracy);
      const d = fromFrequency(signals.deteriorationRecurrence, "higher_better");
      return {
        rawWeight: 1 + f.delta + d.delta,
        dominantSignal:
          Math.abs(d.delta) >= Math.abs(f.delta) ? "deterioration_recurrence" : "forecast_accuracy",
        rationale: `forecast accuracy: ${f.explain}; recorrência: ${d.explain}`,
      };
    }
    case "rising_risk":
    case "operational_pressure": {
      const c = fromScore(signals.coordinationEffectiveness);
      const r = fromFrequency(signals.rollbackFrequency, "higher_worse");
      return {
        rawWeight: 1 + c.delta + r.delta,
        dominantSignal:
          Math.abs(c.delta) >= Math.abs(r.delta)
            ? "coordination_effectiveness"
            : "rollback_frequency",
        rationale: `coordenação: ${c.explain}; rollback: ${r.explain}`,
      };
    }
    case "critical_swaps":
    case "pending_assignments":
    case "operational_conflicts": {
      const c = fromScore(signals.coordinationEffectiveness);
      const o = fromScore(signals.orchestrationOutcomes);
      return {
        rawWeight: 1 + c.delta + o.delta * 0.7,
        dominantSignal:
          Math.abs(c.delta) >= Math.abs(o.delta)
            ? "coordination_effectiveness"
            : "orchestration_outcomes",
        rationale: `coordenação: ${c.explain}; orquestração: ${o.explain}`,
      };
    }
  }
}

function buildSubjectDraft(
  subject: AdaptivePrioritySubjectKind,
  signals: AdaptiveSignalSnapshot,
): FactorDraft {
  switch (subject) {
    case "recommendation": {
      const r = fromScore(signals.recommendationEffectiveness);
      return {
        rawWeight: 1 + r.delta,
        dominantSignal: "recommendation_effectiveness",
        rationale: r.explain,
      };
    }
    case "orchestration": {
      const o = fromScore(signals.orchestrationOutcomes);
      const rb = fromFrequency(signals.rollbackFrequency, "higher_worse");
      return {
        rawWeight: 1 + o.delta + rb.delta,
        dominantSignal:
          Math.abs(o.delta) >= Math.abs(rb.delta) ? "orchestration_outcomes" : "rollback_frequency",
        rationale: `orquestração: ${o.explain}; rollback: ${rb.explain}`,
      };
    }
    case "mitigation": {
      const m = fromScore(signals.mitigationSuccess);
      return {
        rawWeight: 1 + m.delta,
        dominantSignal: "mitigation_success",
        rationale: m.explain,
      };
    }
    case "escalation": {
      const d = fromFrequency(signals.deteriorationRecurrence, "higher_better");
      const f = fromScore(signals.forecastAccuracy);
      return {
        rawWeight: 1 + d.delta + f.delta * 0.6,
        dominantSignal:
          Math.abs(d.delta) >= Math.abs(f.delta) ? "deterioration_recurrence" : "forecast_accuracy",
        rationale: `recorrência: ${d.explain}; forecast: ${f.explain}`,
      };
    }
    case "coordination": {
      const c = fromScore(signals.coordinationEffectiveness);
      return {
        rawWeight: 1 + c.delta,
        dominantSignal: "coordination_effectiveness",
        rationale: c.explain,
      };
    }
  }
}

const TRIGGER_KEYS: readonly OperationalRecommendationTrigger[] = [
  "coverage_low",
  "rising_risk",
  "predicted_deterioration",
  "operational_pressure",
  "critical_swaps",
  "rising_unavailability",
  "pending_assignments",
  "operational_conflicts",
];

const SUBJECT_KEYS: readonly AdaptivePrioritySubjectKind[] = [
  "recommendation",
  "orchestration",
  "mitigation",
  "escalation",
  "coordination",
];

/** Perfil neutro — usado quando a amostra é insuficiente (mantém layer="static"). */
function neutralFactor(dominant: AdaptiveSignalKind, reason: string): AdaptiveWeightingFactor {
  return {
    weight: 1,
    influence: 0,
    dominantSignal: dominant,
    rationale: reason,
  };
}

export function buildHistoricalWeightingProfile(input: {
  signals: AdaptiveSignalSnapshot;
  boundaries: AdaptationBoundaries;
}): AdaptiveWeightingProfile {
  const { signals, boundaries } = input;
  const enough = hasEnoughSample(signals.sampleSize, boundaries);

  const byTrigger: AdaptiveWeightingProfile["byTrigger"] = {};
  const bySubjectKind: AdaptiveWeightingProfile["bySubjectKind"] = {};

  if (!enough) {
    for (const t of TRIGGER_KEYS) {
      byTrigger[t] = neutralFactor(
        "recommendation_effectiveness",
        "Amostra histórica insuficiente — mantendo peso neutro (static).",
      );
    }
    for (const s of SUBJECT_KEYS) {
      bySubjectKind[s] = neutralFactor(
        "recommendation_effectiveness",
        "Amostra histórica insuficiente — mantendo peso neutro (static).",
      );
    }
    return { byTrigger, bySubjectKind };
  }

  for (const t of TRIGGER_KEYS) {
    byTrigger[t] = finalize(buildTriggerDraft(t, signals), boundaries);
  }
  for (const s of SUBJECT_KEYS) {
    bySubjectKind[s] = finalize(buildSubjectDraft(s, signals), boundaries);
  }

  return { byTrigger, bySubjectKind };
}
