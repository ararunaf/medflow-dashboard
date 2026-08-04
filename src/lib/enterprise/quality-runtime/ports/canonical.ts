/**
 * Modelos canônicos estruturais do Enterprise Quality Runtime — F3-CAP-13.
 *
 * Foundation estrutural vendor-agnostic para consolidação futura da avaliação
 * de qualidade do pipeline documental.
 *
 * Sem avaliação automática. Sem score funcional. Sem decisão automática.
 * Sem IA. Sem OCR. Sem auditoria automática. Sem banco. Sem persistência. Sem APIs.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

import type { OCRResult } from "../../ocr-runtime/ports/canonical";
import type { DocumentClassificationResult } from "../../document-classification-runtime/ports/canonical";
import type { DocumentExtractionResult } from "../../document-extraction-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { CanonicalMappingResult } from "../../tiss-mapping-runtime/ports/canonical";
import type { AutoFillResult } from "../../auto-fill-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";
import type { AIOrchestrationContext } from "../../ai-orchestration-runtime/ports/canonical";

export type {
  OCRResult,
  DocumentClassificationResult,
  DocumentExtractionResult,
  ValidationResult,
  CanonicalMappingResult,
  AutoFillResult,
  AuditResult,
  AIOrchestrationContext,
};

/** Status estrutural de qualidade (F3-CAP-13). */
export type QualityStatus =
  | "pending"
  | "prepared"
  | "assessed"
  | "processed"
  | "failed"
  | "disabled"
  | "unknown"
  | (string & {});

/**
 * Kinds estruturais de métricas futuras (somente contratos).
 * Nenhuma métrica é calculada nesta sprint.
 */
export type QualityMetricKind =
  | "ocr-confidence"
  | "classification-quality"
  | "extraction-completeness"
  | "validation-consistency"
  | "mapping-quality"
  | "auto-fill-quality"
  | "xml-readiness"
  | "operator-readiness"
  | "human-review-need"
  | "overall-score"
  | (string & {});

/** Métrica canônica estrutural — nunca calculada. */
export type QualityMetric = {
  kind: "canonical-quality-metric";
  metricId: string;
  metricKind: QualityMetricKind;
  label?: string;
  status: QualityStatus;
  metricValueImplemented: false;
  qualityScoreImplemented: false;
  qualityEngineImplemented: false;
};

/** Score canônico estrutural — nunca funcional. */
export type QualityScore = {
  kind: "canonical-quality-score";
  scoreId: string;
  status: QualityStatus;
  label?: string;
  qualityScoreImplemented: false;
  qualityEngineImplemented: false;
  approvalDecisionImplemented: false;
};

/** Decisão canônica estrutural — nunca automática. */
export type QualityDecision = {
  kind: "canonical-quality-decision";
  decisionId: string;
  status: QualityStatus;
  label?: string;
  approvalDecisionImplemented: false;
  qualityEngineImplemented: false;
  qualityScoreImplemented: false;
};

/** Issue canônica estrutural — nunca produzida por motor real de qualidade. */
export type QualityIssue = {
  kind: "canonical-quality-issue";
  issueId: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "critical" | (string & {});
  message?: string;
  metricKind?: QualityMetricKind;
  status: QualityStatus;
  qualityEngineImplemented: false;
};

/**
 * QualityContext canônico (F3-CAP-13).
 *
 * Aceita exclusivamente por contrato:
 *   OCRResult + DocumentClassificationResult + DocumentExtractionResult +
 *   ValidationResult + CanonicalMappingResult + AutoFillResult +
 *   AuditResult + AIOrchestrationContext
 * — sem qualquer processamento.
 */
export type QualityContext = {
  kind: "canonical-quality-context";
  assessmentId?: string;
  resultId?: string;
  ocrResult?: OCRResult;
  classificationResult?: DocumentClassificationResult;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  mappingResult?: CanonicalMappingResult;
  autoFillResult?: AutoFillResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  structuralNotes?: string;
};

/**
 * Avaliação canônica estrutural de qualidade.
 * Nunca executa score / decisão / avaliação automática.
 */
export type QualityAssessment = {
  kind: "canonical-quality-assessment";
  assessmentId: string;
  status: QualityStatus;
  qualityContext?: QualityContext;
  metrics?: readonly QualityMetric[];
  score?: QualityScore;
  decision?: QualityDecision;
  issues?: readonly QualityIssue[];
  ocrResult?: OCRResult;
  classificationResult?: DocumentClassificationResult;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  mappingResult?: CanonicalMappingResult;
  autoFillResult?: AutoFillResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  qualityEngineImplemented: false;
  qualityScoreImplemented: false;
  ocrQualityImplemented: false;
  classificationQualityImplemented: false;
  extractionQualityImplemented: false;
  validationQualityImplemented: false;
  mappingQualityImplemented: false;
  autoFillQualityImplemented: false;
  auditQualityImplemented: false;
  approvalDecisionImplemented: false;
};

/** Operação canônica do Quality Runtime (F3-CAP-13). */
export type CanonicalQualityOperation =
  | "prepareQualityAssessment"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Resultado canônico de execução do Quality Runtime (F3-CAP-13).
 * Contém apenas referência/estrutura canônica — nunca avaliação funcional.
 */
export type QualityResult = {
  kind: "canonical-quality-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalQualityOperation;
  assessment?: QualityAssessment;
  metrics?: readonly QualityMetric[];
  score?: QualityScore;
  decision?: QualityDecision;
  issues?: readonly QualityIssue[];
  qualityContext?: QualityContext;
  ocrResult?: OCRResult;
  classificationResult?: DocumentClassificationResult;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  mappingResult?: CanonicalMappingResult;
  autoFillResult?: AutoFillResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  qualityEngineImplemented: false;
  qualityScoreImplemented: false;
  ocrQualityImplemented: false;
  classificationQualityImplemented: false;
  extractionQualityImplemented: false;
  validationQualityImplemented: false;
  mappingQualityImplemented: false;
  autoFillQualityImplemented: false;
  auditQualityImplemented: false;
  approvalDecisionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem avaliação real). */
  runtimeReady: true;
  status: QualityStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Quality Runtime (in-process). */
export type QualityStatistics = {
  kind: "canonical-quality-statistics";
  totalAssessments: number;
  preparedAssessments: number;
  totalResults: number;
  totalIssues: number;
  totalMetrics: number;
  qualityEngineImplementedCount: 0;
  qualityScoreImplementedCount: 0;
  ocrQualityImplementedCount: 0;
  classificationQualityImplementedCount: 0;
  extractionQualityImplementedCount: 0;
  validationQualityImplementedCount: 0;
  mappingQualityImplementedCount: 0;
  autoFillQualityImplementedCount: 0;
  auditQualityImplementedCount: 0;
  approvalDecisionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Quality Runtime. */
export type QualityHealth = {
  kind: "canonical-quality-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedAssessmentCount?: number;
  storedResultCount?: number;
  autoFillRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  aiOrchestrationRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  runtimeReady: true;
  qualityEngineImplemented: false;
  qualityScoreImplemented: false;
  ocrQualityImplemented: false;
  classificationQualityImplemented: false;
  extractionQualityImplemented: false;
  validationQualityImplemented: false;
  mappingQualityImplemented: false;
  autoFillQualityImplemented: false;
  auditQualityImplemented: false;
  approvalDecisionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Quality Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type QualityCapabilities = {
  kind: "canonical-quality-capabilities";
  supportsPrepareQualityAssessment: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalQuality: boolean;
  runtimeReady: true;
  qualityEngineImplemented: false;
  qualityScoreImplemented: false;
  ocrQualityImplemented: false;
  classificationQualityImplemented: false;
  extractionQualityImplemented: false;
  validationQualityImplemented: false;
  mappingQualityImplemented: false;
  autoFillQualityImplemented: false;
  auditQualityImplemented: false;
  approvalDecisionImplemented: false;
};

/** Helper estrutural — cria contrato de métrica desabilitado. */
export function createDisabledQualityMetric(
  metricKind: QualityMetricKind,
  label: string,
): QualityMetric {
  return {
    kind: "canonical-quality-metric",
    metricId: `disabled-${metricKind}`,
    metricKind,
    label,
    status: "disabled",
    metricValueImplemented: false,
    qualityScoreImplemented: false,
    qualityEngineImplemented: false,
  };
}

/** Helper estrutural — cria contrato de score desabilitado. */
export function createDisabledQualityScore(label = "Overall Score"): QualityScore {
  return {
    kind: "canonical-quality-score",
    scoreId: "disabled-overall-score",
    status: "disabled",
    label,
    qualityScoreImplemented: false,
    qualityEngineImplemented: false,
    approvalDecisionImplemented: false,
  };
}

/** Helper estrutural — cria contrato de decisão desabilitado. */
export function createDisabledQualityDecision(label = "Approval Decision"): QualityDecision {
  return {
    kind: "canonical-quality-decision",
    decisionId: "disabled-approval-decision",
    status: "disabled",
    label,
    approvalDecisionImplemented: false,
    qualityEngineImplemented: false,
    qualityScoreImplemented: false,
  };
}

/** Contratos estruturais das métricas futuras (somente declaração). */
export const STRUCTURAL_QUALITY_METRIC_KINDS: readonly QualityMetricKind[] = [
  "ocr-confidence",
  "classification-quality",
  "extraction-completeness",
  "validation-consistency",
  "mapping-quality",
  "auto-fill-quality",
  "xml-readiness",
  "operator-readiness",
  "human-review-need",
  "overall-score",
] as const;
