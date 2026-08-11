/**
 * Enterprise Queue Runtime — Ports & Adapters (INF-05 / OPER-INF-Q / OPER-INF-D / OPER-INF-R / TISS-RUNTIME-01A).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → QueueRuntimePort
 *     → DefaultQueueRuntimeAdapter / EnterpriseQueueRuntimeAdapter / MockQueueRuntimeAdapter
 *     → InMemoryQueueRuntimeStore + Persistence Backend (Supabase | memory durable)
 *     → DeadLetterRuntimePort (OPER-INF-D — contrato interno, sem Port Enterprise novo)
 *     → DefaultRetryInfrastructure (OPER-INF-R — NÃO é Port; Scheduler + Worker + Queue)
 *     → enqueueTissReceivedJob (TISS-RUNTIME-01A — Job RECEIVED via QueueRuntimePort)
 *     → processTissOcrJob (TISS-RUNTIME-01B — OCR → OCR_COMPLETED via Worker/OCRRuntimePort)
 *     → Canonical Queue Result
 *
 * OPER-INF-Q: backend persistente ativado no adapter — mesma interface pública.
 * OPER-INF-D: Dead Letter operacional via DeadLetterRuntimePort → QueueRuntimePort.
 * OPER-INF-R: Retry operacional (decide + agenda; nunca processa) via Ports existentes.
 * TISS-RUNTIME-01A: entrada funcional TISS — Documento → Queue → Job RECEIVED (sem OCR/Parser/XML).
 * TISS-RUNTIME-01B: capability OCR — Job RECEIVED → Worker → OCR → Job OCR_COMPLETED (sem Parser).
 * TISS-RUNTIME-01C: capability Parser — Job OCR_COMPLETED → Worker → Parser → Job PARSED (sem Validação).
 * Sem RabbitMQ. Sem Azure Service Bus. Sem Kafka. Sem Redis.
 * Sem acesso direto ao Queue Runtime Store / Backend pelo produto.
 * Toda comunicação exclusivamente via QueueRuntimePort (produto) /
 * SchedulerRuntimePort + WorkerRuntimePort + QueueRuntimePort (retry interno).
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

export {
  DefaultDeadLetterRuntime,
  ENTERPRISE_DEAD_LETTER_QUEUE_NAME,
  IN_MEMORY_DEAD_LETTER_STORE_ID,
  InMemoryDeadLetterStore,
  createDeadLetterId,
  resetDeadLetterIdSequences,
  DefaultRetryInfrastructure,
  DEFAULT_RETRY_POLICY,
  IN_MEMORY_RETRY_STORE_ID,
  InMemoryRetryStore,
  computeExponentialBackoffDelayMs,
  createRetryId,
  resetRetryIdSequences,
  resolveRetryPolicy,
  type DeadLetterGetByIdInput,
  type DeadLetterGetByIdResult,
  type DeadLetterMetadata,
  type DeadLetterParkInput,
  type DeadLetterParkResult,
  type DeadLetterPurgeInput,
  type DeadLetterPurgeResult,
  type DeadLetterRecord,
  type DeadLetterRuntimePort,
  type DeadLetterStatsResult,
  type DefaultDeadLetterRuntimeOptions,
  type DefaultRetryInfrastructureOptions,
  type RetryDecideInput,
  type RetryDecideResult,
  type RetryDecision,
  type RetryGetByIdInput,
  type RetryGetByIdResult,
  type RetryMetadata,
  type RetryPolicy,
  type RetryRecord,
  type RetryStatsResult,
  type RetryStatus,
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_RECEIVED,
  enqueueTissReceivedJob,
  type EnqueueTissReceivedJobInput,
  type EnqueueTissReceivedJobResult,
  type TissJobLogicalStatus,
  type TissReceivedJob,
  TISS_JOB_STATUS_OCR_COMPLETED,
  processTissOcrJob,
  createTissOcrProcessMessage,
  type ProcessTissOcrJobInput,
  type ProcessTissOcrJobResult,
  type TissOcrCompletedJob,
  type TissOcrJobLogicalStatus,
  type TissOcrProcessMessageDeps,
  TISS_JOB_STATUS_PARSED,
  processTissParserJob,
  createTissParserProcessMessage,
  type ProcessTissParserJobInput,
  type ProcessTissParserJobResult,
  type TissParserCompletedJob,
  type TissParserJobLogicalStatus,
  type TissParserProcessMessageDeps,
} from "./operational";
