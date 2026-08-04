/**
 * Enterprise Watch Folder Runtime — Ports & Adapters (F3-CAP-02).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → WatchFolderRuntimePort
 *     → DefaultWatchFolderRuntimeAdapter / EnterpriseWatchFolderRuntimeAdapter / MockWatchFolderRuntimeAdapter
 *     → InMemoryWatchFolderRuntimeStore
 *     → Canonical Watch Folder Result
 *
 * F3-CAP-02: infraestrutura canônica vendor-agnostic para watch folders futuros.
 * Sem Watch Folder real. Sem Local / Network / UNC / SMB / Azure Files. Sem Polling.
 * Sem FileSystemWatcher. Sem OCR. Sem Importação automática. Sem monitoramento real.
 * Sem captura automática. Sem filas. Sem banco. Sem API.
 * Dependências Scanner/Capture/OCR/PersistentQueue/Scheduler/Worker/Observability
 * preparadas — sem consumo funcional.
 * Toda comunicação exclusivamente via WatchFolderRuntimePort.
 */
export type {
  ObserveWatchFolderInput,
  ObserveWatchFolderResult,
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
  CloseWatchFolderSessionInput,
  CloseWatchFolderSessionResult,
  DiscoverWatchFoldersInput,
  DiscoverWatchFoldersResult,
  OpenWatchFolderSessionInput,
  OpenWatchFolderSessionResult,
  RegisterWatchFolderInput,
  RegisterWatchFolderResult,
  WatchFolderRuntimeCapabilities,
  WatchFolderRuntimeEnterpriseDeps,
  WatchFolderRuntimeHealth,
  WatchFolderRuntimeInfo,
  WatchFolderRuntimeOperationEnvelope,
  WatchFolderRuntimeOperationalControls,
  WatchFolderRuntimeOptions,
  WatchFolderRuntimePort,
  WatchFolderRuntimePortCapabilities,
  WatchFolderRuntimeProviderId,
  WatchFolderRuntimeProviderMetadata,
  WatchFolderRuntimeRegistration,
  WatchFolderRuntimeStatus,
  WatchFolderRuntimeStructuredLog,
  WatchFolderRuntimeTelemetry,
  WatchFolderStatsInput,
  WatchFolderStatsResult,
  UnregisterWatchFolderInput,
  UnregisterWatchFolderResult,
} from "./ports";

export {
  DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES,
  DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES,
  WATCH_FOLDER_RUNTIME_IDENTITY,
  createWatchFolderObservationId,
  createWatchFolderId,
  createWatchFolderResultId,
  createWatchFolderRuntimeRequestId,
  createWatchFolderSessionId,
  defineWatchFolderRuntimeCapabilities,
  emptyWatchFolderRuntimeCapabilities,
  resetWatchFolderRuntimeIdSequences,
  toCanonicalWatchFolderCapabilities,
} from "./ports";

export {
  DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
  DEFAULT_WATCH_FOLDER_RUNTIME_VERSION,
  DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_VERSION,
  DefaultWatchFolderRuntimeAdapter,
  EnterpriseWatchFolderRuntimeAdapter,
  MOCK_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
  MockWatchFolderRuntimeAdapter,
  type DefaultWatchFolderRuntimeAdapterOptions,
  type MockWatchFolderRuntimeAdapterOptions,
} from "./adapters";

export {
  WatchFolderRuntimeFactory,
  createWatchFolderRuntimeFactory,
  type WatchFolderRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_WATCH_FOLDER_RUNTIME_PROVIDER_COUNT,
  WatchFolderRuntimeRegistry,
  createDefaultWatchFolderRuntimeRegistry,
  type WatchFolderRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_WATCH_FOLDER_RUNTIME_STORE_ID,
  InMemoryWatchFolderRuntimeStore,
  type InMemoryWatchFolderRuntimeStoreOptions,
  type StoredCanonicalWatchFolder,
  type StoredCanonicalWatchFolderObservation,
  type StoredCanonicalWatchFolderSession,
  type WatchFolderRuntimeStore,
} from "./store";

export {
  WatchFolderRuntimeProvider,
  createWatchFolderRuntimePort,
  getWatchFolderRuntimeFactory,
  getWatchFolderRuntimePort,
} from "./providers";

export { getWatchFolderRuntimeHealthSummary, type WatchFolderRuntimeHealthSummary } from "./demo";
