/**
 * Tipos vendor-agnósticos do Enterprise Validation Runtime — F3-CAP-08.
 *
 * Fluxo estrutural (F3-CAP-08):
 *   Produto → Enterprise Runtime → ValidationRuntimePort
 *     → Adapter → Validation Runtime Store → ValidationResult
 *
 * F3-CAP-08: infraestrutura canônica estrutural apenas — sem validação real /
 * sem auditoria / sem IA / sem ML / sem LLM / sem correção automática /
 * sem regras TISS / sem regras de operadoras / sem aprovação automática.
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
import type {
  DocumentClassificationContext,
  DocumentExtractionResult,
  ValidationDocument,
  ValidationJob,
  ValidationMetadata,
  ValidationRequest,
  ValidationResult,
  ValidationStatistics,
  ValidationContext,
} from "./canonical";
import type { ValidationRuntimeEngineCapabilities } from "./capabilities";

export type {
  CanonicalValidationOperation,
  CanonicalValidationProvider,
  DocumentClassificationContext,
  DocumentExtractionResult,
  FutureValidationRuleContracts,
  ValidationCapabilities,
  ValidationConfidence,
  ValidationContext,
  ValidationDocument,
  ValidationError,
  ValidationHealth,
  ValidationIssue,
  ValidationJob,
  ValidationMetadata,
  ValidationRequest,
  ValidationResult,
  ValidationStatistics,
  ValidationStatus,
  ValidationSummary,
  ValidationWarning,
} from "./canonical";
export type { ValidationRuntimeEngineCapabilities };

/** Provedores / mecanismos do Validation Runtime (adapters do Port). */
export type ValidationRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (F3-CAP-08). */
export type ValidationRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-08). */
export type ValidationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-08). */
export type ValidationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: ValidationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Validation Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type ValidationRuntimeHealth = {
  ok: boolean;
  provider: ValidationRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: ValidationRuntimeStatus;
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
  storedDocumentCount?: number;
  storedResultCount?: number;
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
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ValidationRuntimeCapabilities = {
  provider: ValidationRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalValidation: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
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
  /** Espelho declarativo (engine) e canônico (F3-CAP-08) — informativo. */
  engine?: ValidationRuntimeEngineCapabilities;
  canonical?: import("./canonical").ValidationCapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-08). */
export type ValidationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-08). */
export type ValidationRuntimeInfo = {
  providerId: ValidationRuntimeProviderId;
  metadata: ValidationRuntimeProviderMetadata;
  status: ValidationRuntimeStatus;
  providerType: "VALIDATION_RUNTIME";
  capabilities: ValidationRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-08. */
export type ValidationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-08. */
export type ValidationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: ValidationRuntimeProviderId;
  telemetry: ValidationRuntimeTelemetry;
  logs?: readonly ValidationRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * F3-CAP-08: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type ValidationRuntimeEnterpriseDeps = {
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

/** Opções de resolução do ValidationRuntimePort. */
export type ValidationRuntimeProviderOptions = {
  provider?: ValidationRuntimeProviderId;
  enterpriseDeps?: ValidationRuntimeEnterpriseDeps;
};

/** Alias F3-CAP-08 — resolução do ValidationRuntimePort (default: `enterprise`). */
export type ValidationRuntimeOptions = ValidationRuntimeProviderOptions;

/** Entrada de registro no ValidationRuntimeRegistry (F3-CAP-08). */
export type ValidationRuntimeRegistration = {
  providerId: ValidationRuntimeProviderId;
  name: string;
  version: string;
  status: ValidationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: ValidationRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-08 — operações estruturais (openJob / closeJob / submitRequest /
// registerDocument / getResult / stats). Nunca executam validação real.
// ---------------------------------------------------------------------------

export type OpenValidationJobInput = ValidationRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: ValidationMetadata;
  validationContext?: ValidationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
};

export type OpenValidationJobResult = ValidationRuntimeOperationEnvelope & {
  result?: ValidationResult;
  job?: ValidationJob;
};

export type CloseValidationJobInput = ValidationRuntimeOperationalControls & {
  jobId: string;
};

export type CloseValidationJobResult = ValidationRuntimeOperationEnvelope & {
  result?: ValidationResult;
  job?: ValidationJob;
};

export type SubmitValidationRequestInput = ValidationRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  documentId?: string;
  metadata?: ValidationMetadata;
  validationContext?: ValidationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
};

export type SubmitValidationRequestResult = ValidationRuntimeOperationEnvelope & {
  result?: ValidationResult;
  job?: ValidationJob;
  request?: ValidationRequest;
};

export type RegisterValidationDocumentInput = ValidationRuntimeOperationalControls & {
  documentId?: string;
  jobId?: string;
  requestId?: string;
  metadata?: ValidationMetadata;
  validationContext?: ValidationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
};

export type RegisterValidationDocumentResult = ValidationRuntimeOperationEnvelope & {
  result?: ValidationResult;
  document?: ValidationDocument;
};

export type GetValidationResultInput = ValidationRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  documentId?: string;
};

export type GetValidationResultResult = ValidationRuntimeOperationEnvelope & {
  result?: ValidationResult;
  job?: ValidationJob;
  request?: ValidationRequest;
  document?: ValidationDocument;
};

export type ValidationStatsInput = ValidationRuntimeOperationalControls & {
  jobId?: string;
};

export type ValidationStatsResult = ValidationRuntimeOperationEnvelope & {
  statistics?: ValidationStatistics;
  result?: ValidationResult;
};
