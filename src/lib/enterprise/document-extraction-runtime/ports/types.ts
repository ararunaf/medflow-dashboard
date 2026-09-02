/**
 * Tipos vendor-agnósticos do Enterprise Document Extraction Runtime — F3-CAP-07.
 *
 * Fluxo estrutural (F3-CAP-07):
 *   Produto → Enterprise Runtime → DocumentExtractionRuntimePort
 *     → Adapter → Document Extraction Runtime Store → DocumentExtractionResult
 *
 * F3-CAP-07: infraestrutura canônica estrutural apenas — sem extração real /
 * sem OCR / sem IA / sem ML / sem LLM / sem Regex / sem Template Matching /
 * sem leitura de campos / sem preenchimento de guias.
 */
import type { DocumentClassificationRuntimePort } from "../../document-classification-runtime/ports/document-classification-runtime-port";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { IntelligentCaptureRuntimePort } from "../../intelligent-capture-runtime/ports/intelligent-capture-runtime-port";
import type { ScannerRuntimePort } from "../../scanner-runtime/ports/scanner-runtime-port";
import type { WatchFolderRuntimePort } from "../../watch-folder-runtime/ports/watch-folder-runtime-port";
import type { UploadRuntimePort } from "../../upload-runtime/ports/upload-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type {
  DocumentClassificationContext,
  DocumentExtractionDocument,
  DocumentExtractionRequest,
  DocumentExtractionResult,
  ExtractionJob,
  ExtractionMetadata,
  ExtractionStatistics,
} from "./canonical";
import type { DocumentExtractionRuntimeEngineCapabilities } from "./capabilities";

export type {
  CanonicalExtractionOperation,
  CanonicalExtractionProvider,
  DocumentClassificationContext,
  DocumentExtractionDocument,
  DocumentExtractionRequest,
  DocumentExtractionResult,
  ExtractionCapabilities,
  ExtractionConfidence,
  ExtractionContext,
  ExtractionField,
  ExtractionHealth,
  ExtractionJob,
  ExtractionMetadata,
  ExtractionStatistics,
  ExtractionStatus,
  ExtractionSummary,
  ExtractionTable,
} from "./canonical";
export type { DocumentExtractionRuntimeEngineCapabilities };

/** Provedores / mecanismos do Document Extraction Runtime (adapters do Port). */
export type DocumentExtractionRuntimeProviderId =
  | "mock"
  | "test"
  | "default"
  | "enterprise"
  | "real-tiss";

/** Status operacional declarado no registry (F3-CAP-07). */
export type DocumentExtractionRuntimeStatus =
  | "ready"
  | "stub"
  | "disabled"
  | "unhealthy"
  | "unknown";

/** Telemetria estrutural embutida no resultado (F3-CAP-07). */
export type DocumentExtractionRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (F3-CAP-07). */
export type DocumentExtractionRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: DocumentExtractionRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Document Extraction Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type DocumentExtractionRuntimeHealth = {
  ok: boolean;
  provider: DocumentExtractionRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: DocumentExtractionRuntimeStatus;
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
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
  tableExtractionImplemented: false;
  templateExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
  barcodeExtractionImplemented: false;
  qrExtractionImplemented: false;
  pipelineSelectionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type DocumentExtractionRuntimeCapabilities = {
  provider: DocumentExtractionRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalExtraction: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
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
  fieldExtractionImplemented: false;
  structuredExtractionImplemented: false;
  medicalGuideExtractionImplemented: false;
  tableExtractionImplemented: false;
  templateExtractionImplemented: false;
  automaticMappingImplemented: false;
  confidenceScoreImplemented: false;
  barcodeExtractionImplemented: false;
  qrExtractionImplemented: false;
  pipelineSelectionImplemented: false;
  /** Espelho declarativo (engine) e canônico (F3-CAP-07) — informativo. */
  engine?: DocumentExtractionRuntimeEngineCapabilities;
  canonical?: import("./canonical").ExtractionCapabilities;
};

/** Metadados estáveis do provedor (F3-CAP-07). */
export type DocumentExtractionRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (F3-CAP-07). */
export type DocumentExtractionRuntimeInfo = {
  providerId: DocumentExtractionRuntimeProviderId;
  metadata: DocumentExtractionRuntimeProviderMetadata;
  status: DocumentExtractionRuntimeStatus;
  providerType: "DOCUMENT_EXTRACTION_RUNTIME";
  capabilities: DocumentExtractionRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — F3-CAP-07. */
export type DocumentExtractionRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — F3-CAP-07. */
export type DocumentExtractionRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: DocumentExtractionRuntimeProviderId;
  telemetry: DocumentExtractionRuntimeTelemetry;
  logs?: readonly DocumentExtractionRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * F3-CAP-07: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type DocumentExtractionRuntimeEnterpriseDeps = {
  getDocumentClassificationRuntimePort?: () => DocumentClassificationRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getIntelligentCaptureRuntimePort?: () => IntelligentCaptureRuntimePort;
  getScannerRuntimePort?: () => ScannerRuntimePort;
  getWatchFolderRuntimePort?: () => WatchFolderRuntimePort;
  getUploadRuntimePort?: () => UploadRuntimePort;
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
};

/** Opções de resolução do DocumentExtractionRuntimePort. */
export type DocumentExtractionRuntimeProviderOptions = {
  provider?: DocumentExtractionRuntimeProviderId;
  enterpriseDeps?: DocumentExtractionRuntimeEnterpriseDeps;
  /** RawOcrResult de teste/ativação para o adapter real-tiss (A2-02). */
  rawOcrResult?: unknown;
  /** TissParser customizado para o adapter real-tiss (A2-02). */
  tissParser?: unknown;
};

/** Alias F3-CAP-07 — resolução do DocumentExtractionRuntimePort (default: `enterprise`). */
export type DocumentExtractionRuntimeOptions = DocumentExtractionRuntimeProviderOptions;

/** Entrada de registro no DocumentExtractionRuntimeRegistry (F3-CAP-07). */
export type DocumentExtractionRuntimeRegistration = {
  providerId: DocumentExtractionRuntimeProviderId;
  name: string;
  version: string;
  status: DocumentExtractionRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: DocumentExtractionRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// F3-CAP-07 — operações estruturais (openJob / closeJob / submitRequest /
// registerDocument / getResult / stats). Nunca executam extração real.
// ---------------------------------------------------------------------------

export type OpenExtractionJobInput = DocumentExtractionRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: ExtractionMetadata;
  classificationContext?: DocumentClassificationContext;
};

export type OpenExtractionJobResult = DocumentExtractionRuntimeOperationEnvelope & {
  result?: DocumentExtractionResult;
  job?: ExtractionJob;
};

export type CloseExtractionJobInput = DocumentExtractionRuntimeOperationalControls & {
  jobId: string;
};

export type CloseExtractionJobResult = DocumentExtractionRuntimeOperationEnvelope & {
  result?: DocumentExtractionResult;
  job?: ExtractionJob;
};

export type SubmitExtractionRequestInput = DocumentExtractionRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  documentId?: string;
  metadata?: ExtractionMetadata;
  classificationContext?: DocumentClassificationContext;
};

export type SubmitExtractionRequestResult = DocumentExtractionRuntimeOperationEnvelope & {
  result?: DocumentExtractionResult;
  job?: ExtractionJob;
  request?: DocumentExtractionRequest;
};

export type RegisterExtractionDocumentInput = DocumentExtractionRuntimeOperationalControls & {
  documentId?: string;
  jobId?: string;
  requestId?: string;
  metadata?: ExtractionMetadata;
  classificationContext?: DocumentClassificationContext;
};

export type RegisterExtractionDocumentResult = DocumentExtractionRuntimeOperationEnvelope & {
  result?: DocumentExtractionResult;
  document?: DocumentExtractionDocument;
};

export type GetExtractionResultInput = DocumentExtractionRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  documentId?: string;
};

export type GetExtractionResultResult = DocumentExtractionRuntimeOperationEnvelope & {
  result?: DocumentExtractionResult;
  job?: ExtractionJob;
  request?: DocumentExtractionRequest;
  document?: DocumentExtractionDocument;
};

export type ExtractionStatsInput = DocumentExtractionRuntimeOperationalControls & {
  jobId?: string;
};

export type ExtractionStatsResult = DocumentExtractionRuntimeOperationEnvelope & {
  statistics?: ExtractionStatistics;
  result?: DocumentExtractionResult;
};
