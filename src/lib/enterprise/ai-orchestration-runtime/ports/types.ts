/**
 * Tipos vendor-agnósticos do Enterprise AI Orchestration Runtime — F3-CAP-09.
 *
 * Fluxo estrutural (F3-CAP-09):
 *   Produto → Enterprise Runtime → AIOrchestrationRuntimePort
 *     → Adapter → AI Orchestration Runtime Store → AIExecutionResult
 *
 * F3-CAP-09: infraestrutura canônica estrutural apenas — sem IA real /
 * sem OpenAI / sem Azure OpenAI / sem Gemini / sem Claude / sem Ollama /
 * sem Llama / sem ML / sem Prompt Engineering / sem HTTP / sem agentes /
 * sem workflow / sem decisão automática.
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
import type {
  AIExecutionResult,
  AIJob,
  AIMetadata,
  AIOrchestrationContext,
  AIRequest,
  AIStatistics,
  AITask,
  DocumentClassificationContext,
  DocumentExtractionResult,
  ValidationResult,
} from "./canonical";
import type { AIOrchestrationRuntimeEngineCapabilities } from "./capabilities";

export type {
  AIAgent,
  AICapabilities,
  AIContext,
  AIExecutionPlan,
  AIExecutionResult,
  AIHealth,
  AIJob,
  AIMetadata,
  AIOrchestrationContext,
  AIProvider,
  AIRequest,
  AIResponse,
  AIStatistics,
  AIStatus,
  AITask,
  AIWorkflow,
  AuditAgent,
  CanonicalAIOrchestrationOperation,
  ClassificationAgent,
  CoordinatorAgent,
  DocumentClassificationContext,
  DocumentExtractionResult,
  ExtractionAgent,
  FutureAIAgentContract,
  FutureAIAgentKind,
  FutureAIProviderCatalog,
  FutureAIProviderContract,
  FutureAIProviderKind,
  MedicalGuideAgent,
  QualityAgent,
  SupervisorAgent,
  TISSAgent,
  ValidationAgent,
  ValidationResult,
} from "./canonical";
export type { AIOrchestrationRuntimeEngineCapabilities };

/** Provedores / mecanismos do AI Orchestration Runtime (adapters do Port). */
export type AIOrchestrationRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (F3-CAP-09). */
export type AIOrchestrationRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-09). */
export type AIOrchestrationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-09). */
export type AIOrchestrationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: AIOrchestrationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do AI Orchestration Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type AIOrchestrationRuntimeHealth = {
  ok: boolean;
  provider: AIOrchestrationRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: AIOrchestrationRuntimeStatus;
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
  storedTaskCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  llmImplemented: false;
  agentExecutionImplemented: false;
  providerSelectionImplemented: false;
  promptExecutionImplemented: false;
  multiAgentImplemented: false;
  workflowOrchestrationImplemented: false;
  aiSupervisorImplemented: false;
  contextManagementImplemented: false;
  memoryImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AIOrchestrationRuntimeCapabilities = {
  provider: AIOrchestrationRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterTask: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalAIOrchestration: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
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
  llmImplemented: false;
  agentExecutionImplemented: false;
  providerSelectionImplemented: false;
  promptExecutionImplemented: false;
  multiAgentImplemented: false;
  workflowOrchestrationImplemented: false;
  aiSupervisorImplemented: false;
  contextManagementImplemented: false;
  memoryImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
  /** Espelho declarativo (engine) e canônico (F3-CAP-09) — informativo. */
  engine?: AIOrchestrationRuntimeEngineCapabilities;
  canonical?: import("./canonical").AICapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-09). */
export type AIOrchestrationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-09). */
export type AIOrchestrationRuntimeInfo = {
  providerId: AIOrchestrationRuntimeProviderId;
  metadata: AIOrchestrationRuntimeProviderMetadata;
  status: AIOrchestrationRuntimeStatus;
  providerType: "AI_ORCHESTRATION_RUNTIME";
  capabilities: AIOrchestrationRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-09. */
export type AIOrchestrationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-09. */
export type AIOrchestrationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: AIOrchestrationRuntimeProviderId;
  telemetry: AIOrchestrationRuntimeTelemetry;
  logs?: readonly AIOrchestrationRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * F3-CAP-09: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type AIOrchestrationRuntimeEnterpriseDeps = {
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

/** Opções de resolução do AIOrchestrationRuntimePort. */
export type AIOrchestrationRuntimeProviderOptions = {
  provider?: AIOrchestrationRuntimeProviderId;
  enterpriseDeps?: AIOrchestrationRuntimeEnterpriseDeps;
};

/** Alias F3-CAP-09 — resolução do AIOrchestrationRuntimePort (default: `enterprise`). */
export type AIOrchestrationRuntimeOptions = AIOrchestrationRuntimeProviderOptions;

/** Entrada de registro no AIOrchestrationRuntimeRegistry (F3-CAP-09). */
export type AIOrchestrationRuntimeRegistration = {
  providerId: AIOrchestrationRuntimeProviderId;
  name: string;
  version: string;
  status: AIOrchestrationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: AIOrchestrationRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-09 — operações estruturais (openJob / closeJob / submitRequest /
// registerTask / getResult / stats). Nunca executam IA real.
// ---------------------------------------------------------------------------

export type OpenAIOrchestrationJobInput = AIOrchestrationRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
};

export type OpenAIOrchestrationJobResult = AIOrchestrationRuntimeOperationEnvelope & {
  result?: AIExecutionResult;
  job?: AIJob;
};

export type CloseAIOrchestrationJobInput = AIOrchestrationRuntimeOperationalControls & {
  jobId: string;
};

export type CloseAIOrchestrationJobResult = AIOrchestrationRuntimeOperationEnvelope & {
  result?: AIExecutionResult;
  job?: AIJob;
};

export type SubmitAIRequestInput = AIOrchestrationRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  taskId?: string;
  planId?: string;
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
};

export type SubmitAIRequestResult = AIOrchestrationRuntimeOperationEnvelope & {
  result?: AIExecutionResult;
  job?: AIJob;
  request?: AIRequest;
};

export type RegisterAITaskInput = AIOrchestrationRuntimeOperationalControls & {
  taskId?: string;
  jobId?: string;
  requestId?: string;
  agentKind?: import("./canonical").FutureAIAgentKind;
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
};

export type RegisterAITaskResult = AIOrchestrationRuntimeOperationEnvelope & {
  result?: AIExecutionResult;
  task?: AITask;
};

export type GetAIResultInput = AIOrchestrationRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  taskId?: string;
};

export type GetAIResultResult = AIOrchestrationRuntimeOperationEnvelope & {
  result?: AIExecutionResult;
  job?: AIJob;
  request?: AIRequest;
  task?: AITask;
};

export type AIOrchestrationStatsInput = AIOrchestrationRuntimeOperationalControls & {
  jobId?: string;
};

export type AIOrchestrationStatsResult = AIOrchestrationRuntimeOperationEnvelope & {
  statistics?: AIStatistics;
  result?: AIExecutionResult;
};
