/**
 * RiskDashboard — agregação de métricas de risco por tenant.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01
 */
import type { RiskLevel } from "../types/risk-assessment";

export type RiskSessionSummary = {
  sessionId: string;
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  estimatedDenialProbability: number;
  estimatedFinancialImpact: number;
  guideType: string;
  operatorAnsCode: string | null;
  operatorName: string | null;
  topRiskFactorId: string | null;
  assessedAt: string;
};

export type RiskCauseCount = {
  factorId: string;
  label: string;
  count: number;
  totalContribution: number;
};

export type RiskDashboardView = {
  version: "risk_dashboard_v1";
  computedAt: string;
  totalAssessed: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  byOperator: Array<{ operator: string; count: number; avgRiskScore: number }>;
  byGuideType: Array<{ guideType: string; count: number; avgRiskScore: number }>;
  topRiskCauses: RiskCauseCount[];
  recentSessions: RiskSessionSummary[];
};

function aggregateByKey(
  sessions: RiskSessionSummary[],
  keyFn: (s: RiskSessionSummary) => string,
): Array<{ key: string; count: number; avgRiskScore: number }> {
  const map = new Map<string, { count: number; totalScore: number }>();
  for (const s of sessions) {
    const key = keyFn(s);
    const existing = map.get(key) ?? { count: 0, totalScore: 0 };
    map.set(key, {
      count: existing.count + 1,
      totalScore: existing.totalScore + s.overallRiskScore,
    });
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      count: v.count,
      avgRiskScore: Math.round(v.totalScore / v.count),
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildRiskDashboardView(
  sessions: RiskSessionSummary[],
  topCauses: RiskCauseCount[],
): RiskDashboardView {
  const levelCount = (level: RiskLevel) =>
    sessions.filter((s) => s.overallRiskLevel === level).length;

  const byOperator = aggregateByKey(
    sessions,
    (s) => s.operatorName ?? s.operatorAnsCode ?? "Não identificada",
  ).map((item) => ({
    operator: item.key,
    count: item.count,
    avgRiskScore: item.avgRiskScore,
  }));

  const byGuideType = aggregateByKey(sessions, (s) => s.guideType).map((item) => ({
    guideType: item.key,
    count: item.count,
    avgRiskScore: item.avgRiskScore,
  }));

  return {
    version: "risk_dashboard_v1",
    computedAt: new Date().toISOString(),
    totalAssessed: sessions.length,
    criticalCount: levelCount("Crítico"),
    highCount: levelCount("Alto"),
    mediumCount: levelCount("Médio"),
    lowCount: levelCount("Baixo"),
    byOperator,
    byGuideType,
    topRiskCauses: topCauses.slice(0, 10),
    recentSessions: [...sessions]
      .sort((a, b) => b.assessedAt.localeCompare(a.assessedAt))
      .slice(0, 20),
  };
}

export function extractTopRiskCauses(
  sessions: Array<{ topRiskFactorId: string | null; topRiskFactorLabel?: string }>,
  contributions: Array<{ factorId: string; label: string; contribution: number }>,
): RiskCauseCount[] {
  const causeMap = new Map<string, RiskCauseCount>();

  for (const c of contributions) {
    const existing = causeMap.get(c.factorId) ?? {
      factorId: c.factorId,
      label: c.label,
      count: 0,
      totalContribution: 0,
    };
    causeMap.set(c.factorId, {
      ...existing,
      count: existing.count + 1,
      totalContribution: existing.totalContribution + c.contribution,
    });
  }

  return [...causeMap.values()].sort((a, b) => b.totalContribution - a.totalContribution);
}
