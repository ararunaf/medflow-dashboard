/**
 * Tipos vendor-agnósticos do Enterprise Watch Folder Runtime — F3-CAP-02.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → WatchFolderRuntimePort
 *     → Adapter → Watch Folder Runtime Store → Canonical Watch Folder Result
 *
 * Sem Watch Folder real. Sem Local/Network/UNC/SMB/Azure Files.
 * Sem FileSystemWatcher. Sem Polling. Sem Importação automática. Sem monitoramento real.
 */
import type { CaptureEngineRuntimePort } from "../../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ScannerRuntimePort } from "../../scanner-runtime/ports/scanner-runtime-port";
import type {
  CanonicalWatchFolder,
  CanonicalWatchFolderObservation,
  CanonicalWatchFolderCapabilities,
  CanonicalWatchFolderHealth,
  CanonicalWatchFolderMetadata,
  CanonicalWatchFolderResult,
  CanonicalWatchFolderSession,
  CanonicalWatchFolderStatistics,
} from "./canonical";
import type { WatchFolderRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalWatchFolder,
  CanonicalWatchFolderObservation,
  CanonicalWatchFolderCapabilities,
  CanonicalWatchFolderHealth,
  CanonicalWatchFolderIdentity,
  CanonicalWatchFolderMetadata,
  CanonicalWatchFolderOperation,
  CanonicalWatchFolderProvider,
  CanonicalWatchFolderResult,
  CanonicalWatchFolderSession,
  CanonicalWatchFolderStatistics,
  CanonicalWatchFolderStatus,
} from "./canonical";
export type { WatchFolderRuntimeCapabilities };

/** Provedores / mecanismos do Watch Folder Runtime. */
export type WatchFolderRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type WatchFolderRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type WatchFolderRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type WatchFolderRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: WatchFolderRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type WatchFolderRuntimeHealth = CanonicalWatchFolderHealth & {
  provider: WatchFolderRuntimeProviderId;
  status?: WatchFolderRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type WatchFolderRuntimePortCapabilities = {
  provider: WatchFolderRuntimeProviderId;
  adapterId: string;
  engine: WatchFolderRuntimeCapabilities;
  canonical: CanonicalWatchFolderCapabilities;
  supportsCanonicalWatchFolder: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesScannerRuntimePort: boolean;
  usesCaptureEngineRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  runtimeReady: true;
  localWatchImplemented: false;
  networkWatchImplemented: false;
  uncImplemented: false;
  smbImplemented: false;
  azureFilesImplemented: false;
  pollingImplemented: false;
  fileSystemWatcherImplemented: false;
  recursiveWatchImplemented: false;
  changeNotificationImplemented: false;
  automaticImportImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type WatchFolderRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo(). */
export type WatchFolderRuntimeInfo = {
  providerId: WatchFolderRuntimeProviderId;
  metadata: WatchFolderRuntimeProviderMetadata;
  status: WatchFolderRuntimeStatus;
  providerType: "WATCH_FOLDER_RUNTIME";
  capabilities: WatchFolderRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type WatchFolderRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type WatchFolderRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: WatchFolderRuntimeProviderId;
  telemetry: WatchFolderRuntimeTelemetry;
  logs?: readonly WatchFolderRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterWatchFolderInput = WatchFolderRuntimeOperationalControls & {
  watchFolderName?: string;
  watchFolderId?: string;
  /** Caminho estrutural opaco — nunca lido do filesystem nesta fundação. */
  folderPath?: string;
  correlationId?: string | null;
  metadata?: CanonicalWatchFolderMetadata;
};

export type RegisterWatchFolderResult = WatchFolderRuntimeOperationEnvelope & {
  result?: CanonicalWatchFolderResult;
  watchFolder?: CanonicalWatchFolder;
};

export type UnregisterWatchFolderInput = WatchFolderRuntimeOperationalControls & {
  watchFolderId: string;
};

export type UnregisterWatchFolderResult = WatchFolderRuntimeOperationEnvelope & {
  result?: CanonicalWatchFolderResult;
  watchFolder?: CanonicalWatchFolder;
};

export type DiscoverWatchFoldersInput = WatchFolderRuntimeOperationalControls & {
  correlationId?: string | null;
  metadata?: CanonicalWatchFolderMetadata;
};

export type DiscoverWatchFoldersResult = WatchFolderRuntimeOperationEnvelope & {
  result?: CanonicalWatchFolderResult;
  watchFolders?: readonly CanonicalWatchFolder[];
};

export type OpenWatchFolderSessionInput = WatchFolderRuntimeOperationalControls & {
  watchFolderId?: string;
  watchFolderName?: string;
  sessionId?: string;
  metadata?: CanonicalWatchFolderMetadata;
};

export type OpenWatchFolderSessionResult = WatchFolderRuntimeOperationEnvelope & {
  result?: CanonicalWatchFolderResult;
  watchFolder?: CanonicalWatchFolder;
  session?: CanonicalWatchFolderSession;
};

export type CloseWatchFolderSessionInput = WatchFolderRuntimeOperationalControls & {
  sessionId: string;
};

export type CloseWatchFolderSessionResult = WatchFolderRuntimeOperationEnvelope & {
  result?: CanonicalWatchFolderResult;
  session?: CanonicalWatchFolderSession;
};

export type ObserveWatchFolderInput = WatchFolderRuntimeOperationalControls & {
  watchFolderId?: string;
  sessionId?: string;
  metadata?: CanonicalWatchFolderMetadata;
};

export type ObserveWatchFolderResult = WatchFolderRuntimeOperationEnvelope & {
  result?: CanonicalWatchFolderResult;
  watchFolder?: CanonicalWatchFolder;
  session?: CanonicalWatchFolderSession;
  observation?: CanonicalWatchFolderObservation;
};

export type WatchFolderStatsInput = WatchFolderRuntimeOperationalControls & {
  watchFolderId?: string;
};

export type WatchFolderStatsResult = WatchFolderRuntimeOperationEnvelope & {
  statistics?: CanonicalWatchFolderStatistics;
  result?: CanonicalWatchFolderResult;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * Todas as deps são estruturais — NÃO consumidas funcionalmente.
 */
export type WatchFolderRuntimeEnterpriseDeps = {
  getScannerRuntimePort?: () => ScannerRuntimePort;
  getCaptureEngineRuntimePort?: () => CaptureEngineRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
};

/** Opções de resolução do WatchFolderRuntimePort. */
export type WatchFolderRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (F3-CAP-02).
   */
  provider?: WatchFolderRuntimeProviderId;
  enterpriseDeps?: WatchFolderRuntimeEnterpriseDeps;
};

/** Entrada de registro no WatchFolderRuntimeRegistry. */
export type WatchFolderRuntimeRegistration = {
  providerId: WatchFolderRuntimeProviderId;
  name: string;
  version: string;
  status: WatchFolderRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: WatchFolderRuntimeCapabilities;
  description?: string;
};
