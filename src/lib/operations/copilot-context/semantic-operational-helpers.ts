import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import type { OperationalScoringResult } from "@/lib/operations/scoring/types";

export function pressureLabelPt(
  p: OperationalCommandCenterCore["widgets"]["operationalPressure"],
): string {
  if (p === "alta") return "Alta";
  if (p === "moderada") return "Moderada";
  return "Baixa";
}

export function urgencyLabelPt(u: OperationalCommandCenterCore["coordination"]["urgency"]): string {
  if (u === "critica") return "Crítica";
  if (u === "elevada") return "Elevada";
  return "Normal";
}

/** Tags semânticas discretas para classificação e futuros filtros (sem embedding). */
export function operationalSemanticTagsFromLiveState(input: {
  scoring: OperationalScoringResult;
  pressure: OperationalCommandCenterCore["widgets"]["operationalPressure"];
  urgency: OperationalCommandCenterCore["coordination"]["urgency"];
}): string[] {
  const tags = new Set<string>();
  tags.add(`health:${input.scoring.healthState}`);
  tags.add(`pressure:${input.pressure}`);
  tags.add(`urgency:${input.urgency}`);
  if (input.scoring.consolidatedRiskScore >= 52) tags.add("risk:elevated");
  if (input.scoring.consolidatedRiskScore >= 66) tags.add("risk:critical_band");
  for (const h of input.scoring.highlights) {
    const slug = h
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 48);
    if (slug) tags.add(`hl:${slug}`);
  }
  return [...tags].slice(0, 24);
}

export function fingerprintOperationalContext(input: {
  asOf: string;
  healthState: string;
  consolidatedRisk: number;
  alertRuleIds: string[];
  recommendationIds: string[];
  forecastProjection: string;
}): string {
  const s = [
    input.asOf,
    input.healthState,
    String(Math.round(input.consolidatedRisk * 10) / 10),
    input.forecastProjection,
    ...[...input.alertRuleIds].sort(),
    ...[...input.recommendationIds].sort(),
  ].join("|");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return `opctx_${(h >>> 0).toString(16)}`;
}
