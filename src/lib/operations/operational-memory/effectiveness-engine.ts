import type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
import { learningRegistryEntryForKind } from "@/lib/operations/operational-memory/learning-registry";
import type {
  OperationalMemoryEffectivenessFusion,
  OperationalMemoryInsight,
  OperationalMemoryLayerSummary,
  OperationalMemoryRegistryHighlight,
} from "@/lib/operations/operational-memory/types";

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function buildOperationalMemoryEffectivenessFusion(input: {
  insights: OperationalMemoryInsight[];
  recommendationQuality: number | null;
}): OperationalMemoryEffectivenessFusion {
  const scores = input.insights
    .map((i) => i.effectivenessScore)
    .filter((s): s is number => s != null && !Number.isNaN(s));
  const memoryEffectivenessAvg = avg(scores);
  const rollbacks = input.insights.filter((i) => i.memoryKind === "rollback_signal").length;
  const executions = input.insights.filter((i) => i.memoryKind === "execution_outcome").length;
  let rollbackPressure: OperationalMemoryEffectivenessFusion["rollbackPressure"] = "low";
  if (rollbacks >= 4 || (executions > 0 && rollbacks / executions >= 0.35))
    rollbackPressure = "high";
  else if (rollbacks >= 2 || (executions > 0 && rollbacks / executions >= 0.15))
    rollbackPressure = "medium";

  const narratives: string[] = [];
  if (input.recommendationQuality != null) {
    narratives.push(
      `Qualidade agregada de feedback de recomendações (janela recente): ${(input.recommendationQuality * 100).toFixed(0)}%.`,
    );
  }
  if (memoryEffectivenessAvg != null) {
    narratives.push(
      `Média de effectiveness nas entradas de memória listadas: ${(memoryEffectivenessAvg * 100).toFixed(0)}%.`,
    );
  }
  narratives.push(
    rollbackPressure === "high"
      ? "Pressão de rollback elevada — revisar políticas de execução e simulações."
      : rollbackPressure === "medium"
        ? "Pressão de rollback moderada — monitorar correlação com falhas de execução."
        : "Pressão de rollback baixa no recorte observado.",
  );
  return {
    recommendationQuality: input.recommendationQuality,
    memoryEffectivenessAvg,
    rollbackPressure,
    narratives,
  };
}

export function buildRegistryHighlightsFromInsights(
  insights: OperationalMemoryInsight[],
): OperationalMemoryRegistryHighlight[] {
  const kinds = new Set(insights.map((i) => i.memoryKind));
  const out: OperationalMemoryRegistryHighlight[] = [];
  for (const k of kinds) {
    const reg = learningRegistryEntryForKind(k);
    if (!reg) continue;
    out.push({
      kind: k,
      pipeline: reg.pipeline,
      note: reg.description,
    });
  }
  return out.slice(0, 12);
}

export function buildOperationalMemoryLayerSummary(input: {
  computedAt: string;
  windowFromISO: string;
  recentInsights: OperationalMemoryInsight[];
  recommendationFeedback: OperationalRecommendationFeedbackOverlay;
  forecastProbe?: OperationalMemoryLayerSummary["forecastProbe"];
}): OperationalMemoryLayerSummary {
  const effectivenessFusion = buildOperationalMemoryEffectivenessFusion({
    insights: input.recentInsights,
    recommendationQuality:
      input.recommendationFeedback.effectiveness.alignmentRate ??
      input.recommendationFeedback.effectiveness.executionSuccessRate ??
      null,
  });
  return {
    computedAt: input.computedAt,
    windowFromISO: input.windowFromISO,
    recentInsights: input.recentInsights,
    effectivenessFusion,
    registryHighlights: buildRegistryHighlightsFromInsights(input.recentInsights),
    forecastProbe: input.forecastProbe,
  };
}
