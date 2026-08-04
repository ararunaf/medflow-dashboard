/**
 * Enterprise Scanner Runtime — Ports & Adapters (F3-CAP-01).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → ScannerRuntimePort
 *     → DefaultScannerRuntimeAdapter / EnterpriseScannerRuntimeAdapter / MockScannerRuntimeAdapter
 *     → InMemoryScannerRuntimeStore
 *     → Canonical Scanner Result
 *
 * F3-CAP-01: infraestrutura canônica vendor-agnostic para scanners futuros.
 * Sem Scanner real. Sem TWAIN / WIA / ISIS. Sem USB / Rede.
 * Sem Drivers. Sem OCR. Sem Upload. Sem Watch Folder.
 * Sem captura automática. Sem filas. Sem banco. Sem API.
 * Dependências Capture/OCR/Queue/Worker/Scheduler/PersistentQueue/Observability/Scalability/TISS
 * preparadas — sem consumo funcional.
 * Toda comunicação exclusivamente via ScannerRuntimePort.
 */
export type {
  AcquireScannerInput,
  AcquireScannerResult,
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
  CloseScannerSessionInput,
  CloseScannerSessionResult,
  DiscoverScannersInput,
  DiscoverScannersResult,
  OpenScannerSessionInput,
  OpenScannerSessionResult,
  RegisterScannerInput,
  RegisterScannerResult,
  ScannerRuntimeCapabilities,
  ScannerRuntimeEnterpriseDeps,
  ScannerRuntimeHealth,
  ScannerRuntimeInfo,
  ScannerRuntimeOperationEnvelope,
  ScannerRuntimeOperationalControls,
  ScannerRuntimeOptions,
  ScannerRuntimePort,
  ScannerRuntimePortCapabilities,
  ScannerRuntimeProviderId,
  ScannerRuntimeProviderMetadata,
  ScannerRuntimeRegistration,
  ScannerRuntimeStatus,
  ScannerRuntimeStructuredLog,
  ScannerRuntimeTelemetry,
  ScannerStatsInput,
  ScannerStatsResult,
  UnregisterScannerInput,
  UnregisterScannerResult,
} from "./ports";

export {
  DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES,
  DEFAULT_SCANNER_RUNTIME_CAPABILITIES,
  SCANNER_RUNTIME_IDENTITY,
  createScannerAcquisitionId,
  createScannerId,
  createScannerResultId,
  createScannerRuntimeRequestId,
  createScannerSessionId,
  defineScannerRuntimeCapabilities,
  emptyScannerRuntimeCapabilities,
  resetScannerRuntimeIdSequences,
  toCanonicalScannerCapabilities,
} from "./ports";

export {
  DEFAULT_SCANNER_RUNTIME_ADAPTER_ID,
  DEFAULT_SCANNER_RUNTIME_VERSION,
  DEFAULT_MOCK_SCANNER_RUNTIME_VERSION,
  DefaultScannerRuntimeAdapter,
  EnterpriseScannerRuntimeAdapter,
  MOCK_SCANNER_RUNTIME_ADAPTER_ID,
  MockScannerRuntimeAdapter,
  type DefaultScannerRuntimeAdapterOptions,
  type MockScannerRuntimeAdapterOptions,
} from "./adapters";

export {
  ScannerRuntimeFactory,
  createScannerRuntimeFactory,
  type ScannerRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_SCANNER_RUNTIME_PROVIDER_COUNT,
  ScannerRuntimeRegistry,
  createDefaultScannerRuntimeRegistry,
  type ScannerRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_SCANNER_RUNTIME_STORE_ID,
  InMemoryScannerRuntimeStore,
  type InMemoryScannerRuntimeStoreOptions,
  type StoredCanonicalScanner,
  type StoredCanonicalScannerAcquisition,
  type StoredCanonicalScannerSession,
  type ScannerRuntimeStore,
} from "./store";

export {
  ScannerRuntimeProvider,
  createScannerRuntimePort,
  getScannerRuntimeFactory,
  getScannerRuntimePort,
} from "./providers";

export { getScannerRuntimeHealthSummary, type ScannerRuntimeHealthSummary } from "./demo";
