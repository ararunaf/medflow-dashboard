/**
 * Motor de Predição de Risco de Glosa — exports públicos.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01
 */
export type {
  RiskLevel,
  CorrectionPriority,
  RiskFactorContribution,
  FindingRiskScore,
  CategoryRiskScore,
  CorrectionPriorityItem,
  RiskAssessment,
  RiskAssessmentSummaryMeta,
  RiskAssessmentReport,
} from "./types/risk-assessment";

export {
  DEFAULT_RISK_SCORING_WEIGHTS,
  SEVERITY_BASE_WEIGHTS,
  CATEGORY_SCORE_CAPS,
  classifyRiskLevel,
  type RiskScoringWeights,
} from "./types/scoring-config";

export {
  GlosaRiskEngine,
  GLOSA_RISK_ENGINE_VERSION,
  getDefaultGlosaRiskEngine,
  assessGlosaRisk,
  type GlosaRiskEngineOptions,
  type GlosaRiskEngineResult,
} from "./engine/glosa-risk-engine";

export { scoreGlosaRisk, type RiskScorerInput, type RiskScorerResult } from "./engine/risk-scorer";

export {
  buildRiskDashboardView,
  extractTopRiskCauses,
  type RiskDashboardView,
  type RiskSessionSummary,
  type RiskCauseCount,
} from "./engine/risk-dashboard";

export {
  RISK_ASSESSMENT_FILENAME,
  buildRiskAssessmentStoragePath,
  persistRiskAssessmentReport,
  loadRiskAssessmentReport,
  getRiskAssessmentSignedUrl,
  buildRiskAssessmentSummaryFromResult,
} from "./infrastructure/risk-storage";

export {
  GlosaRiskService,
  getDefaultGlosaRiskService,
  runCaptureGlosaRisk,
  getCaptureRiskAssessmentReport,
  getCaptureRiskDashboard,
  type RunGlosaRiskResult,
} from "./services/glosa-risk-service";
