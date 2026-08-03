/**
 * Enterprise Persistent Queue Runtime — Ports & Adapters (INF-08).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → PersistentQueueRuntimePort
 *     → DefaultPersistentQueueRuntimeAdapter / EnterprisePersistentQueueRuntimeAdapter / MockPersistentQueueRuntimeAdapter
 *     → InMemoryPersistentQueueRuntimeStore
 *     → Canonical Persistent Queue Result
 *
 * INF-08: infraestrutura canônica de gerenciamento estrutural de filas persistentes futuras.
 * Sem RabbitMQ. Sem Kafka. Sem Azure Service Bus. Sem Azure Queue. Sem Redis Streams. Sem BullMQ.
 * Sem Dead Letter / Retry / Delay / Priority Queue reais. Sem Message Persistence real.
 * Sem Workers reais. Sem Scheduler real. Sem processamento assíncrono.
 * Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
 * Dependências Queue Runtime + Worker Runtime + Scheduler Runtime preparadas — sem consumo/execução.
 * Toda comunicação exclusivamente via PersistentQueueRuntimePort.
 */
export type {
  ReleaseMessageInput,
  ReleaseMessageResult,
  CanonicalPersistentQueue,
  CanonicalPersistentQueueCapabilities,
  CanonicalPersistentEnvelope,
  CanonicalPersistentQueueHealth,
  CanonicalPersistentQueueIdentity,
  CanonicalPersistentMessage,
  CanonicalPersistentQueueMetadata,
  CanonicalPersistentQueueOperation,
  CanonicalPersistentQueueProvider,
  CanonicalPersistentQueueResult,
  CanonicalPersistentQueueStatistics,
  CanonicalPersistentQueueStatus,
  ListPersistentQueuesInput,
  ListPersistentQueuesResult,
  RegisterPersistentQueueInput,
  RegisterPersistentQueueResult,
  PersistMessageInput,
  PersistMessageResult,
  PersistentQueueRuntimeCapabilities,
  PersistentQueueRuntimeEnterpriseDeps,
  PersistentQueueRuntimeHealth,
  PersistentQueueRuntimeInfo,
  PersistentQueueRuntimeOperationEnvelope,
  PersistentQueueRuntimeOperationalControls,
  PersistentQueueRuntimeOptions,
  PersistentQueueRuntimePort,
  PersistentQueueRuntimePortCapabilities,
  PersistentQueueRuntimeProviderId,
  PersistentQueueRuntimeProviderMetadata,
  PersistentQueueRuntimeRegistration,
  PersistentQueueRuntimeStatus,
  PersistentQueueRuntimeStructuredLog,
  PersistentQueueRuntimeTelemetry,
  PersistentQueueStatsInput,
  PersistentQueueStatsResult,
  UnregisterPersistentQueueInput,
  UnregisterPersistentQueueResult,
} from "./ports";

export {
  DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
  createPersistentQueueId,
  createPersistentEnvelopeId,
  createPersistentMessageId,
  createPersistentQueueResultId,
  createPersistentQueueRuntimeRequestId,
  definePersistentQueueRuntimeCapabilities,
  emptyPersistentQueueRuntimeCapabilities,
  resetPersistentQueueRuntimeIdSequences,
  toCanonicalPersistentQueueCapabilities,
} from "./ports";

export {
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_VERSION,
  DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_VERSION,
  DefaultPersistentQueueRuntimeAdapter,
  EnterprisePersistentQueueRuntimeAdapter,
  MOCK_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
  MockPersistentQueueRuntimeAdapter,
  type DefaultPersistentQueueRuntimeAdapterOptions,
  type MockPersistentQueueRuntimeAdapterOptions,
} from "./adapters";

export {
  PersistentQueueRuntimeFactory,
  createPersistentQueueRuntimeFactory,
  type PersistentQueueRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_PERSISTENT_QUEUE_RUNTIME_PROVIDER_COUNT,
  PersistentQueueRuntimeRegistry,
  createDefaultPersistentQueueRuntimeRegistry,
  type PersistentQueueRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_PERSISTENT_QUEUE_RUNTIME_STORE_ID,
  InMemoryPersistentQueueRuntimeStore,
  type InMemoryPersistentQueueRuntimeStoreOptions,
  type StoredCanonicalPersistentQueue,
  type StoredCanonicalPersistentEnvelope,
  type StoredCanonicalPersistentMessage,
  type PersistentQueueRuntimeStore,
} from "./store";

export {
  PersistentQueueRuntimeProvider,
  createPersistentQueueRuntimePort,
  getPersistentQueueRuntimeFactory,
} from "./providers";

export {
  getPersistentQueueRuntimeHealthSummary,
  type PersistentQueueRuntimeHealthSummary,
} from "./demo";
