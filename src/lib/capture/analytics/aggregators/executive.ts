/**
 * Agregações executivas e financeiras — MEDICFLOW-ANALYTICS-01.
 */
import { RISK_LEVELS } from "../../risk/types/risk-assessment";
import type { AnalyticsSessionRecord, ExecutiveKpis } from "../types";

function countByKey(
  records: AnalyticsSessionRecord[],
  keyFn: (r: AnalyticsSessionRecord) => string,
): Array<{ label: string; count: number }> {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = keyFn(r);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function estimatePotentialSavings(records: AnalyticsSessionRecord[]): number {
  let total = 0;
  for (const r of records) {
    const resolved = r.correctionAccepted + r.correctionEdited;
    if (resolved <= 0 || r.correctionTotal <= 0 || r.estimatedFinancialImpact <= 0) continue;
    const ratio = resolved / r.correctionTotal;
    total += r.estimatedFinancialImpact * ratio;
  }
  return Math.round(total * 100) / 100;
}

export function buildExecutiveKpis(records: AnalyticsSessionRecord[]): ExecutiveKpis {
  const inReview = records.filter(
    (r) =>
      r.approvalStatus === "em_revisao" ||
      r.approvalStatus === "aguardando_correcoes" ||
      r.queue === "aguardando_revisao" ||
      r.queue === "correcao",
  ).length;

  const riskDistribution: ExecutiveKpis["riskDistribution"] = RISK_LEVELS.map((level) => ({
    level,
    count: records.filter((r) => r.riskLevel === level).length,
  }));
  const unassessed = records.filter((r) => r.riskLevel == null).length;
  if (unassessed > 0) {
    riskDistribution.push({ level: "Não avaliado", count: unassessed });
  }

  return {
    totalGuidesProcessed: records.length,
    guidesByOperator: countByKey(
      records,
      (r) => r.operatorName ?? r.operatorAnsCode ?? "Não identificada",
    ),
    guidesByType: countByKey(records, (r) => r.guideType ?? "Não identificado"),
    guidesApproved: records.filter(
      (r) => r.approvalStatus === "aprovada" || r.queue === "aprovadas",
    ).length,
    guidesRejected: records.filter(
      (r) => r.approvalStatus === "reprovada" || r.queue === "reprovadas",
    ).length,
    guidesInReview: inReview,
    guidesCritical: records.filter((r) => r.isCritical).length,
    financialRiskImpact:
      Math.round(records.reduce((s, r) => s + r.estimatedFinancialImpact, 0) * 100) / 100,
    potentialSavingsFromCorrections: estimatePotentialSavings(records),
    riskDistribution,
  };
}
