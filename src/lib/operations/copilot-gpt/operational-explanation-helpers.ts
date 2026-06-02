import type {
  OperationalContextPayload,
  OperationalSemanticSnapshot,
} from "@/lib/operations/copilot-context/types";

/** Linhas determinísticas para ancorar explicabilidade (sem LLM). */
export function operationalRiskExplanationLines(payload: OperationalContextPayload): string[] {
  const riskSec = payload.sectionDigests.find((s) => s.key === "currentRisks");
  const alerts = payload.references.filter((r) => r.kind === "alert");
  const critical = payload.coordinatorSummary.criticalAlertCount;
  const warning = payload.coordinatorSummary.warningAlertCount;
  const lines: string[] = [
    `Alertas mapeados na proveniência: ${alerts.length} (críticos declarados no resumo: ${critical}, avisos: ${warning}).`,
  ];
  if (riskSec?.bullets?.length) {
    lines.push(...riskSec.bullets.slice(0, 4));
  }
  return lines;
}

export function operationalForecastExplanationLines(payload: OperationalContextPayload): string[] {
  const fc = payload.references.find((r) => r.kind === "forecast");
  const pred = payload.sectionDigests.find((s) => s.key === "predictedDeterioration");
  const lines: string[] = [];
  if (fc) {
    lines.push(`Projeção baseline registrada: ${fc.projection}.`);
  }
  if (pred?.bullets?.length) {
    lines.push(...pred.bullets.slice(0, 4));
  }
  return lines.length ? lines : ["Sem projeção de deterioração anexada ao payload."];
}

export function operationalScoreAnchors(payload: OperationalContextPayload): string[] {
  const scores = payload.references.filter((r) => r.kind === "score");
  return scores.map((s) => `score:${s.id}=${s.value.toFixed(1)}`);
}

export function operationalRecommendationAnchors(payload: OperationalContextPayload): string[] {
  const recs = payload.references.filter((r) => r.kind === "recommendation").slice(0, 12);
  return recs.map((r) => `recommendation:${r.id} (gatilho ${r.trigger})`);
}
