/**
 * Enterprise Intelligent Capture Runtime — Ports & Adapters (F3-CAP-04).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → IntelligentCaptureRuntimePort
 *     → DefaultIntelligentCaptureRuntimeAdapter / EnterpriseIntelligentCaptureRuntimeAdapter / MockIntelligentCaptureRuntimeAdapter
 *     → InMemoryIntelligentCaptureRuntimeStore
 *     → CaptureResult
 *
 * F3-CAP-04: infraestrutura canônica de integração estrutural entre
 * Scanner Runtime, Watch Folder Runtime e Upload Runtime.
 * Sem OCR. Sem IA. Sem Pipeline. Sem captura automática. Sem leitura de arquivos.
 * Sem processamento documental. Sem filas. Sem banco. Sem API.
 * Dependências Scanner/WatchFolder/Upload/OCR/PersistentQueue/Scheduler/Worker/Observability
 * preparadas — sem consumo funcional.
 * Toda comunicação exclusivamente via IntelligentCaptureRuntimePort.
 */
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
  CloseCaptureRequestInput,
  CloseCaptureRequestResult,
  DiscoverCaptureSourcesInput,
  DiscoverCaptureSourcesResult,
  EnvelopeCaptureInput,
  EnvelopeCaptureResult,
  IntelligentCaptureRuntimeCapabilities,
  IntelligentCaptureRuntimeEnterpriseDeps,
  IntelligentCaptureRuntimeHealth,
  IntelligentCaptureRuntimeInfo,
  IntelligentCaptureRuntimeOperationEnvelope,
  IntelligentCaptureRuntimeOperationalControls,
  IntelligentCaptureRuntimeOptions,
  IntelligentCaptureRuntimePort,
  IntelligentCaptureRuntimePortCapabilities,
  IntelligentCaptureRuntimeProviderId,
  IntelligentCaptureRuntimeProviderMetadata,
  IntelligentCaptureRuntimeRegistration,
  IntelligentCaptureRuntimeStatus,
  IntelligentCaptureRuntimeStructuredLog,
  IntelligentCaptureRuntimeTelemetry,
  OpenCaptureRequestInput,
  OpenCaptureRequestResult,
  RegisterCaptureSourceInput,
  RegisterCaptureSourceResult,
  RouteCaptureInput,
  RouteCaptureResult,
  CaptureStatsInput,
  CaptureStatsResult,
  UnregisterCaptureSourceInput,
  UnregisterCaptureSourceResult,
} from "./ports";

export {
  DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
  INTELLIGENT_CAPTURE_RUNTIME_IDENTITY,
  createCaptureEnvelopeId,
  createCaptureRequestId,
  createCaptureResultId,
  createCaptureRouteId,
  createCaptureSourceId,
  createIntelligentCaptureRuntimeRequestId,
  defineIntelligentCaptureRuntimeCapabilities,
  emptyIntelligentCaptureRuntimeCapabilities,
  resetIntelligentCaptureRuntimeIdSequences,
  toCanonicalCaptureCapabilities,
} from "./ports";

export {
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
  DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
  DefaultIntelligentCaptureRuntimeAdapter,
  EnterpriseIntelligentCaptureRuntimeAdapter,
  MOCK_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
  MockIntelligentCaptureRuntimeAdapter,
  type DefaultIntelligentCaptureRuntimeAdapterOptions,
  type MockIntelligentCaptureRuntimeAdapterOptions,
} from "./adapters";

export {
  IntelligentCaptureRuntimeFactory,
  createIntelligentCaptureRuntimeFactory,
  type IntelligentCaptureRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_INTELLIGENT_CAPTURE_RUNTIME_PROVIDER_COUNT,
  IntelligentCaptureRuntimeRegistry,
  createDefaultIntelligentCaptureRuntimeRegistry,
  type IntelligentCaptureRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_INTELLIGENT_CAPTURE_RUNTIME_STORE_ID,
  InMemoryIntelligentCaptureRuntimeStore,
  type InMemoryIntelligentCaptureRuntimeStoreOptions,
  type StoredCaptureEnvelope,
  type StoredCaptureRequest,
  type StoredCaptureRoute,
  type StoredCaptureSource,
  type IntelligentCaptureRuntimeStore,
} from "./store";

export {
  IntelligentCaptureRuntimeProvider,
  createIntelligentCaptureRuntimePort,
  getIntelligentCaptureRuntimeFactory,
  getIntelligentCaptureRuntimePort,
} from "./providers";

export {
  getIntelligentCaptureRuntimeHealthSummary,
  type IntelligentCaptureRuntimeHealthSummary,
} from "./demo";
