/**
 * Serviço de scoring operacional na janela viva (command center).
 * Analytics usa `analytics-payload-scoring.ts` para evitar ciclo com o loader de snapshot.
 */
import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import { commandCenterSnapshotToScoringMetrics } from "@/lib/operations/scoring/adapters/command-center-adapter";
import { evaluateConsolidatedOperationalState } from "@/lib/operations/scoring/operational-state-evaluator";
import { computeScoresFromCommandCenterMetrics } from "@/lib/operations/scoring/score-calculators";
import type { AlertSeverityCounts, OperationalScoringResult } from "@/lib/operations/scoring/types";

function buildHighlightsLive(
  scores: OperationalScoringResult["scores"],
  consolidatedRiskScore: number,
): { highlights: string[]; riskNotes: string[] } {
  const highlights: string[] = [];
  const riskNotes: string[] = [
    `Risco sintético ${consolidatedRiskScore.toFixed(1)}/100 (base: janela viva + pressão numérica).`,
  ];

  if (scores.coverage_risk_score.value >= 58) {
    highlights.push("Cobertura na janela ou plantões sem confirmação elevando risco imediato.");
  } else if (scores.coverage_risk_score.value >= 40) {
    highlights.push("Cobertura em faixa de atenção na janela operacional.");
  }

  if (scores.coordination_stress_score.value >= 58) {
    highlights.push("Pressão de coordenação alta (pendências, swaps ou proximidade de início).");
  }

  if (scores.workforce_stability_score.value < 48) {
    highlights.push("Disponibilidade ou taxa de confirmação frágeis na amostra atual.");
  }

  if (highlights.length === 0) {
    highlights.push("Indicadores instantâneos coerentes com operação estável na janela.");
  }

  return { highlights, riskNotes };
}

export function buildOperationalScoringFromCommandCenterCore(
  core: OperationalCommandCenterCore,
  opts?: { alertCounts?: AlertSeverityCounts | null },
): OperationalScoringResult {
  const metrics = commandCenterSnapshotToScoringMetrics(core);
  const { scores, consolidatedRiskScore, operationalHealthScore } =
    computeScoresFromCommandCenterMetrics(metrics);

  const healthState = evaluateConsolidatedOperationalState({
    consolidatedRiskScore,
    operationalHealthScore,
    alertCounts: opts?.alertCounts ?? null,
  });

  const { highlights, riskNotes } = buildHighlightsLive(scores, consolidatedRiskScore);

  return {
    basis: "live_window",
    computedAt: core.asOf,
    scores,
    consolidatedRiskScore,
    operationalHealthScore,
    healthState,
    highlights,
    riskNotes,
  };
}
