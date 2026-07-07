/**
 * Tipos do módulo analítico — MEDICFLOW-ANALYTICS-01.
 * Indicadores determinísticos derivados exclusivamente do pipeline operacional.
 */
import type { ProcessingCenterFilters, ProcessingQueueId } from "../processing/types";
import type { ReviewApprovalStatus } from "../review/types";
import type { RiskLevel } from "../risk/types/risk-assessment";

export type AnalyticsFilters = ProcessingCenterFilters;

export type AnalyticsSessionRecord = {
  sessionId: string;
  sessionStatus: string;
  createdAt: string;
  updatedAt: string;
  queue: ProcessingQueueId;
  approvalStatus: ReviewApprovalStatus;
  operatorName: string | null;
  operatorAnsCode: string | null;
  guideType: string | null;
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  estimatedFinancialImpact: number;
  isCritical: boolean;
  ocrConfidence: number | null;
  parserConfidence: number | null;
  auditFindingsCount: number;
  auditBlockingCount: number;
  correctionAccepted: number;
  correctionEdited: number;
  correctionRejected: number;
  correctionPending: number;
  correctionTotal: number;
  reviewEnteredAt: string | null;
  reviewDurationMs: number | null;
  approvalDurationMs: number | null;
  glosaRuleHits: Array<{ ruleId: string; count: number }>;
};

export type CountRow = { label: string; count: number };

export type ExecutiveKpis = {
  totalGuidesProcessed: number;
  guidesByOperator: CountRow[];
  guidesByType: CountRow[];
  guidesApproved: number;
  guidesRejected: number;
  guidesInReview: number;
  guidesCritical: number;
  financialRiskImpact: number;
  potentialSavingsFromCorrections: number;
  riskDistribution: Array<{ level: RiskLevel | "Não avaliado"; count: number }>;
};

export type QualityIndicators = {
  topGlosaRules: Array<{ ruleId: string; count: number }>;
  topCorrectedFields: Array<{ field: string; count: number }>;
  suggestionAcceptanceRate: number | null;
  editRate: number | null;
  rejectionRate: number | null;
  ocrAccuracyAvg: number | null;
  parserAccuracyAvg: number | null;
  avgReviewTimeMs: number;
  avgApprovalTimeMs: number;
};

export type OperatorComparisonRow = {
  operator: string;
  guideCount: number;
  financialValue: number;
  avgRiskScore: number | null;
  topErrors: Array<{ ruleId: string; count: number }>;
  avgProcessingTimeMs: number;
  operationalRank: number;
};

export type TrendPoint = { dayKey: string; value: number };

export type AnalyticsTrends = {
  volume: TrendPoint[];
  risk: TrendPoint[];
  corrections: TrendPoint[];
  estimatedGlosasAvoided: TrendPoint[];
  productivity: TrendPoint[];
};

export type AnalyticsSnapshot = {
  asOf: string;
  filtersApplied: AnalyticsFilters;
  sessionCount: number;
  executive: ExecutiveKpis;
  quality: QualityIndicators;
  operators: OperatorComparisonRow[];
  trends: AnalyticsTrends;
};

export type AnalyticsQueryInput = {
  filters?: AnalyticsFilters;
  trendDays?: number;
};
