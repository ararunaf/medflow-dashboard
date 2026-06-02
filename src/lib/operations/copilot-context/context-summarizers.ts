import type { OperationalAlert } from "@/lib/operations/alerts/types";
import type { OperationalRecommendation } from "@/lib/operations/recommendations/types";
import type { OperationalScoringResult } from "@/lib/operations/scoring/types";
import type { CoordinatorContextSummary } from "@/lib/operations/copilot-context/types";

const STATE_ORDER: Record<OperationalRecommendation["state"], number> = {
  urgent: 0,
  recommended: 1,
  suggested: 2,
};

export function sortRecommendationsForCoordinator(
  items: readonly OperationalRecommendation[],
): OperationalRecommendation[] {
  return [...items].sort((a, b) => {
    const d = STATE_ORDER[a.state] - STATE_ORDER[b.state];
    if (d !== 0) return d;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

export function summarizeCoordinatorContext(input: {
  scoring: OperationalScoringResult;
  alerts: readonly OperationalAlert[];
  recommendations: readonly OperationalRecommendation[];
}): CoordinatorContextSummary {
  const criticalAlertCount = input.alerts.filter((a) => a.severity === "critical").length;
  const warningAlertCount = input.alerts.filter((a) => a.severity === "warning").length;
  const urgentRecommendationCount = input.recommendations.filter(
    (r) => r.state === "urgent",
  ).length;
  const openRecommendationCount = input.recommendations.length;

  const headline =
    input.scoring.healthState === "critical" || criticalAlertCount > 0
      ? "Operação sob tensão — revisar gargalos imediatos"
      : input.scoring.healthState === "warning" || urgentRecommendationCount > 0
        ? "Operação em atenção — priorizar mitigações sugeridas"
        : input.scoring.healthState === "attention"
          ? "Operação acompanhável — manter vigilância"
          : "Operação estável no recorte atual";

  const subhead = `Saúde consolidada ${input.scoring.operationalHealthScore.toFixed(
    0,
  )}/100 · risco consolidado ${input.scoring.consolidatedRiskScore.toFixed(1)}/100 (maior = pior)`;

  const sorted = sortRecommendationsForCoordinator(input.recommendations);
  const priorityLines: string[] = [];
  if (criticalAlertCount > 0) {
    priorityLines.push(
      `${criticalAlertCount} alerta(s) crítico(s) ativo(s) nas regras explícitas.`,
    );
  }
  if (urgentRecommendationCount > 0) {
    priorityLines.push(`${urgentRecommendationCount} recomendação(ões) em estado urgente.`);
  }
  for (const r of sorted.slice(0, 3)) {
    priorityLines.push(`${r.state.toUpperCase()}: ${r.title}`);
  }
  if (priorityLines.length === 0) {
    priorityLines.push("Nenhuma prioridade automática destacada — manter ritmo de coordenação.");
  }

  return {
    headline,
    subhead,
    priorityLines,
    criticalAlertCount,
    warningAlertCount,
    openRecommendationCount,
    urgentRecommendationCount,
  };
}

export function riskSummaryLines(
  scoring: OperationalScoringResult,
  alerts: readonly OperationalAlert[],
): string[] {
  const lines: string[] = [...scoring.riskNotes];
  const critTitles = alerts.filter((a) => a.severity === "critical").map((a) => a.title);
  for (const t of critTitles.slice(0, 4)) {
    lines.push(`Alerta crítico: ${t}`);
  }
  return lines.slice(0, 12);
}
