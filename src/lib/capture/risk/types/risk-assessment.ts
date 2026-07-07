/**
 * Modelo RiskAssessment — Motor de Predição de Risco de Glosa.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01
 */
import type { AuditRuleCategory, AuditSeverity } from "../../audit/types/audit-rule";
import type { TissGuideType } from "../../parser/types/tiss-guide-type";

export const RISK_LEVELS = ["Baixo", "Médio", "Alto", "Crítico"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const CORRECTION_PRIORITIES = ["urgente", "alta", "media", "baixa"] as const;
export type CorrectionPriority = (typeof CORRECTION_PRIORITIES)[number];

export type RiskFactorContribution = {
  factorId: string;
  label: string;
  weight: number;
  rawValue: number;
  contribution: number;
  description: string;
};

export type FindingRiskScore = {
  ruleId: string;
  field: string;
  category: AuditRuleCategory;
  severity: AuditSeverity;
  riskScore: number;
  denialProbability: number;
  estimatedFinancialImpactCents: number;
  blocking: boolean;
  priority: CorrectionPriority;
  factors: RiskFactorContribution[];
};

export type CategoryRiskScore = {
  category: AuditRuleCategory;
  riskScore: number;
  findingCount: number;
  maxSeverity: AuditSeverity | null;
  estimatedFinancialImpactCents: number;
};

export type CorrectionPriorityItem = {
  rank: number;
  ruleId: string;
  field: string;
  message: string;
  priority: CorrectionPriority;
  riskScore: number;
  estimatedFinancialImpactCents: number;
};

/** Avaliação principal — campos mínimos exigidos pela sprint */
export type RiskAssessment = {
  assessmentId: string;
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  estimatedFinancialImpact: number;
  estimatedDenialProbability: number;
  blockingIssues: string[];
  topRiskFactors: RiskFactorContribution[];
  recommendations: string[];
};

export type RiskAssessmentSummaryMeta = {
  status: "pending" | "completed" | "failed";
  overallRiskScore?: number;
  overallRiskLevel?: RiskLevel;
  estimatedDenialProbability?: number;
  estimatedFinancialImpact?: number;
  blockingIssuesCount?: number;
  storagePath?: string;
  assessmentDurationMs?: number;
  error?: string;
};

/** Relatório persistido como risk_assessment.json */
export type RiskAssessmentReport = {
  version: "risk_assessment_v1";
  sessionId?: string;
  guideType: TissGuideType;
  assessedAt: string;
  engineVersion: string;
  operatorAnsCode: string | null;
  operatorName: string | null;
  contractId: string | null;
  parserConfidence: number;
  ocrConfidence: number;
  assessment: RiskAssessment;
  findingRisks: FindingRiskScore[];
  categoryRisks: CategoryRiskScore[];
  correctionPriorityRanking: CorrectionPriorityItem[];
  scoringBreakdown: RiskFactorContribution[];
};
