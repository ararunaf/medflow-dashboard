/**
 * Adaptadores entre payloads de analytics e o motor de recomendações
 * (tipos estreitos para evitar ciclos de import com o loader de snapshot).
 */
import { buildOperationalForecastBaselineFromPeriodTrends } from "@/lib/operations/recommendations/forecast-baseline";
import { buildOperationalRecommendationBundleFromPeriodContext } from "@/lib/operations/recommendations/operational-recommendation-service";
import type { NumericTrendPoint } from "@/lib/operations/analytics/trend-adapters";
import type { KpiValueMap } from "@/lib/operations/analytics/kpi-aggregators";
import type { OperationalScoringResult } from "@/lib/operations/scoring/types";
import type { OperationalRecommendationBundle } from "@/lib/operations/recommendations/types";

export type AnalyticsRecommendationsInput = {
  asOf: string;
  kpis: KpiValueMap;
  scoring: OperationalScoringResult;
  miniCoverage: readonly NumericTrendPoint[];
  miniPressure: readonly NumericTrendPoint[];
};

export function operationalRecommendationsFromAnalyticsInput(
  input: AnalyticsRecommendationsInput,
): OperationalRecommendationBundle {
  const forecast = buildOperationalForecastBaselineFromPeriodTrends({
    asOf: input.asOf,
    miniCoverage: input.miniCoverage,
    miniPressure: input.miniPressure,
    scoring: input.scoring,
  });
  return buildOperationalRecommendationBundleFromPeriodContext({
    asOf: input.asOf,
    kpis: input.kpis,
    scoring: input.scoring,
    forecast,
  });
}
