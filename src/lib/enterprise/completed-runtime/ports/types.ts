/**
 * Tipos vendor-agnósticos do Enterprise Completed Runtime — A10-02.
 *
 * Fluxo estrutural (A10-02):
 *   Produto → Enterprise Runtime → CompletedRuntimePort
 *     → Adapter → Completed Runtime Store → CompletedResult
 *
 * A10-02: infraestrutura canônica estrutural apenas — sem completedoria real /
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
import type { WorkerRuntimePort } from "../../worker-runtime/ports/worker-runtime-port";
import type { SchedulerRuntimePort } from "../../scheduler-runtime/ports/scheduler-runtime-port";
import type { ObservabilityRuntimePort } from "../../observability-runtime/ports/observability-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type { ValidationRuntimePort } from "../../validation-runtime/ports/validation-runtime-port";
import type { AIOrchestrationRuntimePort } from "../../ai-orchestration-runtime/ports/ai-orchestration-runtime-port";
import type {
  AIOrchestrationContext,
  CompletedContext,
  CompletedFinding,
  CompletedJob,
  CompletedMetadata,
  CompletedRequest,
  CompletedResult,
  CompletedStatistics,
  DocumentClassificationContext,
  DocumentExtractionResult,
  ValidationResult,
} from "./canonical";
import type { CompletedRuntimeEngineCapabilities } from "./capabilities";

export type {
  AIOrchestrationContext,
  CompletedCapabilities,
  CompletedContext,
  CompletedFinding,
  CompletedHealth,
  CompletedIssue,
  CompletedJob,
  CompletedJustification,
  CompletedMetadata,
  CompletedRecommendation,
  CompletedRequest,
  CompletedResult,
  CompletedScore,
  CompletedStatistics,
  CompletedStatus,
  CompletedSummary,
  CompletedTypeContract,
  CompletedTypeKind,
  BusinessCompleted,
  CanonicalCompletedOperation,
  ClinicalCompleted,
  ComplianceCompleted,
  DocumentClassificationContext,
  DocumentExtractionResult,
  FinancialCompleted,
  FutureCompletedTypeContract,
  OperatorCompleted,
  QualityCompleted,
  TechnicalCompleted,
  TISSCompleted,
  ValidationResult,
} from "./canonical";
export type { CompletedRuntimeEngineCapabilities };

/** Provedores / mecanismos do Completed Runtime (adapters do Port). */
export type CompletedRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";

/** Status operacional declarado no registry (A10-02). */
export type CompletedRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (A10-02). */
export type CompletedRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (A10-02). */
export type CompletedRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: CompletedRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Completed Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type CompletedRuntimeHealth = {
  ok: boolean;
  provider: CompletedRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: CompletedRuntimeStatus;
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
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type CompletedRuntimeCapabilities = {
  provider: CompletedRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalCompleted: boolean;
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
  /** Espelho declarativo (engine) e canônico (A10-02) — informativo. */
  engine?: CompletedRuntimeEngineCapabilities;
  canonical?: import("./canonical").CompletedCapabilities;
};

/** Metadados estáveis do provedor (A10-02). */
export type CompletedRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (A10-02). */
export type CompletedRuntimeInfo = {
  providerId: CompletedRuntimeProviderId;
  metadata: CompletedRuntimeProviderMetadata;
  status: CompletedRuntimeStatus;
  providerType: "COMPLETED_RUNTIME";
  capabilities: CompletedRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — A10-02. */
export type CompletedRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — A10-02. */
export type CompletedRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: CompletedRuntimeProviderId;
  telemetry: CompletedRuntimeTelemetry;
  logs?: readonly CompletedRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * A10-02: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type CompletedRuntimeEnterpriseDeps = {
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
  getWorkerRuntimePort?: () => WorkerRuntimePort;
  getSchedulerRuntimePort?: () => SchedulerRuntimePort;
  getObservabilityRuntimePort?: () => ObservabilityRuntimePort;
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
};

/** Opções de resolução do CompletedRuntimePort. */
export type CompletedRuntimeProviderOptions = {
  provider?: CompletedRuntimeProviderId;
  enterpriseDeps?: CompletedRuntimeEnterpriseDeps;
};

/** Alias A10-02 — resolução do CompletedRuntimePort (default: `enterprise`). */
export type CompletedRuntimeOptions = CompletedRuntimeProviderOptions;

/** Entrada de registro no CompletedRuntimeRegistry (A10-02). */
export type CompletedRuntimeRegistration = {
  providerId: CompletedRuntimeProviderId;
  name: string;
  version: string;
  status: CompletedRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: CompletedRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// A10-02 — operações estruturais (openJob / closeJob / submitRequest /
// registerFinding / getResult / stats). Nunca executam completedoria real.
// ---------------------------------------------------------------------------

export type OpenCompletedJobInput = CompletedRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: CompletedMetadata;
  completedContext?: CompletedContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type OpenCompletedJobResult = CompletedRuntimeOperationEnvelope & {
  result?: CompletedResult;
  job?: CompletedJob;
};

export type CloseCompletedJobInput = CompletedRuntimeOperationalControls & {
  jobId: string;
};

export type CloseCompletedJobResult = CompletedRuntimeOperationEnvelope & {
  result?: CompletedResult;
  job?: CompletedJob;
};

export type SubmitCompletedRequestInput = CompletedRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  findingId?: string;
  metadata?: CompletedMetadata;
  completedContext?: CompletedContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type SubmitCompletedRequestResult = CompletedRuntimeOperationEnvelope & {
  result?: CompletedResult;
  job?: CompletedJob;
  request?: CompletedRequest;
};

export type RegisterCompletedFindingInput = CompletedRuntimeOperationalControls & {
  findingId?: string;
  jobId?: string;
  requestId?: string;
  completedType?: import("./canonical").CompletedTypeKind;
  metadata?: CompletedMetadata;
  completedContext?: CompletedContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  aiOrchestrationContext?: AIOrchestrationContext;
};

export type RegisterCompletedFindingResult = CompletedRuntimeOperationEnvelope & {
  result?: CompletedResult;
  finding?: CompletedFinding;
};

export type GetCompletedResultInput = CompletedRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  findingId?: string;
};

export type GetCompletedResultResult = CompletedRuntimeOperationEnvelope & {
  result?: CompletedResult;
  job?: CompletedJob;
  request?: CompletedRequest;
  finding?: CompletedFinding;
};

export type CompletedStatsInput = CompletedRuntimeOperationalControls & {
  jobId?: string;
};

export type CompletedStatsResult = CompletedRuntimeOperationEnvelope & {
  statistics?: CompletedStatistics;
  result?: CompletedResult;
};
