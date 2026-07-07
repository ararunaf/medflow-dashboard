/**
 * GlosaRiskEngine — Motor de Predição de Risco de Glosa.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01
 *
 * Consumo: StructuredGuide + AuditReport + ContractIntelligenceReport + LearningMetrics.
 * Totalmente determinístico — sem IA generativa.
 */
import type { AuditReport } from "../../audit/types/audit-report";
import type { ContractIntelligenceReport } from "../../contract/types/contract-intelligence-report";
import type { LearningMetricsStore } from "../../learning/types/learning-record";
import type { StructuredGuide } from "../../parser/types/structured-guide";
import type { RiskAssessmentReport } from "../types/risk-assessment";
import { scoreGlosaRisk, type RiskScorerInput } from "./risk-scorer";

export const GLOSA_RISK_ENGINE_VERSION = "glosa_risk_engine_v1";

export type GlosaRiskEngineOptions = {
  sessionId?: string;
  tenantId?: string;
  learningMetrics?: LearningMetricsStore | null;
  weights?: RiskScorerInput["weights"];
};

export type GlosaRiskEngineResult = {
  report: RiskAssessmentReport;
};

export class GlosaRiskEngine {
  assess(
    guide: StructuredGuide,
    auditReport: AuditReport,
    contractReport: ContractIntelligenceReport,
    options: GlosaRiskEngineOptions = {},
  ): GlosaRiskEngineResult {
    const scorerResult = scoreGlosaRisk({
      guide,
      findings: auditReport.findings,
      enrichedFindings: contractReport.findings,
      operatorResolved: contractReport.summary.operatorResolved,
      operatorAnsCode: contractReport.context.operator.ansCode,
      learningMetrics: options.learningMetrics ?? null,
      weights: options.weights,
    });

    const report: RiskAssessmentReport = {
      version: "risk_assessment_v1",
      sessionId: options.sessionId,
      guideType: guide.guideType,
      assessedAt: new Date().toISOString(),
      engineVersion: GLOSA_RISK_ENGINE_VERSION,
      operatorAnsCode: contractReport.context.operator.ansCode,
      operatorName: contractReport.context.operator.name,
      contractId: contractReport.context.contract.contractId,
      parserConfidence: guide.metadata.overallConfidence,
      ocrConfidence: guide.metadata.ocrAverageConfidence,
      assessment: scorerResult.assessment,
      findingRisks: scorerResult.findingRisks,
      categoryRisks: scorerResult.categoryRisks,
      correctionPriorityRanking: scorerResult.correctionPriorityRanking,
      scoringBreakdown: scorerResult.scoringBreakdown,
    };

    return { report };
  }
}

let defaultEngine: GlosaRiskEngine | null = null;

export function getDefaultGlosaRiskEngine(): GlosaRiskEngine {
  if (!defaultEngine) defaultEngine = new GlosaRiskEngine();
  return defaultEngine;
}

export function assessGlosaRisk(
  guide: StructuredGuide,
  auditReport: AuditReport,
  contractReport: ContractIntelligenceReport,
  options?: GlosaRiskEngineOptions,
): GlosaRiskEngineResult {
  return getDefaultGlosaRiskEngine().assess(guide, auditReport, contractReport, options);
}
