/**
 * Módulo analítico — MEDICFLOW-ANALYTICS-01
 */
export type {
  AnalyticsFilters,
  AnalyticsQueryInput,
  AnalyticsSessionRecord,
  AnalyticsSnapshot,
  AnalyticsTrends,
  ExecutiveKpis,
  OperatorComparisonRow,
  QualityIndicators,
  TrendPoint,
} from "./types";

export {
  AnalyticsEngine,
  getDefaultAnalyticsEngine,
  loadAnalyticsSnapshot,
} from "./analytics-engine";

export { applyAnalyticsFilters } from "./filters";
export { mapSessionToAnalyticsRecord } from "./session-record";
export { buildExecutiveKpis } from "./aggregators/executive";
export { buildQualityIndicators } from "./aggregators/quality";
export { buildOperatorComparisons } from "./aggregators/operators";
export { buildAnalyticsTrends } from "./aggregators/trends";
export { buildAnalyticsExportSections, buildAnalyticsSummaryCsvRows } from "./export-builder";
