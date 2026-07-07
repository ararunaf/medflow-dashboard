/**
 * Indicadores de qualidade — MEDICFLOW-ANALYTICS-01.
 */
import type { LearningMetricsStore } from "../../learning/types/learning-record";
import type { AnalyticsSessionRecord, QualityIndicators } from "../types";

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function avgMs(values: Array<number | null>): number {
  const nums = values.filter((v): v is number => v != null && v > 0);
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function mergeRuleCounts(
  records: AnalyticsSessionRecord[],
): Array<{ ruleId: string; count: number }> {
  const map = new Map<string, number>();
  for (const r of records) {
    for (const hit of r.glosaRuleHits) {
      map.set(hit.ruleId, (map.get(hit.ruleId) ?? 0) + hit.count);
    }
  }
  return [...map.entries()]
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count);
}

function sessionCorrectionRates(records: AnalyticsSessionRecord[]): {
  acceptanceRate: number | null;
  editRate: number | null;
  rejectionRate: number | null;
} {
  let accepted = 0;
  let edited = 0;
  let rejected = 0;
  let decided = 0;

  for (const r of records) {
    accepted += r.correctionAccepted;
    edited += r.correctionEdited;
    rejected += r.correctionRejected;
    decided += r.correctionAccepted + r.correctionEdited + r.correctionRejected;
  }

  if (decided === 0) {
    return { acceptanceRate: null, editRate: null, rejectionRate: null };
  }

  return {
    acceptanceRate: Math.round((accepted / decided) * 1000) / 10,
    editRate: Math.round((edited / decided) * 1000) / 10,
    rejectionRate: Math.round((rejected / decided) * 1000) / 10,
  };
}

export function buildQualityIndicators(
  records: AnalyticsSessionRecord[],
  learningMetrics: LearningMetricsStore | null,
): QualityIndicators {
  const fromSessions = mergeRuleCounts(records);
  const fromLearning =
    learningMetrics?.byRule
      .map((r) => ({ ruleId: r.ruleId, count: r.usageCount }))
      .sort((a, b) => b.count - a.count) ?? [];

  const topGlosaRules =
    fromLearning.length > 0
      ? fromLearning.slice(0, 10)
      : fromSessions.slice(0, 10);

  const topCorrectedFields =
    learningMetrics?.byField
      .map((f) => ({ field: f.field, count: f.usageCount }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) ?? [];

  const sessionRates = sessionCorrectionRates(records);
  const hasLearning = learningMetrics != null && learningMetrics.totalRecords > 0;

  return {
    topGlosaRules,
    topCorrectedFields,
    suggestionAcceptanceRate: hasLearning
      ? Math.round(learningMetrics.globalAcceptanceRate * 1000) / 10
      : sessionRates.acceptanceRate,
    editRate: hasLearning
      ? Math.round(learningMetrics.globalEditRate * 1000) / 10
      : sessionRates.editRate,
    rejectionRate: hasLearning
      ? Math.round(learningMetrics.globalRejectRate * 1000) / 10
      : sessionRates.rejectionRate,
    ocrAccuracyAvg: avg(
      records.map((r) => r.ocrConfidence).filter((v): v is number => v != null),
    ),
    parserAccuracyAvg: avg(
      records.map((r) => r.parserConfidence).filter((v): v is number => v != null),
    ),
    avgReviewTimeMs: avgMs(records.map((r) => r.reviewDurationMs)),
    avgApprovalTimeMs: avgMs(records.map((r) => r.approvalDurationMs)),
  };
}
