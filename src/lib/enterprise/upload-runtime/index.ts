/**
 * Enterprise Upload Runtime — Ports & Adapters (F3-CAP-03).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → UploadRuntimePort
 *     → DefaultUploadRuntimeAdapter / EnterpriseUploadRuntimeAdapter / MockUploadRuntimeAdapter
 *     → InMemoryUploadRuntimeStore
 *     → Canonical Upload Result
 *
 * F3-CAP-03: infraestrutura canônica vendor-agnostic para uploads futuros.
 * Sem Upload real. Sem Upload Web/Desktop/Mobile/API. Sem Multipart/Chunked/Resumable. Sem Azure Blob/Supabase/S3/Drive/OneDrive/Dropbox. Sem Polling.
 * Sem FileSystemWatcher. Sem OCR. Sem Importação automática. Sem monitoramento real.
 * Sem captura automática. Sem filas. Sem banco. Sem API.
 * Dependências Scanner/WatchFolder/Capture/OCR/PersistentQueue/Scheduler/Worker/Observability
 * preparadas — sem consumo funcional.
 * Toda comunicação exclusivamente via UploadRuntimePort.
 */
export type {
  ReceiveUploadInput,
  ReceiveUploadResult,
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
  CloseUploadSessionInput,
  CloseUploadSessionResult,
  DiscoverUploadsInput,
  DiscoverUploadsResult,
  OpenUploadSessionInput,
  OpenUploadSessionResult,
  RegisterUploadInput,
  RegisterUploadResult,
  UploadRuntimeCapabilities,
  UploadRuntimeEnterpriseDeps,
  UploadRuntimeHealth,
  UploadRuntimeInfo,
  UploadRuntimeOperationEnvelope,
  UploadRuntimeOperationalControls,
  UploadRuntimeOptions,
  UploadRuntimePort,
  UploadRuntimePortCapabilities,
  UploadRuntimeProviderId,
  UploadRuntimeProviderMetadata,
  UploadRuntimeRegistration,
  UploadRuntimeStatus,
  UploadRuntimeStructuredLog,
  UploadRuntimeTelemetry,
  UploadStatsInput,
  UploadStatsResult,
  UnregisterUploadInput,
  UnregisterUploadResult,
} from "./ports";

export {
  DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES,
  DEFAULT_UPLOAD_RUNTIME_CAPABILITIES,
  UPLOAD_RUNTIME_IDENTITY,
  createUploadReceiptId,
  createUploadId,
  createUploadResultId,
  createUploadRuntimeRequestId,
  createUploadSessionId,
  defineUploadRuntimeCapabilities,
  emptyUploadRuntimeCapabilities,
  resetUploadRuntimeIdSequences,
  toCanonicalUploadCapabilities,
} from "./ports";

export {
  DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID,
  DEFAULT_UPLOAD_RUNTIME_VERSION,
  DEFAULT_MOCK_UPLOAD_RUNTIME_VERSION,
  DefaultUploadRuntimeAdapter,
  EnterpriseUploadRuntimeAdapter,
  MOCK_UPLOAD_RUNTIME_ADAPTER_ID,
  MockUploadRuntimeAdapter,
  type DefaultUploadRuntimeAdapterOptions,
  type MockUploadRuntimeAdapterOptions,
} from "./adapters";

export {
  UploadRuntimeFactory,
  createUploadRuntimeFactory,
  type UploadRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_UPLOAD_RUNTIME_PROVIDER_COUNT,
  UploadRuntimeRegistry,
  createDefaultUploadRuntimeRegistry,
  type UploadRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_UPLOAD_RUNTIME_STORE_ID,
  InMemoryUploadRuntimeStore,
  type InMemoryUploadRuntimeStoreOptions,
  type StoredCanonicalUpload,
  type StoredCanonicalUploadReceipt,
  type StoredCanonicalUploadSession,
  type UploadRuntimeStore,
} from "./store";

export {
  UploadRuntimeProvider,
  createUploadRuntimePort,
  getUploadRuntimeFactory,
  getUploadRuntimePort,
} from "./providers";

export { getUploadRuntimeHealthSummary, type UploadRuntimeHealthSummary } from "./demo";
