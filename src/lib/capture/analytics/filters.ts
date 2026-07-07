/**
 * Filtros analíticos — reutiliza semântica do Centro de Processamento.
 * MEDICFLOW-ANALYTICS-01
 */
import { applyProcessingFilters } from "../processing/filters";
import type { ProcessingGuideItem } from "../processing/types";
import type { AnalyticsFilters, AnalyticsSessionRecord } from "./types";

/** Adapta registro analítico para filtros compartilhados do processamento. */
function toProcessingGuideItem(record: AnalyticsSessionRecord): ProcessingGuideItem {
  return {
    sessionId: record.sessionId,
    filename: null,
    queue: record.queue,
    status: record.sessionStatus as ProcessingGuideItem["status"],
    approvalStatus: record.approvalStatus,
    operatorName: record.operatorName,
    operatorAnsCode: record.operatorAnsCode,
    guideType: record.guideType,
    riskLevel: record.riskLevel,
    riskScore: record.riskScore,
    estimatedFinancialImpact: record.estimatedFinancialImpact,
    contractualPriority: 0,
    waitTimeMs: 0,
    responsibleProfileId: null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    priorityScore: 0,
    isCritical: record.isCritical,
  };
}

export function applyAnalyticsFilters(
  records: AnalyticsSessionRecord[],
  filters?: AnalyticsFilters,
): AnalyticsSessionRecord[] {
  if (!filters || Object.keys(filters).length === 0) return records;
  const items = records.map(toProcessingGuideItem);
  const filtered = applyProcessingFilters(items, filters);
  const ids = new Set(filtered.map((i) => i.sessionId));
  return records.filter((r) => ids.has(r.sessionId));
}
