/**
 * Modelos canônicos estruturais do Enterprise Validation Runtime — F3-CAP-08.
 *
 * Foundation estrutural vendor-agnostic para orquestração futura de validação
 * de dados extraídos antes de auditoria, IA ou preenchimento de guias.
 *
 * Sem validação real. Sem auditoria. Sem IA. Sem ML. Sem LLM.
 * Sem correção automática. Sem regras TISS. Sem regras de operadoras.
 * Sem persistência. Sem banco. Sem APIs. Sem OCR adicional.
 *
 * Todos os metadados e contratos abaixo são exclusivamente estruturais —
 * nenhum campo possui implementação funcional nesta sprint.
 */

import type { DocumentClassificationContext } from "../../document-extraction-runtime/ports/canonical";
import type { DocumentExtractionResult } from "../../document-extraction-runtime/ports/canonical";

export type { DocumentClassificationContext, DocumentExtractionResult };

/** Status estrutural de job / request / documento de validação (F3-CAP-08). */
export type ValidationStatus =
  | "pending"
  | "job-open"
  | "job-closed"
  | "submitted"
  | "registered"
  | "processed"
  | "failed"
  | "unknown"
  | (string & {});

/** Confiança estrutural (nunca calculada por validador real). */
export type ValidationConfidence = {
  kind: "canonical-validation-confidence";
  score?: number;
  band?: "low" | "medium" | "high" | "unknown";
};

/**
 * Contratos estruturais para regras futuras (F3-CAP-08).
 * Nenhuma regra é avaliada nesta sprint — apenas declaração canônica.
 */
export type FutureValidationRuleContracts = {
  kind: "canonical-future-validation-rule-contracts";
  /** template corresponde à operadora — NÃO avaliado. */
  templateMatchesOperatorDeclared: false;
  /** versão TISS compatível — NÃO avaliado. */
  tissVersionCompatibleDeclared: false;
  /** documento compatível com template — NÃO avaliado. */
  documentCompatibleWithTemplateDeclared: false;
  /** qualidade mínima — NÃO avaliado. */
  minimumQualityDeclared: false;
  /** confiança mínima — NÃO avaliado. */
  minimumConfidenceDeclared: false;
  /** campos obrigatórios — NÃO avaliado. */
  mandatoryFieldsDeclared: false;
  /** consistência entre campos — NÃO avaliado. */
  crossFieldConsistencyDeclared: false;
  /** compatibilidade entre guia e operadora — NÃO avaliado. */
  guideOperatorCompatibilityDeclared: false;
  /** consistência documental — NÃO avaliado. */
  documentConsistencyDeclared: false;
  /** score geral de validação — NÃO avaliado. */
  overallValidationScoreDeclared: false;
};

/**
 * ValidationContext canônico (F3-CAP-08).
 *
 * Capaz de receber futuramente DocumentClassificationContext +
 * DocumentExtractionResult — sem qualquer processamento nesta sprint.
 */
export type ValidationContext = {
  kind: "canonical-validation-context";
  jobId?: string;
  requestId?: string;
  documentId?: string;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  confidence?: ValidationConfidence;
  futureRules?: FutureValidationRuleContracts;
  structuralNotes?: string;
};

/** Metadata canônica estrutural (F3-CAP-08). */
export type ValidationMetadata = {
  kind: "canonical-validation-metadata";
  jobId?: string;
  requestId?: string;
  documentId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationContext?: ValidationContext;
};

/** Issue canônica estrutural — nunca produzida por validador real. */
export type ValidationIssue = {
  kind: "canonical-validation-issue";
  issueId: string;
  code?: string;
  message?: string;
  fieldPath?: string;
  severity?: "info" | "warning" | "error" | "unknown";
  status: ValidationStatus;
  fieldValidationImplemented: false;
  documentValidationImplemented: false;
  businessRuleValidationImplemented: false;
};

/** Warning canônico estrutural — nunca emitido por motor real. */
export type ValidationWarning = {
  kind: "canonical-validation-warning";
  warningId: string;
  code?: string;
  message?: string;
  fieldPath?: string;
  status: ValidationStatus;
  qualityValidationImplemented: false;
  confidenceValidationImplemented: false;
};

/** Error canônico estrutural — nunca emitido por motor real. */
export type ValidationError = {
  kind: "canonical-validation-error";
  errorId: string;
  code?: string;
  message?: string;
  fieldPath?: string;
  status: ValidationStatus;
  mandatoryFieldValidationImplemented: false;
  crossFieldValidationImplemented: false;
  tissValidationImplemented: false;
  operatorValidationImplemented: false;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalValidationProvider = {
  kind: "canonical-validation-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/** Operação canônica do Validation Runtime (F3-CAP-08). */
export type CanonicalValidationOperation =
  | "openJob"
  | "closeJob"
  | "submitRequest"
  | "registerDocument"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/** Job canônico estrutural de validação — nunca executa validação real. */
export type ValidationJob = {
  kind: "canonical-validation-job";
  jobId: string;
  status: ValidationStatus;
  identity?: {
    kind: "canonical-validation-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: ValidationMetadata;
  validationContext?: ValidationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  fieldValidationImplemented: false;
  documentValidationImplemented: false;
  templateValidationImplemented: false;
  operatorValidationImplemented: false;
  tissValidationImplemented: false;
  confidenceValidationImplemented: false;
  qualityValidationImplemented: false;
  mandatoryFieldValidationImplemented: false;
  crossFieldValidationImplemented: false;
  businessRuleValidationImplemented: false;
  automaticApprovalImplemented: false;
  automaticRejectionImplemented: false;
};

/**
 * Request canônico estrutural de validação (ValidationRequest).
 * Nunca dispara engine de validação real.
 */
export type ValidationRequest = {
  kind: "canonical-validation-request";
  requestId: string;
  jobId?: string;
  documentId?: string;
  status: ValidationStatus;
  metadata?: ValidationMetadata;
  validationContext?: ValidationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  createdAt: string;
  updatedAt: string;
  fieldValidationImplemented: false;
  documentValidationImplemented: false;
  templateValidationImplemented: false;
  operatorValidationImplemented: false;
  tissValidationImplemented: false;
  confidenceValidationImplemented: false;
  qualityValidationImplemented: false;
  mandatoryFieldValidationImplemented: false;
  crossFieldValidationImplemented: false;
  businessRuleValidationImplemented: false;
  automaticApprovalImplemented: false;
  automaticRejectionImplemented: false;
};

/** Documento canônico estrutural referenciado — nunca valida conteúdo real. */
export type ValidationDocument = {
  kind: "canonical-validation-document";
  documentId: string;
  jobId?: string;
  requestId?: string;
  status: ValidationStatus;
  metadata?: ValidationMetadata;
  validationContext?: ValidationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  createdAt: string;
  updatedAt: string;
  fieldValidationImplemented: false;
  documentValidationImplemented: false;
  templateValidationImplemented: false;
  operatorValidationImplemented: false;
  tissValidationImplemented: false;
  confidenceValidationImplemented: false;
  qualityValidationImplemented: false;
  mandatoryFieldValidationImplemented: false;
  crossFieldValidationImplemented: false;
  businessRuleValidationImplemented: false;
  automaticApprovalImplemented: false;
  automaticRejectionImplemented: false;
};

/** Resumo estrutural de validação — nunca contém resultados reais. */
export type ValidationSummary = {
  kind: "canonical-validation-summary";
  issueCount: number;
  warningCount: number;
  errorCount: number;
  status: ValidationStatus;
  validationContext?: ValidationContext;
  fieldValidationImplemented: false;
  documentValidationImplemented: false;
  templateValidationImplemented: false;
  operatorValidationImplemented: false;
  tissValidationImplemented: false;
  automaticApprovalImplemented: false;
  automaticRejectionImplemented: false;
};

/**
 * Resultado canônico de operação do Validation Runtime (F3-CAP-08).
 * Contém apenas referência/estrutura canônica — nunca validação real.
 */
export type ValidationResult = {
  kind: "canonical-validation-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalValidationOperation;
  job?: ValidationJob;
  request?: ValidationRequest;
  document?: ValidationDocument;
  issues?: readonly ValidationIssue[];
  warnings?: readonly ValidationWarning[];
  errors?: readonly ValidationError[];
  summary?: ValidationSummary;
  metadata?: ValidationMetadata;
  provider?: CanonicalValidationProvider;
  validationContext?: ValidationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  confidence?: ValidationConfidence;
  fieldValidationImplemented: false;
  documentValidationImplemented: false;
  templateValidationImplemented: false;
  operatorValidationImplemented: false;
  tissValidationImplemented: false;
  confidenceValidationImplemented: false;
  qualityValidationImplemented: false;
  mandatoryFieldValidationImplemented: false;
  crossFieldValidationImplemented: false;
  businessRuleValidationImplemented: false;
  automaticApprovalImplemented: false;
  automaticRejectionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem validação real). */
  runtimeReady: true;
  status: ValidationStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Validation Runtime (in-process). */
export type ValidationStatistics = {
  kind: "canonical-validation-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalDocuments: number;
  totalResults: number;
  fieldValidationImplementedCount: 0;
  documentValidationImplementedCount: 0;
  templateValidationImplementedCount: 0;
  operatorValidationImplementedCount: 0;
  tissValidationImplementedCount: 0;
  confidenceValidationImplementedCount: 0;
  qualityValidationImplementedCount: 0;
  mandatoryFieldValidationImplementedCount: 0;
  crossFieldValidationImplementedCount: 0;
  businessRuleValidationImplementedCount: 0;
  automaticApprovalImplementedCount: 0;
  automaticRejectionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Validation Runtime. */
export type ValidationHealth = {
  kind: "canonical-validation-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedDocumentCount?: number;
  storedResultCount?: number;
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
  fieldValidationImplemented: false;
  documentValidationImplemented: false;
  templateValidationImplemented: false;
  operatorValidationImplemented: false;
  tissValidationImplemented: false;
  confidenceValidationImplemented: false;
  qualityValidationImplemented: false;
  mandatoryFieldValidationImplemented: false;
  crossFieldValidationImplemented: false;
  businessRuleValidationImplemented: false;
  automaticApprovalImplemented: false;
  automaticRejectionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Validation Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ValidationCapabilities = {
  kind: "canonical-validation-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalValidation: boolean;
  runtimeReady: true;
  fieldValidationImplemented: false;
  documentValidationImplemented: false;
  templateValidationImplemented: false;
  operatorValidationImplemented: false;
  tissValidationImplemented: false;
  confidenceValidationImplemented: false;
  qualityValidationImplemented: false;
  mandatoryFieldValidationImplemented: false;
  crossFieldValidationImplemented: false;
  businessRuleValidationImplemented: false;
  automaticApprovalImplemented: false;
  automaticRejectionImplemented: false;
};
