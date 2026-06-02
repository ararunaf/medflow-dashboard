/**
 * Construção do snapshot de sinais adaptativos a partir do material já
 * persistido pelas camadas anteriores: memória operacional, overlay de
 * feedback de recomendações e métricas leves de orquestração.
 *
 * Nunca recomputa séries longas — usa somente os agregados já materializados
 * para evitar custos lineares em históricos gigantes.
 */
import type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
import type {
  OperationalMemoryInsight,
  OperationalMemoryLayerSummary,
} from "@/lib/operations/operational-memory/types";
import type { AdaptiveSignalSnapshot } from "./types";

type Aggregate = {
  sum: number;
  count: number;
};

const empty = (): Aggregate => ({ sum: 0, count: 0 });

function addScore(agg: Aggregate, score: number | null | undefined): void {
  if (score == null || !Number.isFinite(score)) return;
  agg.sum += Math.max(0, Math.min(1, score));
  agg.count += 1;
}

function avg(agg: Aggregate): number | null {
  if (agg.count === 0) return null;
  return agg.sum / agg.count;
}

function ratio(num: number, denom: number): number {
  if (denom <= 0) return 0;
  return Math.max(0, Math.min(1, num / denom));
}

export type AdaptiveSignalInput = {
  computedAt: string;
  memory: OperationalMemoryLayerSummary;
  recommendationFeedback: OperationalRecommendationFeedbackOverlay;
};

export function buildAdaptiveSignalSnapshot(input: AdaptiveSignalInput): AdaptiveSignalSnapshot {
  const insights: OperationalMemoryInsight[] = input.memory.recentInsights;

  const recAgg = empty();
  const mitAgg = empty();
  const coordAgg = empty();
  const forecastAgg = empty();
  const orchAgg = empty();

  let rollbackCount = 0;
  let executionLikeCount = 0;
  let deteriorationWindows = 0;
  let forecastWindows = 0;

  for (const ins of insights) {
    switch (ins.memoryKind) {
      case "recommendation_outcome":
        addScore(recAgg, ins.effectivenessScore);
        break;
      case "mitigation_effectiveness":
        addScore(mitAgg, ins.effectivenessScore);
        break;
      case "coordination_effectiveness":
        addScore(coordAgg, ins.effectivenessScore);
        break;
      case "forecast_accuracy_snapshot":
        addScore(forecastAgg, ins.effectivenessScore);
        forecastWindows += 1;
        break;
      case "orchestration_effectiveness":
        addScore(orchAgg, ins.effectivenessScore);
        break;
      case "execution_outcome":
        executionLikeCount += 1;
        break;
      case "rollback_signal":
        rollbackCount += 1;
        executionLikeCount += 1;
        break;
      case "deterioration_pattern":
        deteriorationWindows += 1;
        forecastWindows += 1;
        break;
      case "proposal_outcome":
        executionLikeCount += 1;
        break;
    }
  }

  // Quando a memória tem amostra magra, ainda complementamos com effectiveness
  // do overlay de feedback (sample agregado independente).
  const overlay = input.recommendationFeedback.effectiveness;
  const overlayRec = overlay.alignmentRate ?? overlay.executionSuccessRate ?? null;

  // Incorpora um único ponto agregado para evitar dupla contagem com a memória.
  if (overlayRec != null && recAgg.count === 0) {
    addScore(recAgg, overlayRec);
  }
  if (overlay.scoredMitigationSuccessRate != null && mitAgg.count === 0) {
    addScore(mitAgg, overlay.scoredMitigationSuccessRate);
  }

  const rollbackFrequency = ratio(rollbackCount, Math.max(1, executionLikeCount));
  const deteriorationRecurrence = ratio(deteriorationWindows, Math.max(1, forecastWindows));

  const sampleSize =
    insights.length + (overlay.sampleSize > 0 && insights.length === 0 ? overlay.sampleSize : 0);

  const sampleNotes: string[] = [];
  if (insights.length === 0) {
    sampleNotes.push(
      "Sem insights de memória nos últimos 14 dias — sinais derivam apenas do overlay de feedback.",
    );
  } else {
    sampleNotes.push(
      `Memória recente: ${insights.length} entrada(s) consideradas para o ciclo adaptativo.`,
    );
  }
  if (overlay.sampleSize > 0) {
    sampleNotes.push(
      `Overlay de feedback: amostra n=${overlay.sampleSize} (alinhamento e execução já computados).`,
    );
  }

  return {
    computedAt: input.computedAt,
    windowFromISO: input.memory.windowFromISO,
    recommendationEffectiveness: avg(recAgg),
    mitigationSuccess: avg(mitAgg),
    coordinationEffectiveness: avg(coordAgg),
    forecastAccuracy: avg(forecastAgg),
    orchestrationOutcomes: avg(orchAgg),
    rollbackFrequency,
    deteriorationRecurrence,
    sampleSize,
    sampleNotes,
  };
}
