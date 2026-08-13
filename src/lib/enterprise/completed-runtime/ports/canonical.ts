/**
 * Modelos canônicos estruturais do Enterprise Completed Runtime — A10-02.
 *
 * Foundation estrutural vendor-agnostic para completedoria futura de documentos
 * médicos, guias TISS e dados extraídos.
 *
 * Sem completedoria real. Sem IA. Sem OpenAI. Sem Azure OpenAI. Sem Gemini.
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

/** Status estrutural de completedoria (A10-02). */
export type CompletedStatus =
  | "pending"
  | "job-open"
  | "job-closed"
  | "submitted"
  | "registered"
  | "completed"
  | "processed"
  | "failed"
  | "disabled"
  | "unknown"
  | (string & {});

/** Tipos estruturais de completedoria futura — somente contratos. */
export type CompletedTypeKind =
  | "technical"
  | "business"
  | "tiss"
  | "operator"
  | "quality"
  | "clinical"
  | "financial"
  | "compliance"
  | (string & {});

/** Contrato base estrutural de tipo de completedoria (sem execução). */
export type CompletedTypeContract = {
  kind: "canonical-completed-type-contract";
  completedType: CompletedTypeKind;
  status: CompletedStatus;
  label?: string;
  completedEngineImplemented: false;
  businessRulesImplemented: false;
  tissCompletedImplemented: false;
  operatorCompletedImplemented: false;
  automaticCompletedImplemented: false;
  completedSuggestionsImplemented: false;
  completedJustificationImplemented: false;
  completedScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** TechnicalCompleted — contrato estrutural apenas. */
export type TechnicalCompleted = CompletedTypeContract & {
  completedType: "technical";
  structuralRole: "technical-completed";
};

/** BusinessCompleted — contrato estrutural apenas. */
export type BusinessCompleted = CompletedTypeContract & {
  completedType: "business";
  structuralRole: "business-completed";
};

/** TISSCompleted — contrato estrutural apenas. */
export type TISSCompleted = CompletedTypeContract & {
  completedType: "tiss";
  structuralRole: "tiss-completed";
};

/** OperatorCompleted — contrato estrutural apenas. */
export type OperatorCompleted = CompletedTypeContract & {
  completedType: "operator";
  structuralRole: "operator-completed";
};

/** QualityCompleted — contrato estrutural apenas. */
export type QualityCompleted = CompletedTypeContract & {
  completedType: "quality";
  structuralRole: "quality-completed";
};

/** ClinicalCompleted — contrato estrutural apenas. */
export type ClinicalCompleted = CompletedTypeContract & {
  completedType: "clinical";
  structuralRole: "clinical-completed";
};

/** FinancialCompleted — contrato estrutural apenas. */
export type FinancialCompleted = CompletedTypeContract & {
  completedType: "financial";
  structuralRole: "financial-completed";
};

/** ComplianceCompleted — contrato estrutural apenas. */
export type ComplianceCompleted = CompletedTypeContract & {
  completedType: "compliance";
  structuralRole: "compliance-completed";
};

/** União estrutural dos contratos de tipos de completedoria. */
export type FutureCompletedTypeContract =
  | TechnicalCompleted
  | BusinessCompleted
  | TISSCompleted
  | OperatorCompleted
  | QualityCompleted
  | ClinicalCompleted
  | FinancialCompleted
  | ComplianceCompleted;

/**
 * CompletedContext canônico (A10-02).
 *
 * Capaz de receber futuramente DocumentClassificationContext +
 * DocumentExtractionResult + ValidationResult + AIOrchestrationContext —
 * sem qualquer processamento.
 */
export type CompletedContext = {
  kind: "canonical-completed-context";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  completedTypes?: readonly FutureCompletedTypeContract[];
  structuralNotes?: string;
};

/** Metadata canônica estrutural (A10-02). */
export type CompletedMetadata = {
  kind: "canonical-completed-metadata";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  completedContext?: CompletedContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

/** Issue canônica estrutural — nunca produzida por motor real. */
export type CompletedIssue = {
  kind: "canonical-completed-issue";
  issueId: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "critical" | (string & {});
  message?: string;
  fieldPath?: string;
  completedType?: CompletedTypeKind;
  status: CompletedStatus;
  automaticCompletedImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Finding canônica estrutural — nunca produzida por motor real. */
export type CompletedFinding = {
  kind: "canonical-completed-finding";
  findingId: string;
  jobId?: string;
  requestId?: string;
  status: CompletedStatus;
  completedType?: CompletedTypeKind;
  issues?: readonly CompletedIssue[];
  metadata?: CompletedMetadata;
  completedContext?: CompletedContext;
  createdAt: string;
  updatedAt: string;
  completedEngineImplemented: false;
  automaticCompletedImplemented: false;
  completedSuggestionsImplemented: false;
  tissCompletedImplemented: false;
  operatorCompletedImplemented: false;
};

/** Recommendation canônica estrutural — nunca gerada automaticamente. */
export type CompletedRecommendation = {
  kind: "canonical-completed-recommendation";
  recommendationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: CompletedStatus;
  completedSuggestionsImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Justification canônica estrutural — nunca gerada automaticamente. */
export type CompletedJustification = {
  kind: "canonical-completed-justification";
  justificationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: CompletedStatus;
  completedJustificationImplemented: false;
};

/** Score canônico estrutural — nunca calculado. */
export type CompletedScore = {
  kind: "canonical-completed-score";
  scoreId: string;
  value?: number | null;
  band?: "unknown" | "low" | "medium" | "high" | (string & {});
  status: CompletedStatus;
  completedScoreImplemented: false;
};

/** Summary canônico estrutural. */
export type CompletedSummary = {
  kind: "canonical-completed-summary";
  summaryId: string;
  totalFindings?: number;
  totalIssues?: number;
  totalRecommendations?: number;
  status: CompletedStatus;
  message?: string;
  completedEngineImplemented: false;
  automaticCompletedImplemented: false;
};

/** Request canônico estrutural de completedoria (CompletedRequest). Nunca dispara completedoria. */
export type CompletedRequest = {
  kind: "canonical-completed-request";
  requestId: string;
  jobId?: string;
  findingId?: string;
  status: CompletedStatus;
  metadata?: CompletedMetadata;
  completedContext?: CompletedContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  completedEngineImplemented: false;
  businessRulesImplemented: false;
  tissCompletedImplemented: false;
  operatorCompletedImplemented: false;
  automaticCompletedImplemented: false;
  completedSuggestionsImplemented: false;
  completedJustificationImplemented: false;
  completedScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Job canônico estrutural de completedoria. */
export type CompletedJob = {
  kind: "canonical-completed-job";
  jobId: string;
  status: CompletedStatus;
  identity?: {
    kind: "canonical-completed-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: CompletedMetadata;
  completedContext?: CompletedContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  completedEngineImplemented: false;
  businessRulesImplemented: false;
  tissCompletedImplemented: false;
  operatorCompletedImplemented: false;
  automaticCompletedImplemented: false;
  completedSuggestionsImplemented: false;
  completedJustificationImplemented: false;
  completedScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Operação canônica do Completed Runtime (A10-02). */
export type CanonicalCompletedOperation =
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
 * Resultado canônico de execução do Completed Runtime (A10-02).
 * Contém apenas referência/estrutura canônica — nunca completedoria real.
 */
export type CompletedResult = {
  kind: "canonical-completed-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalCompletedOperation;
  job?: CompletedJob;
  request?: CompletedRequest;
  finding?: CompletedFinding;
  issues?: readonly CompletedIssue[];
  recommendations?: readonly CompletedRecommendation[];
  justification?: CompletedJustification;
  score?: CompletedScore;
  summary?: CompletedSummary;
  metadata?: CompletedMetadata;
  completedContext?: CompletedContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  completedEngineImplemented: false;
  businessRulesImplemented: false;
  tissCompletedImplemented: false;
  operatorCompletedImplemented: false;
  automaticCompletedImplemented: false;
  completedSuggestionsImplemented: false;
  completedJustificationImplemented: false;
  completedScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem completedoria real). */
  runtimeReady: true;
  status: CompletedStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Completed Runtime (in-process). */
export type CompletedStatistics = {
  kind: "canonical-completed-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalFindings: number;
  totalResults: number;
  completedEngineImplementedCount: 0;
  businessRulesImplementedCount: 0;
  tissCompletedImplementedCount: 0;
  operatorCompletedImplementedCount: 0;
  automaticCompletedImplementedCount: 0;
  completedSuggestionsImplementedCount: 0;
  completedJustificationImplementedCount: 0;
  completedScoreImplementedCount: 0;
  complianceImplementedCount: 0;
  automaticCorrectionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Completed Runtime. */
export type CompletedHealth = {
  kind: "canonical-completed-health";
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
  completedEngineImplemented: false;
  businessRulesImplemented: false;
  tissCompletedImplemented: false;
  operatorCompletedImplemented: false;
  automaticCompletedImplemented: false;
  completedSuggestionsImplemented: false;
  completedJustificationImplemented: false;
  completedScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Completed Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type CompletedCapabilities = {
  kind: "canonical-completed-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalCompleted: boolean;
  runtimeReady: true;
  completedEngineImplemented: false;
  businessRulesImplemented: false;
  tissCompletedImplemented: false;
  operatorCompletedImplemented: false;
  automaticCompletedImplemented: false;
  completedSuggestionsImplemented: false;
  completedJustificationImplemented: false;
  completedScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Helper estrutural — cria contrato de tipo de completedoria desabilitado. */
export function createDisabledCompletedTypeContract(
  completedType: CompletedTypeKind,
  label: string,
): CompletedTypeContract {
  return {
    kind: "canonical-completed-type-contract",
    completedType,
    status: "disabled",
    label,
    completedEngineImplemented: false,
    businessRulesImplemented: false,
    tissCompletedImplemented: false,
    operatorCompletedImplemented: false,
    automaticCompletedImplemented: false,
    completedSuggestionsImplemented: false,
    completedJustificationImplemented: false,
    completedScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}
