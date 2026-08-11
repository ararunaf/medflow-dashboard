/**
 * Enterprise Queue Runtime — Ports & Adapters (INF-05 / OPER-INF-Q).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → QueueRuntimePort
 *     → DefaultQueueRuntimeAdapter / EnterpriseQueueRuntimeAdapter / MockQueueRuntimeAdapter
 *     → InMemoryQueueRuntimeStore + Persistence Backend (Supabase | memory durable)
 *     → Canonical Queue Result
 *
 * OPER-INF-Q: backend persistente ativado no adapter — mesma interface pública.
 * Sem RabbitMQ. Sem Azure Service Bus. Sem Kafka. Sem Redis.
 * Sem workers. Sem scheduler. Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture.
 * Sem acesso direto ao Queue Runtime Store / Backend pelo produto.
 * Toda comunicação exclusivamente via QueueRuntimePort.
 */
export type {
  AckInput,
  AckResult,
  CanonicalQueue,
  CanonicalQueueBatch,
  CanonicalQueueCapabilities,
  CanonicalQueueHealth,
  CanonicalQueueIdentity,
  CanonicalQueueMessage,
  CanonicalQueueMetadata,
  CanonicalQueueOperation,
  CanonicalQueueProvider,
  CanonicalQueueResult,
  CanonicalQueueStatistics,
  CanonicalQueueStatus,
  DequeueInput,
  DequeueResult,
  EnqueueInput,
  EnqueueResult,
  NackInput,
  NackResult,
  PeekInput,
  PeekResult,
  PurgeInput,
  PurgeResult,
  QueueRuntimeCapabilities,
  QueueRuntimeEnterpriseDeps,
  QueueRuntimeHealth,
  QueueRuntimeInfo,
  QueueRuntimeOperationEnvelope,
  QueueRuntimeOperationalControls,
  QueueRuntimeOptions,
  QueueRuntimePort,
  QueueRuntimePortCapabilities,
  QueueRuntimeProviderId,
  QueueRuntimeProviderMetadata,
  QueueRuntimeRegistration,
  QueueRuntimeStatus,
  QueueRuntimeStructuredLog,
  QueueRuntimeTelemetry,
  StatsInput,
  StatsResult,
} from "./ports";

export {
  DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES,
  DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
  createQueueBatchId,
  createQueueId,
  createQueueMessageId,
  createQueueResultId,
  createQueueRuntimeRequestId,
  defineQueueRuntimeCapabilities,
  emptyQueueRuntimeCapabilities,
  resetQueueRuntimeIdSequences,
  toCanonicalQueueCapabilities,
} from "./ports";

export {
  DEFAULT_QUEUE_RUNTIME_ADAPTER_ID,
  DEFAULT_QUEUE_RUNTIME_VERSION,
  DEFAULT_MOCK_QUEUE_RUNTIME_VERSION,
  DefaultQueueRuntimeAdapter,
  EnterpriseQueueRuntimeAdapter,
  MOCK_QUEUE_RUNTIME_ADAPTER_ID,
  MockQueueRuntimeAdapter,
  type DefaultQueueRuntimeAdapterOptions,
  type MockQueueRuntimeAdapterOptions,
} from "./adapters";

export {
  QueueRuntimeFactory,
  createQueueRuntimeFactory,
  type QueueRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_QUEUE_RUNTIME_PROVIDER_COUNT,
  QueueRuntimeRegistry,
  createDefaultQueueRuntimeRegistry,
  type QueueRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_QUEUE_RUNTIME_STORE_ID,
  InMemoryQueueRuntimeStore,
  type InMemoryQueueRuntimeStoreOptions,
  type StoredCanonicalQueue,
  type StoredCanonicalQueueMessage,
  type QueueRuntimeStore,
} from "./store";

export {
  MEMORY_QUEUE_RUNTIME_BACKEND_ID,
  SUPABASE_QUEUE_RUNTIME_BACKEND_ID,
  MemoryQueueRuntimeBackend,
  SupabaseQueueRuntimeBackend,
  createQueueRuntimeBackend,
  getInjectedQueueRuntimeBackend,
  injectQueueRuntimeBackend,
  type CreateQueueRuntimeBackendOptions,
  type MemoryQueueRuntimeBackendOptions,
  type QueueRuntimePersistenceBackend,
  type QueueRuntimePersistenceBackendHealth,
  type SupabaseQueueRuntimeBackendOptions,
} from "./backend";

export { QueueRuntimeProvider, createQueueRuntimePort, getQueueRuntimeFactory } from "./providers";

export { getQueueRuntimeHealthSummary, type QueueRuntimeHealthSummary } from "./demo";
