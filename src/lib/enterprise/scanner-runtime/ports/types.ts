/**
 * Tipos vendor-agnósticos do Enterprise Scanner Runtime — F3-CAP-01.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → ScannerRuntimePort
 *     → Adapter → Scanner Runtime Store → Canonical Scanner Result
 *
 * Sem Scanner real. Sem TWAIN/WIA/ISIS. Sem Drivers. Sem OCR/Upload/Watch Folder.
 */
import type { CaptureEngineRuntimePort } from "../../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";
import type { TISSRuntimePort } from "../../tiss-runtime/ports/tiss-runtime-port";
import type {
  CanonicalScanner,
  CanonicalScannerAcquisition,
  CanonicalScannerCapabilities,
  CanonicalScannerHealth,
  CanonicalScannerMetadata,
  CanonicalScannerResult,
  CanonicalScannerSession,
  CanonicalScannerStatistics,
} from "./canonical";
import type { ScannerRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalScanner,
  CanonicalScannerAcquisition,
  CanonicalScannerCapabilities,
  CanonicalScannerHealth,
  CanonicalScannerIdentity,
  CanonicalScannerMetadata,
  CanonicalScannerOperation,
  CanonicalScannerProvider,
  CanonicalScannerResult,
  CanonicalScannerSession,
  CanonicalScannerStatistics,
  CanonicalScannerStatus,
} from "./canonical";
export type { ScannerRuntimeCapabilities };

/** Provedores / mecanismos do Scanner Runtime. */
export type ScannerRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type ScannerRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type ScannerRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type ScannerRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: ScannerRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type ScannerRuntimeHealth = CanonicalScannerHealth & {
  provider: ScannerRuntimeProviderId;
  status?: ScannerRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type ScannerRuntimePortCapabilities = {
  provider: ScannerRuntimeProviderId;
  adapterId: string;
  engine: ScannerRuntimeCapabilities;
  canonical: CanonicalScannerCapabilities;
  supportsCanonicalScanner: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesCaptureEngineRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  usesScalabilityRuntimePort: boolean;
  usesTISSRuntimePort: boolean;
  runtimeReady: true;
  scannerImplemented: false;
  twainImplemented: false;
  wiaImplemented: false;
  isisImplemented: false;
  networkScannerImplemented: false;
  driverImplemented: false;
  captureImplemented: false;
  implementsTwain: false;
  implementsWia: false;
  implementsIsis: false;
  implementsUsb: false;
  implementsNetworkScanner: false;
  implementsWatchFolder: false;
  implementsOcr: false;
  implementsUpload: false;
  implementsHttp: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type ScannerRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo(). */
export type ScannerRuntimeInfo = {
  providerId: ScannerRuntimeProviderId;
  metadata: ScannerRuntimeProviderMetadata;
  status: ScannerRuntimeStatus;
  providerType: "SCANNER_RUNTIME";
  capabilities: ScannerRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type ScannerRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type ScannerRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: ScannerRuntimeProviderId;
  telemetry: ScannerRuntimeTelemetry;
  logs?: readonly ScannerRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterScannerInput = ScannerRuntimeOperationalControls & {
  scannerName?: string;
  scannerId?: string;
  correlationId?: string | null;
  metadata?: CanonicalScannerMetadata;
};

export type RegisterScannerResult = ScannerRuntimeOperationEnvelope & {
  result?: CanonicalScannerResult;
  scanner?: CanonicalScanner;
};

export type UnregisterScannerInput = ScannerRuntimeOperationalControls & {
  scannerId: string;
};

export type UnregisterScannerResult = ScannerRuntimeOperationEnvelope & {
  result?: CanonicalScannerResult;
  scanner?: CanonicalScanner;
};

export type DiscoverScannersInput = ScannerRuntimeOperationalControls & {
  correlationId?: string | null;
  metadata?: CanonicalScannerMetadata;
};

export type DiscoverScannersResult = ScannerRuntimeOperationEnvelope & {
  result?: CanonicalScannerResult;
  scanners?: readonly CanonicalScanner[];
};

export type OpenScannerSessionInput = ScannerRuntimeOperationalControls & {
  scannerId?: string;
  scannerName?: string;
  sessionId?: string;
  metadata?: CanonicalScannerMetadata;
};

export type OpenScannerSessionResult = ScannerRuntimeOperationEnvelope & {
  result?: CanonicalScannerResult;
  scanner?: CanonicalScanner;
  session?: CanonicalScannerSession;
};

export type CloseScannerSessionInput = ScannerRuntimeOperationalControls & {
  sessionId: string;
};

export type CloseScannerSessionResult = ScannerRuntimeOperationEnvelope & {
  result?: CanonicalScannerResult;
  session?: CanonicalScannerSession;
};

export type AcquireScannerInput = ScannerRuntimeOperationalControls & {
  scannerId?: string;
  sessionId?: string;
  metadata?: CanonicalScannerMetadata;
};

export type AcquireScannerResult = ScannerRuntimeOperationEnvelope & {
  result?: CanonicalScannerResult;
  scanner?: CanonicalScanner;
  session?: CanonicalScannerSession;
  acquisition?: CanonicalScannerAcquisition;
};

export type ScannerStatsInput = ScannerRuntimeOperationalControls & {
  scannerId?: string;
};

export type ScannerStatsResult = ScannerRuntimeOperationEnvelope & {
  statistics?: CanonicalScannerStatistics;
  result?: CanonicalScannerResult;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * Todas as deps são estruturais — NÃO consumidas funcionalmente.
 */
export type ScannerRuntimeEnterpriseDeps = {
  getCaptureEngineRuntimePort?: () => CaptureEngineRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getQueueRuntimePort?: () => QueueRuntimePort;
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
  getTISSRuntimePort?: () => TISSRuntimePort;
};

/** Opções de resolução do ScannerRuntimePort. */
export type ScannerRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (F3-CAP-01).
   */
  provider?: ScannerRuntimeProviderId;
  enterpriseDeps?: ScannerRuntimeEnterpriseDeps;
};

/** Entrada de registro no ScannerRuntimeRegistry. */
export type ScannerRuntimeRegistration = {
  providerId: ScannerRuntimeProviderId;
  name: string;
  version: string;
  status: ScannerRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: ScannerRuntimeCapabilities;
  description?: string;
};
