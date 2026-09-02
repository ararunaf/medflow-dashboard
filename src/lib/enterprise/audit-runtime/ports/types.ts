/**
 * Tipos vendor-agnósticos do Enterprise Audit Runtime — F3-CAP-10.
 *
 * Fluxo estrutural (F3-CAP-10):
 *   Produto → Enterprise Runtime → AuditRuntimePort
 *     → Adapter → Audit Runtime Store → AuditResult
 *
 * F3-CAP-10: infraestrutura canônica estrutural apenas — sem auditoria real /
 * sem IA / sem OpenAI / sem Azure OpenAI / sem Gemini / sem Claude / sem ML /
 * sem regras TISS / sem regras de operadoras / sem justificativas automáticas /
 * sem correções automáticas / sem aprovação/rejeição automática.
 */
import type { DocumentClassificationRuntimePort } from "../../document-classification-runtime/ports/document-classification-runtime-port";
import type { DocumentExtractionRuntimePort } from "../../document-extraction-runtime/ports/document-extraction-runtime-port";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { IntelligentCaptureRuntimePort } from "../../intelligent-capture-runtime/ports/intelligent-capture-runtime-port";
import type { ScannerRuntimePort } from "../../scanner-runtime/ports/scanner-runtime-port";
import type { WatchFolderRuntimePort } from "../../watch-folder-runtime/ports/watch-folder-runtime-port";
import type { UploadRuntimePort } from "../../upload-runtime/ports/upload-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type { ValidationRuntimePort } from "../../validation-runtime/ports/validation-runtime-port";
import type { AIOrchestrationRuntimePort } from "../../ai-orchestration-runtime/ports/ai-orchestration-runtime-port";
import type {
  AIOrchestrationContext,
  AuditContext,
  AuditFinding,
  AuditJob,
  AuditMetadata,
  AuditRequest,
  AuditResult,
  AuditStatistics,
  DocumentClassificationContext,
  DocumentExtractionResult,
  ValidationResult,
} from "./canonical";
import type { AuditRuntimeEngineCapabilities } from "./capabilities";

export type {
  AIOrchestrationContext,
  AuditCapabilities,
  AuditContext,
  AuditFinding,
  AuditHealth,
  AuditIssue,
  AuditJob,
  AuditJustification,
  AuditMetadata,
  AuditRecommendation,
  AuditRequest,
  AuditResult,
  AuditScore,
  AuditStatistics,
  AuditStatus,
  AuditSummary,
  AuditTypeContract,
  AuditTypeKind,
  BusinessAudit,
  CanonicalAuditOperation,
  ClinicalAudit,
  ComplianceAudit,
  DocumentClassificationContext,
  DocumentExtractionResult,
  FinancialAudit,
  FutureAuditTypeContract,
  OperatorAudit,
  QualityAudit,
  TechnicalAudit,
  TISSAudit,
  ValidationResult,
} from "./canonical";
export type { AuditRuntimeEngineCapabilities };

/** Provedores / mecanismos do Audit Runtime (adapters do Port). */
export type AuditRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";

/** Status operacional declarado no registry (F3-CAP-10). */
export type AuditRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-10). */
export type AuditRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-10). */
export type AuditRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: AuditRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Audit Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type AuditRuntimeHealth = {
  ok: boolean;
  provider: AuditRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: AuditRuntimeStatus;
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
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
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
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AuditRuntimeCapabilities = {
  provider: AuditRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalAudit: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesAIOrchestrationRuntimePort: boolean;
  usesValidationRuntimePort: boolean;
  usesDocumentExtractionRuntimePort: boolean;
  usesDocumentClassificationRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesIntelligentCaptureRuntimePort: boolean;
  usesScannerRuntimePort: boolean;
  usesWatchFolderRuntimePort: boolean;
  usesUploadRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  usesScalabilityRuntimePort: boolean;
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
  /** Espelho declarativo (engine) e canônico (F3-CAP-10) — informativo. */
  engine?: AuditRuntimeEngineCapabilities;
  canonical?: import("./canonical").AuditCapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-10). */
export type AuditRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-10). */
export type AuditRuntimeInfo = {
  providerId: AuditRuntimeProviderId;
  metadata: AuditRuntimeProviderMetadata;
  status: AuditRuntimeStatus;
  providerType: "AUDIT_RUNTIME";
  capabilities: AuditRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-10. */
export type AuditRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-10. */
export type AuditRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: AuditRuntimeProviderId;
  telemetry: AuditRuntimeTelemetry;
  logs?: readonly AuditRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * F3-CAP-10: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type AuditRuntimeEnterpriseDeps = {
  getAIOrchestrationRuntimePort?: () => AIOrchestrationRuntimePort;
  getValidationRuntimePort?: () => ValidationRuntimePort;
  getDocumentExtractionRuntimePort?: () => DocumentExtractionRuntimePort;
  getDocumentClassificationRuntimePort?: () => DocumentClassificationRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getIntelligentCaptureRuntimePort?: () => IntelligentCaptureRuntimePort;
  getScannerRuntimePort?: () => ScannerRuntimePort;
  getWatchFolderRuntimePort?: () => WatchFolderRuntimePort;
  getUploadRuntimePort?: () => UploadRuntimePort;
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
};

/** Opções de resolução do AuditRuntimePort. */
export type AuditRuntimeProviderOptions = {
  provider?: AuditRuntimeProviderId;
  enterpriseDeps?: AuditRuntimeEnterpriseDeps;
};

/** Alias F3-CAP-10 — resolução do AuditRuntimePort (default: `enterprise`). */
export type AuditRuntimeOptions = AuditRuntimeProviderOptions;

/** Entrada de registro no AuditRuntimeRegistry (F3-CAP-10). */
export type AuditRuntimeRegistration = {
  providerId: AuditRuntimeProviderId;
  name: string;
  version: string;
  status: AuditRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: AuditRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-10 — operações estruturais (openJob / closeJob / submitRequest /
// registerFinding / getResult / stats). Nunca executam auditoria real.
// ---------------------------------------------------------------------------

export type OpenAuditJobInput = AuditRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: AuditMetadata;
  auditContext?: AuditContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type OpenAuditJobResult = AuditRuntimeOperationEnvelope & {
  result?: AuditResult;
  job?: AuditJob;
};

export type CloseAuditJobInput = AuditRuntimeOperationalControls & {
  jobId: string;
};

export type CloseAuditJobResult = AuditRuntimeOperationEnvelope & {
  result?: AuditResult;
  job?: AuditJob;
};

export type SubmitAuditRequestInput = AuditRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  findingId?: string;
  metadata?: AuditMetadata;
  auditContext?: AuditContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type SubmitAuditRequestResult = AuditRuntimeOperationEnvelope & {
  result?: AuditResult;
  job?: AuditJob;
  request?: AuditRequest;
};

export type RegisterAuditFindingInput = AuditRuntimeOperationalControls & {
  findingId?: string;
  jobId?: string;
  requestId?: string;
  auditType?: import("./canonical").AuditTypeKind;
  metadata?: AuditMetadata;
  auditContext?: AuditContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type RegisterAuditFindingResult = AuditRuntimeOperationEnvelope & {
  result?: AuditResult;
  finding?: AuditFinding;
};

export type GetAuditResultInput = AuditRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  findingId?: string;
};

export type GetAuditResultResult = AuditRuntimeOperationEnvelope & {
  result?: AuditResult;
  job?: AuditJob;
  request?: AuditRequest;
  finding?: AuditFinding;
};

export type AuditStatsInput = AuditRuntimeOperationalControls & {
  jobId?: string;
};

export type AuditStatsResult = AuditRuntimeOperationEnvelope & {
  statistics?: AuditStatistics;
  result?: AuditResult;
};
