import type {
  AcceptanceTrendPoint,
  OperationalLearningSignal,
  RecommendationEffectivenessMetrics,
} from "@/lib/operations/feedback/types";

/**
 * Heurísticas leves (sem modelo) — alimentam copiloto / ranking futuro com
 * sinais auditáveis a partir de contagens agregadas.
 */
export function buildOperationalLearningSignals(input: {
  effectiveness: RecommendationEffectivenessMetrics;
  acceptanceTrend: AcceptanceTrendPoint[];
}): OperationalLearningSignal[] {
  const signals: OperationalLearningSignal[] = [];
  const { effectiveness: e, acceptanceTrend } = input;

  if (e.sampleSize >= 8 && e.ignored > (e.accepted + e.executed) * 1.25) {
    signals.push({
      id: "ignored_vs_positive",
      kind: "coordination",
      headline: "Padrão de ignorar recomendações",
      detail:
        "Volume de feedback “ignored” supera aceitações/execuções no período — revisar relevância dos gatilhos ou contexto de coordenação.",
    });
  }

  if (
    e.executionSuccessRate != null &&
    e.executed + e.executionFailed >= 5 &&
    e.executionSuccessRate < 0.65
  ) {
    signals.push({
      id: "execution_friction",
      kind: "effectiveness",
      headline: "Fricção na execução",
      detail:
        "Taxa de falhas após tentativa de execução está elevada — investigar bloqueios operacionais (não automação).",
    });
  }

  if (acceptanceTrend.length >= 5) {
    const last = acceptanceTrend.slice(-3);
    const first = acceptanceTrend.slice(0, 3);
    const avg = (xs: AcceptanceTrendPoint[]) => {
      if (xs.length === 0) return 0;
      const s = xs.reduce((acc, p) => acc + p.accepted + p.executed, 0);
      return s / xs.length;
    };
    const tail = avg(last);
    const head = avg(first);
    if (head > 0 && tail < head * 0.65) {
      signals.push({
        id: "acceptance_trend_down",
        kind: "trend",
        headline: "Tendência de aceitação em queda",
        detail:
          "Últimos buckets diários concentram menos aceitações/execuções que o início da janela — sinal para revisão humana de playbook.",
      });
    }
  }

  return signals;
}
