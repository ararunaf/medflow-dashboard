/**
 * Comparativo por operadora — MEDICFLOW-ANALYTICS-01.
 */
import type { AnalyticsSessionRecord, OperatorComparisonRow } from "../types";

function operatorKey(r: AnalyticsSessionRecord): string {
  return r.operatorName ?? r.operatorAnsCode ?? "Não identificada";
}

function mergeErrors(
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
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function avgProcessingTimeMs(records: AnalyticsSessionRecord[]): number {
  let sum = 0;
  let count = 0;
  for (const r of records) {
    const created = Date.parse(r.createdAt);
    const updated = Date.parse(r.updatedAt);
    if (updated > created) {
      sum += updated - created;
      count += 1;
    }
  }
  return count > 0 ? Math.round(sum / count) : 0;
}

function avgRiskScore(records: AnalyticsSessionRecord[]): number | null {
  const scores = records.map((r) => r.riskScore).filter((v): v is number => v != null);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export function buildOperatorComparisons(
  records: AnalyticsSessionRecord[],
): OperatorComparisonRow[] {
  const byOperator = new Map<string, AnalyticsSessionRecord[]>();
  for (const r of records) {
    const key = operatorKey(r);
    const list = byOperator.get(key) ?? [];
    list.push(r);
    byOperator.set(key, list);
  }

  const rows: OperatorComparisonRow[] = [];
  for (const [operator, group] of byOperator.entries()) {
    rows.push({
      operator,
      guideCount: group.length,
      financialValue: Math.round(
        group.reduce((s, r) => s + r.estimatedFinancialImpact, 0) * 100,
      ) / 100,
      avgRiskScore: avgRiskScore(group),
      topErrors: mergeErrors(group),
      avgProcessingTimeMs: avgProcessingTimeMs(group),
      operationalRank: 0,
    });
  }

  rows.sort((a, b) => {
    if (b.guideCount !== a.guideCount) return b.guideCount - a.guideCount;
    return b.financialValue - a.financialValue;
  });

  return rows.map((row, index) => ({ ...row, operationalRank: index + 1 }));
}
