/**
 * Modelos canônicos estruturais do Enterprise Audit Runtime — F3-CAP-10.
 *
 * Foundation estrutural vendor-agnostic para auditoria futura de documentos
 * médicos, guias TISS e dados extraídos.
 *
 * Sem auditoria real. Sem IA. Sem OpenAI. Sem Azure OpenAI. Sem Gemini.
 * Sem Claude. Sem ML. Sem regras TISS. Sem regras de operadoras.
 * Sem justificativas automáticas. Sem correções automáticas.
 * Sem aprovação/rejeição automática. Sem persistência. Sem banco. Sem APIs.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

import type { DocumentClassificationContext } from "../../document-extraction-runtime/ports/canonical";
import type { DocumentExtractionResult } from "../../document-extraction-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { AIOrchestrationContext } from "../../ai-orchestration-runtime/ports/canonical";

export type {
  DocumentClassificationContext,
  DocumentExtractionResult,
  ValidationResult,
  AIOrchestrationContext,
};

/** Status estrutural de auditoria (F3-CAP-10). */
export type AuditStatus =
  | "pending"
  | "job-open"
  | "job-closed"
  | "submitted"
  | "registered"
  | "audited"
  | "processed"
  | "failed"
  | "disabled"
  | "unknown"
  | (string & {});

/** Tipos estruturais de auditoria futura — somente contratos. */
export type AuditTypeKind =
  | "technical"
  | "business"
  | "tiss"
  | "operator"
  | "quality"
  | "clinical"
  | "financial"
  | "compliance"
  | (string & {});

/** Contrato base estrutural de tipo de auditoria (sem execução). */
export type AuditTypeContract = {
  kind: "canonical-audit-type-contract";
  auditType: AuditTypeKind;
  status: AuditStatus;
  label?: string;
  auditEngineImplemented: false;
  businessRulesImplemented: false;
  tissAuditImplemented: false;
  operatorAuditImplemented: false;
  automaticAuditImplemented: false;
  auditSuggestionsImplemented: false;
  auditJustificationImplemented: false;
  auditScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** TechnicalAudit — contrato estrutural apenas. */
export type TechnicalAudit = AuditTypeContract & {
  auditType: "technical";
  structuralRole: "technical-audit";
};

/** BusinessAudit — contrato estrutural apenas. */
export type BusinessAudit = AuditTypeContract & {
  auditType: "business";
  structuralRole: "business-audit";
};

/** TISSAudit — contrato estrutural apenas. */
export type TISSAudit = AuditTypeContract & {
  auditType: "tiss";
  structuralRole: "tiss-audit";
};

/** OperatorAudit — contrato estrutural apenas. */
export type OperatorAudit = AuditTypeContract & {
  auditType: "operator";
  structuralRole: "operator-audit";
};

/** QualityAudit — contrato estrutural apenas. */
export type QualityAudit = AuditTypeContract & {
  auditType: "quality";
  structuralRole: "quality-audit";
};

/** ClinicalAudit — contrato estrutural apenas. */
export type ClinicalAudit = AuditTypeContract & {
  auditType: "clinical";
  structuralRole: "clinical-audit";
};

/** FinancialAudit — contrato estrutural apenas. */
export type FinancialAudit = AuditTypeContract & {
  auditType: "financial";
  structuralRole: "financial-audit";
};

/** ComplianceAudit — contrato estrutural apenas. */
export type ComplianceAudit = AuditTypeContract & {
  auditType: "compliance";
  structuralRole: "compliance-audit";
};

/** União estrutural dos contratos de tipos de auditoria. */
export type FutureAuditTypeContract =
  | TechnicalAudit
  | BusinessAudit
  | TISSAudit
  | OperatorAudit
  | QualityAudit
  | ClinicalAudit
  | FinancialAudit
  | ComplianceAudit;

/**
 * AuditContext canônico (F3-CAP-10).
 *
 * Capaz de receber futuramente DocumentClassificationContext +
 * DocumentExtractionResult + ValidationResult + AIOrchestrationContext —
 * sem qualquer processamento.
 */
export type AuditContext = {
  kind: "canonical-audit-context";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  auditTypes?: readonly FutureAuditTypeContract[];
  structuralNotes?: string;
};

/** Metadata canônica estrutural (F3-CAP-10). */
export type AuditMetadata = {
  kind: "canonical-audit-metadata";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  auditContext?: AuditContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

/** Issue canônica estrutural — nunca produzida por motor real. */
export type AuditIssue = {
  kind: "canonical-audit-issue";
  issueId: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "critical" | (string & {});
  message?: string;
  fieldPath?: string;
  auditType?: AuditTypeKind;
  status: AuditStatus;
  automaticAuditImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Finding canônica estrutural — nunca produzida por motor real. */
export type AuditFinding = {
  kind: "canonical-audit-finding";
  findingId: string;
  jobId?: string;
  requestId?: string;
  status: AuditStatus;
  auditType?: AuditTypeKind;
  issues?: readonly AuditIssue[];
  metadata?: AuditMetadata;
  auditContext?: AuditContext;
  createdAt: string;
  updatedAt: string;
  auditEngineImplemented: false;
  automaticAuditImplemented: false;
  auditSuggestionsImplemented: false;
  tissAuditImplemented: false;
  operatorAuditImplemented: false;
};

/** Recommendation canônica estrutural — nunca gerada automaticamente. */
export type AuditRecommendation = {
  kind: "canonical-audit-recommendation";
  recommendationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: AuditStatus;
  auditSuggestionsImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Justification canônica estrutural — nunca gerada automaticamente. */
export type AuditJustification = {
  kind: "canonical-audit-justification";
  justificationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: AuditStatus;
  auditJustificationImplemented: false;
};

/** Score canônico estrutural — nunca calculado. */
export type AuditScore = {
  kind: "canonical-audit-score";
  scoreId: string;
  value?: number | null;
  band?: "unknown" | "low" | "medium" | "high" | (string & {});
  status: AuditStatus;
  auditScoreImplemented: false;
};

/** Summary canônico estrutural. */
export type AuditSummary = {
  kind: "canonical-audit-summary";
  summaryId: string;
  totalFindings?: number;
  totalIssues?: number;
  totalRecommendations?: number;
  status: AuditStatus;
  message?: string;
  auditEngineImplemented: false;
  automaticAuditImplemented: false;
};

/** Request canônico estrutural de auditoria (AuditRequest). Nunca dispara auditoria. */
export type AuditRequest = {
  kind: "canonical-audit-request";
  requestId: string;
  jobId?: string;
  findingId?: string;
  status: AuditStatus;
  metadata?: AuditMetadata;
  auditContext?: AuditContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  auditEngineImplemented: false;
  businessRulesImplemented: false;
  tissAuditImplemented: false;
  operatorAuditImplemented: false;
  automaticAuditImplemented: false;
  auditSuggestionsImplemented: false;
  auditJustificationImplemented: false;
  auditScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Job canônico estrutural de auditoria. */
export type AuditJob = {
  kind: "canonical-audit-job";
  jobId: string;
  status: AuditStatus;
  identity?: {
    kind: "canonical-audit-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: AuditMetadata;
  auditContext?: AuditContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  auditEngineImplemented: false;
  businessRulesImplemented: false;
  tissAuditImplemented: false;
  operatorAuditImplemented: false;
  automaticAuditImplemented: false;
  auditSuggestionsImplemented: false;
  auditJustificationImplemented: false;
  auditScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Operação canônica do Audit Runtime (F3-CAP-10). */
export type CanonicalAuditOperation =
  | "openJob"
  | "closeJob"
  | "submitRequest"
  | "registerFinding"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Resultado canônico de execução do Audit Runtime (F3-CAP-10).
 * Contém apenas referência/estrutura canônica — nunca auditoria real.
 */
export type AuditResult = {
  kind: "canonical-audit-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalAuditOperation;
  job?: AuditJob;
  request?: AuditRequest;
  finding?: AuditFinding;
  issues?: readonly AuditIssue[];
  recommendations?: readonly AuditRecommendation[];
  justification?: AuditJustification;
  score?: AuditScore;
  summary?: AuditSummary;
  metadata?: AuditMetadata;
  auditContext?: AuditContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  auditEngineImplemented: false;
  businessRulesImplemented: false;
  tissAuditImplemented: false;
  operatorAuditImplemented: false;
  automaticAuditImplemented: false;
  auditSuggestionsImplemented: false;
  auditJustificationImplemented: false;
  auditScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem auditoria real). */
  runtimeReady: true;
  status: AuditStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Audit Runtime (in-process). */
export type AuditStatistics = {
  kind: "canonical-audit-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalFindings: number;
  totalResults: number;
  auditEngineImplementedCount: 0;
  businessRulesImplementedCount: 0;
  tissAuditImplementedCount: 0;
  operatorAuditImplementedCount: 0;
  automaticAuditImplementedCount: 0;
  auditSuggestionsImplementedCount: 0;
  auditJustificationImplementedCount: 0;
  auditScoreImplementedCount: 0;
  complianceImplementedCount: 0;
  automaticCorrectionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Audit Runtime. */
export type AuditHealth = {
  kind: "canonical-audit-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
  aiOrchestrationRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  runtimeReady: true;
  auditEngineImplemented: false;
  businessRulesImplemented: false;
  tissAuditImplemented: false;
  operatorAuditImplemented: false;
  automaticAuditImplemented: false;
  auditSuggestionsImplemented: false;
  auditJustificationImplemented: false;
  auditScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Audit Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AuditCapabilities = {
  kind: "canonical-audit-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalAudit: boolean;
  runtimeReady: true;
  auditEngineImplemented: false;
  businessRulesImplemented: false;
  tissAuditImplemented: false;
  operatorAuditImplemented: false;
  automaticAuditImplemented: false;
  auditSuggestionsImplemented: false;
  auditJustificationImplemented: false;
  auditScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Helper estrutural — cria contrato de tipo de auditoria desabilitado. */
export function createDisabledAuditTypeContract(
  auditType: AuditTypeKind,
  label: string,
): AuditTypeContract {
  return {
    kind: "canonical-audit-type-contract",
    auditType,
    status: "disabled",
    label,
    auditEngineImplemented: false,
    businessRulesImplemented: false,
    tissAuditImplemented: false,
    operatorAuditImplemented: false,
    automaticAuditImplemented: false,
    auditSuggestionsImplemented: false,
    auditJustificationImplemented: false,
    auditScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}
