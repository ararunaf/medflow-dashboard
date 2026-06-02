import type { OperationalRecommendation } from "@/lib/operations/recommendations/types";
import type { MitigationRoadmapCard, MitigationRoadmapPhase } from "./types";

const MAX_PHASES = 4;
const MAX_ACTIONS = 4;

/**
 * Constroi roadmap de mitigação supervisionado a partir do bundle atual de recomendações
 * (sem reavaliar históricos completos).
 */
export function buildMitigationRoadmapCard(input: {
  items: OperationalRecommendation[];
  horizonDays: number;
}): MitigationRoadmapCard {
  const mitigations = input.items
    .filter((i) => i.type === "mitigation" || i.type === "coordination")
    .sort((a, b) => {
      const rank = (s: OperationalRecommendation["state"]) =>
        s === "urgent" ? 0 : s === "recommended" ? 1 : 2;
      return rank(a.state) - rank(b.state);
    })
    .slice(0, 6);

  const phases: MitigationRoadmapPhase[] = [];
  let ordinal = 1;
  for (const rec of mitigations) {
    if (phases.length >= MAX_PHASES) break;
    const actions = (rec.mitigationPlan ?? rec.because.slice(0, 3))
      .filter(Boolean)
      .slice(0, MAX_ACTIONS);
    if (actions.length === 0) continue;
    phases.push({
      ordinal: ordinal++,
      title: rec.title.slice(0, 200),
      actions,
      linkedRecommendationIds: [rec.id],
    });
  }

  if (phases.length === 0) {
    phases.push({
      ordinal: 1,
      title: "Manter observação supervisionada",
      actions: [
        "Revisar painel de recomendações após próximo ciclo de feedback humano.",
        "Registrar evidências na memória operacional quando houver outcome.",
      ],
      linkedRecommendationIds: [],
    });
  }

  return {
    title: "Roadmap de mitigação (supervisionado)",
    horizonDays: input.horizonDays,
    phases,
  };
}
