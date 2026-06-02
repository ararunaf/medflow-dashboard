import type {
  OperationalContextPayload,
  OperationalSemanticSnapshot,
} from "@/lib/operations/copilot-context/types";

/** Cartão determinístico para exibir ao lado da resposta do modelo (baseline auditável). */
export function buildOperationalAiSummaryCard(
  payload: OperationalContextPayload,
  semantic: OperationalSemanticSnapshot,
): { headline: string; bullets: string[]; footer: string } {
  const bullets: string[] = [
    `Saúde operacional (estado): ${semantic.healthState} · risco consolidado ${semantic.consolidatedRiskScore.toFixed(0)}/100`,
    `Health score (0–100, maior melhor): ${semantic.operationalHealthScore.toFixed(0)}`,
    ...semantic.semanticHighlights.slice(0, 3),
  ];
  return {
    headline: semantic.narrativeHeadline || payload.coordinatorSummary.headline,
    bullets: bullets.slice(0, 5),
    footer: `Fingerprint ${payload.fingerprint} · escopo ${payload.scope} · as_of ${payload.asOf}`,
  };
}
