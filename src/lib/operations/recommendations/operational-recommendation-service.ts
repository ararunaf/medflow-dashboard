import { buildOperationalForecastBaselineLive } from "@/lib/operations/recommendations/forecast-baseline";
import {
  collectLiveWindowRecommendations,
  collectPeriodRecommendations,
  operationalAlertsByRuleId,
} from "@/lib/operations/recommendations/recommendation-evaluators";
import { OPERATIONAL_RECOMMENDATION_REGISTRY } from "@/lib/operations/recommendations/recommendation-registry";
import type { OperationalAlert } from "@/lib/operations/alerts/types";
import type { KpiValueMap } from "@/lib/operations/analytics/kpi-aggregators";
import type { AlertSeverityCounts, OperationalScoringResult } from "@/lib/operations/scoring/types";
import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import type {
  OperationalForecastBaseline,
  OperationalRecommendation,
  OperationalRecommendationBundle,
  OperationalRecommendationState,
  OperationalRecommendationSummary,
  OperationalRecommendationTrigger,
  OperationalRecommendationType,
} from "@/lib/operations/recommendations/types";

const STATE_RANK: Record<OperationalRecommendationState, number> = {
  suggested: 0,
  recommended: 1,
  urgent: 2,
};

function sortRecommendations(items: OperationalRecommendation[]): OperationalRecommendation[] {
  return [...items].sort((a, b) => {
    const byState = STATE_RANK[b.state] - STATE_RANK[a.state];
    if (byState !== 0) return byState;
    const wa = OPERATIONAL_RECOMMENDATION_REGISTRY[a.trigger].sortWeight;
    const wb = OPERATIONAL_RECOMMENDATION_REGISTRY[b.trigger].sortWeight;
    if (wb !== wa) return wb - wa;
    return a.id.localeCompare(b.id, "pt-BR");
  });
}

function emptyCountsByState(): Record<OperationalRecommendationState, number> {
  return { suggested: 0, recommended: 0, urgent: 0 };
}

function emptyCountsByType(): Record<OperationalRecommendationType, number> {
  return {
    mitigation: 0,
    coordination: 0,
    staffing: 0,
    escalation: 0,
    monitoring: 0,
  };
}

export function buildOperationalRecommendationSummary(
  items: OperationalRecommendation[],
): OperationalRecommendationSummary {
  const countsByState = emptyCountsByState();
  const countsByType = emptyCountsByType();
  for (const it of items) {
    countsByState[it.state] += 1;
    countsByType[it.type] += 1;
  }

  const urgentMit = items.find((i) => i.type === "mitigation" && i.state === "urgent");
  const mit = items.find((i) => i.type === "mitigation");
  const topMitigationId = urgentMit?.id ?? mit?.id ?? null;

  let headline = "Operação dentro da faixa esperada para as regras atuais.";
  if (countsByState.urgent > 0) {
    headline = `${countsByState.urgent} recomendação(ões) urgente(s) — priorizar mitigação e coordenação.`;
  } else if (countsByState.recommended > 0) {
    headline = `${countsByState.recommended} recomendação(ões) prioritária(s) sugeridas para esta janela.`;
  } else if (countsByState.suggested > 0) {
    headline = `${countsByState.suggested} sugestão(ões) operacional(is) para revisão leve.`;
  }

  return {
    headline,
    topMitigationId,
    countsByState,
    countsByType,
  };
}

function finalizeBundle(
  forecast: OperationalForecastBaseline,
  rawItems: OperationalRecommendation[],
  computedAt: string,
): OperationalRecommendationBundle {
  const items = sortRecommendations(rawItems);
  return {
    computedAt,
    forecast,
    summary: buildOperationalRecommendationSummary(items),
    items,
  };
}

/** Uma passada por snapshot do command center — sem loops nem I/O adicional. */
export function buildOperationalRecommendationBundleFromCommandCenter(input: {
  core: OperationalCommandCenterCore;
  scoring: OperationalScoringResult;
  alerts: readonly OperationalAlert[];
  alertCounts: AlertSeverityCounts;
}): OperationalRecommendationBundle {
  const forecast = buildOperationalForecastBaselineLive({
    core: input.core,
    scoring: input.scoring,
    alertCounts: input.alertCounts,
  });
  const items = collectLiveWindowRecommendations({
    core: input.core,
    scoring: input.scoring,
    alertsById: operationalAlertsByRuleId(input.alerts),
    forecast,
  });
  return finalizeBundle(forecast, items, input.core.asOf);
}

/** Baseline + recomendações para o período do analytics (KPIs + scoring já materializados). */
export function buildOperationalRecommendationBundleFromPeriodContext(input: {
  asOf: string;
  kpis: KpiValueMap;
  scoring: OperationalScoringResult;
  forecast: OperationalForecastBaseline;
}): OperationalRecommendationBundle {
  const items = collectPeriodRecommendations({
    asOf: input.asOf,
    kpis: input.kpis,
    scoring: input.scoring,
    forecast: input.forecast,
  });
  return finalizeBundle(input.forecast, items, input.asOf);
}
