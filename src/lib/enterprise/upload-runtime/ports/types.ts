/**
 * Tipos vendor-agnósticos do Enterprise Upload Runtime — F3-CAP-03.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → UploadRuntimePort
 *     → Adapter → Upload Runtime Store → Canonical Upload Result
 *
 * Sem Upload real. Sem Upload Web/Desktop/Mobile/API real. Sem storage providers.
 * Sem HTTP upload. Sem leitura de arquivos. Sem OCR. Sem filas. Sem processamento.
 */
import type { CaptureEngineRuntimePort } from "../../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ScannerRuntimePort } from "../../scanner-runtime/ports/scanner-runtime-port";
import type { WatchFolderRuntimePort } from "../../watch-folder-runtime/ports/watch-folder-runtime-port";
import type {
  CanonicalUpload,
  CanonicalUploadReceipt,
  CanonicalUploadCapabilities,
  CanonicalUploadHealth,
  CanonicalUploadMetadata,
  CanonicalUploadResult,
  CanonicalUploadSession,
  CanonicalUploadStatistics,
} from "./canonical";
import type { UploadRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalUpload,
  CanonicalUploadReceipt,
  CanonicalUploadCapabilities,
  CanonicalUploadHealth,
  CanonicalUploadIdentity,
  CanonicalUploadMetadata,
  CanonicalUploadOperation,
  CanonicalUploadProvider,
  CanonicalUploadResult,
  CanonicalUploadSession,
  CanonicalUploadStatistics,
  CanonicalUploadStatus,
} from "./canonical";
export type { UploadRuntimeCapabilities };

/** Provedores / mecanismos do Upload Runtime. */
export type UploadRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type UploadRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type UploadRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type UploadRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: UploadRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type UploadRuntimeHealth = CanonicalUploadHealth & {
  provider: UploadRuntimeProviderId;
  status?: UploadRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type UploadRuntimePortCapabilities = {
  provider: UploadRuntimeProviderId;
  adapterId: string;
  engine: UploadRuntimeCapabilities;
  canonical: CanonicalUploadCapabilities;
  supportsCanonicalUpload: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesScannerRuntimePort: boolean;
  usesWatchFolderRuntimePort: boolean;
  usesCaptureEngineRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  runtimeReady: true;
  webUploadImplemented: false;
  desktopUploadImplemented: false;
  mobileUploadImplemented: false;
  apiUploadImplemented: false;
  multipartImplemented: false;
  chunkedUploadImplemented: false;
  resumableUploadImplemented: false;
  azureBlobImplemented: false;
  supabaseStorageImplemented: false;
  s3Implemented: false;
  googleDriveImplemented: false;
  oneDriveImplemented: false;
  dropboxImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type UploadRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo(). */
export type UploadRuntimeInfo = {
  providerId: UploadRuntimeProviderId;
  metadata: UploadRuntimeProviderMetadata;
  status: UploadRuntimeStatus;
  providerType: "UPLOAD_RUNTIME";
  capabilities: UploadRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type UploadRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type UploadRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: UploadRuntimeProviderId;
  telemetry: UploadRuntimeTelemetry;
  logs?: readonly UploadRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterUploadInput = UploadRuntimeOperationalControls & {
  uploadName?: string;
  uploadId?: string;
  /** Caminho estrutural opaco — nunca lido do filesystem nesta fundação. */
  channelKey?: string;
  correlationId?: string | null;
  metadata?: CanonicalUploadMetadata;
};

export type RegisterUploadResult = UploadRuntimeOperationEnvelope & {
  result?: CanonicalUploadResult;
  upload?: CanonicalUpload;
};

export type UnregisterUploadInput = UploadRuntimeOperationalControls & {
  uploadId: string;
};

export type UnregisterUploadResult = UploadRuntimeOperationEnvelope & {
  result?: CanonicalUploadResult;
  upload?: CanonicalUpload;
};

export type DiscoverUploadsInput = UploadRuntimeOperationalControls & {
  correlationId?: string | null;
  metadata?: CanonicalUploadMetadata;
};

export type DiscoverUploadsResult = UploadRuntimeOperationEnvelope & {
  result?: CanonicalUploadResult;
  uploads?: readonly CanonicalUpload[];
};

export type OpenUploadSessionInput = UploadRuntimeOperationalControls & {
  uploadId?: string;
  uploadName?: string;
  sessionId?: string;
  metadata?: CanonicalUploadMetadata;
};

export type OpenUploadSessionResult = UploadRuntimeOperationEnvelope & {
  result?: CanonicalUploadResult;
  upload?: CanonicalUpload;
  session?: CanonicalUploadSession;
};

export type CloseUploadSessionInput = UploadRuntimeOperationalControls & {
  sessionId: string;
};

export type CloseUploadSessionResult = UploadRuntimeOperationEnvelope & {
  result?: CanonicalUploadResult;
  session?: CanonicalUploadSession;
};

export type ReceiveUploadInput = UploadRuntimeOperationalControls & {
  uploadId?: string;
  uploadName?: string;
  sessionId?: string;
  metadata?: CanonicalUploadMetadata;
};

export type ReceiveUploadResult = UploadRuntimeOperationEnvelope & {
  result?: CanonicalUploadResult;
  upload?: CanonicalUpload;
  session?: CanonicalUploadSession;
  receipt?: CanonicalUploadReceipt;
};

export type UploadStatsInput = UploadRuntimeOperationalControls & {
  uploadId?: string;
};

export type UploadStatsResult = UploadRuntimeOperationEnvelope & {
  statistics?: CanonicalUploadStatistics;
  result?: CanonicalUploadResult;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * Todas as deps são estruturais — NÃO consumidas funcionalmente.
 */
export type UploadRuntimeEnterpriseDeps = {
  getScannerRuntimePort?: () => ScannerRuntimePort;
  getWatchFolderRuntimePort?: () => WatchFolderRuntimePort;
  getCaptureEngineRuntimePort?: () => CaptureEngineRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
};

/** Opções de resolução do UploadRuntimePort. */
export type UploadRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (F3-CAP-03).
   */
  provider?: UploadRuntimeProviderId;
  enterpriseDeps?: UploadRuntimeEnterpriseDeps;
};

/** Entrada de registro no UploadRuntimeRegistry. */
export type UploadRuntimeRegistration = {
  providerId: UploadRuntimeProviderId;
  name: string;
  version: string;
  status: UploadRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: UploadRuntimeCapabilities;
  description?: string;
};
