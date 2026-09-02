/**
 * Tipos vendor-agnósticos do Enterprise Intelligent Capture Runtime — F3-CAP-04.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → IntelligentCaptureRuntimePort
 *     → Adapter → Intelligent Capture Runtime Store → CaptureResult
 *
 * Sem OCR. Sem IA. Sem Pipeline. Sem captura automática. Sem leitura de arquivos.
 * Sem Scanner/Watch Folder/Upload reais. Sem filas. Sem processamento.
 */
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ScannerRuntimePort } from "../../scanner-runtime/ports/scanner-runtime-port";
import type { WatchFolderRuntimePort } from "../../watch-folder-runtime/ports/watch-folder-runtime-port";
import type { UploadRuntimePort } from "../../upload-runtime/ports/upload-runtime-port";
import type {
  CaptureCapabilities,
  CaptureChannel,
  CaptureEnvelope,
  CaptureHealth,
  CaptureOrigin,
  CaptureRequest,
  CaptureResult,
  CaptureRoute,
  CaptureSource,
  CanonicalCaptureMetadata,
  CanonicalCaptureStatistics,
} from "./canonical";
import type { IntelligentCaptureRuntimeCapabilities } from "./capabilities";

export type {
  CaptureCapabilities,
  CaptureChannel,
  CaptureEnvelope,
  CaptureHealth,
  CaptureOrigin,
  CaptureRequest,
  CaptureResult,
  CaptureRoute,
  CaptureSource,
  CaptureStatus,
  CanonicalCaptureIdentity,
  CanonicalCaptureMetadata,
  CanonicalCaptureOperation,
  CanonicalCaptureProvider,
  CanonicalCaptureStatistics,
} from "./canonical";
export type { IntelligentCaptureRuntimeCapabilities };

/** Provedores / mecanismos do Intelligent Capture Runtime. */
export type IntelligentCaptureRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type IntelligentCaptureRuntimeStatus =
  | "ready"
  | "stub"
  | "disabled"
  | "unhealthy"
  | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type IntelligentCaptureRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type IntelligentCaptureRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: IntelligentCaptureRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type IntelligentCaptureRuntimeHealth = CaptureHealth & {
  provider: IntelligentCaptureRuntimeProviderId;
  status?: IntelligentCaptureRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type IntelligentCaptureRuntimePortCapabilities = {
  provider: IntelligentCaptureRuntimeProviderId;
  adapterId: string;
  engine: IntelligentCaptureRuntimeCapabilities;
  canonical: CaptureCapabilities;
  supportsCanonicalCapture: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesScannerRuntimePort: boolean;
  usesWatchFolderRuntimePort: boolean;
  usesUploadRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  runtimeReady: true;
  scannerIntegrationImplemented: false;
  watchFolderIntegrationImplemented: false;
  uploadIntegrationImplemented: false;
  capturePipelineImplemented: false;
  documentRoutingImplemented: false;
  automaticSelectionImplemented: false;
  automaticCaptureImplemented: false;
  ocrPipelineImplemented: false;
  classificationPipelineImplemented: false;
  processingPipelineImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type IntelligentCaptureRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo(). */
export type IntelligentCaptureRuntimeInfo = {
  providerId: IntelligentCaptureRuntimeProviderId;
  metadata: IntelligentCaptureRuntimeProviderMetadata;
  status: IntelligentCaptureRuntimeStatus;
  providerType: "INTELLIGENT_CAPTURE_RUNTIME";
  capabilities: IntelligentCaptureRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type IntelligentCaptureRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type IntelligentCaptureRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: IntelligentCaptureRuntimeProviderId;
  telemetry: IntelligentCaptureRuntimeTelemetry;
  logs?: readonly IntelligentCaptureRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterCaptureSourceInput = IntelligentCaptureRuntimeOperationalControls & {
  sourceName?: string;
  sourceId?: string;
  origin?: CaptureOrigin;
  channel?: CaptureChannel;
  correlationId?: string | null;
  metadata?: CanonicalCaptureMetadata;
};

export type RegisterCaptureSourceResult = IntelligentCaptureRuntimeOperationEnvelope & {
  result?: CaptureResult;
  source?: CaptureSource;
};

export type UnregisterCaptureSourceInput = IntelligentCaptureRuntimeOperationalControls & {
  sourceId: string;
};

export type UnregisterCaptureSourceResult = IntelligentCaptureRuntimeOperationEnvelope & {
  result?: CaptureResult;
  source?: CaptureSource;
};

export type DiscoverCaptureSourcesInput = IntelligentCaptureRuntimeOperationalControls & {
  correlationId?: string | null;
  metadata?: CanonicalCaptureMetadata;
};

export type DiscoverCaptureSourcesResult = IntelligentCaptureRuntimeOperationEnvelope & {
  result?: CaptureResult;
  sources?: readonly CaptureSource[];
};

export type OpenCaptureRequestInput = IntelligentCaptureRuntimeOperationalControls & {
  sourceId?: string;
  sourceName?: string;
  captureRequestId?: string;
  origin?: CaptureOrigin;
  channel?: CaptureChannel;
  metadata?: CanonicalCaptureMetadata;
};

export type OpenCaptureRequestResult = IntelligentCaptureRuntimeOperationEnvelope & {
  result?: CaptureResult;
  source?: CaptureSource;
  request?: CaptureRequest;
};

export type CloseCaptureRequestInput = IntelligentCaptureRuntimeOperationalControls & {
  captureRequestId: string;
};

export type CloseCaptureRequestResult = IntelligentCaptureRuntimeOperationEnvelope & {
  result?: CaptureResult;
  request?: CaptureRequest;
};

export type RouteCaptureInput = IntelligentCaptureRuntimeOperationalControls & {
  sourceId?: string;
  sourceName?: string;
  captureRequestId?: string;
  origin?: CaptureOrigin;
  channel?: CaptureChannel;
  targetRuntime?: "scanner" | "watch-folder" | "upload" | "structural";
  metadata?: CanonicalCaptureMetadata;
};

export type RouteCaptureResult = IntelligentCaptureRuntimeOperationEnvelope & {
  result?: CaptureResult;
  source?: CaptureSource;
  request?: CaptureRequest;
  route?: CaptureRoute;
};

export type EnvelopeCaptureInput = IntelligentCaptureRuntimeOperationalControls & {
  sourceId?: string;
  sourceName?: string;
  captureRequestId?: string;
  routeId?: string;
  origin?: CaptureOrigin;
  channel?: CaptureChannel;
  metadata?: CanonicalCaptureMetadata;
};

export type EnvelopeCaptureResult = IntelligentCaptureRuntimeOperationEnvelope & {
  result?: CaptureResult;
  source?: CaptureSource;
  request?: CaptureRequest;
  route?: CaptureRoute;
  envelope?: CaptureEnvelope;
};

export type CaptureStatsInput = IntelligentCaptureRuntimeOperationalControls & {
  sourceId?: string;
};

export type CaptureStatsResult = IntelligentCaptureRuntimeOperationEnvelope & {
  statistics?: CanonicalCaptureStatistics;
  result?: CaptureResult;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * Todas as deps são estruturais — NÃO consumidas funcionalmente.
 */
export type IntelligentCaptureRuntimeEnterpriseDeps = {
  getScannerRuntimePort?: () => ScannerRuntimePort;
  getWatchFolderRuntimePort?: () => WatchFolderRuntimePort;
  getUploadRuntimePort?: () => UploadRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
};

/** Opções de resolução do IntelligentCaptureRuntimePort. */
export type IntelligentCaptureRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (F3-CAP-04).
   */
  provider?: IntelligentCaptureRuntimeProviderId;
  enterpriseDeps?: IntelligentCaptureRuntimeEnterpriseDeps;
};

/** Entrada de registro no IntelligentCaptureRuntimeRegistry. */
export type IntelligentCaptureRuntimeRegistration = {
  providerId: IntelligentCaptureRuntimeProviderId;
  name: string;
  version: string;
  status: IntelligentCaptureRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: IntelligentCaptureRuntimeCapabilities;
  description?: string;
};
