/**
 * Enterprise Worker Runtime — Ports & Adapters (INF-06 / OPER-INF-W).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → WorkerRuntimePort
 *     → DefaultWorkerRuntimeAdapter / EnterpriseWorkerRuntimeAdapter / MockWorkerRuntimeAdapter
 *     → QueueRuntimePort → Backend Persistente (OPER-INF-Q)
 *
 * OPER-INF-W: implementação operacional reutilizando exclusivamente QueueRuntimePort.
 * Sem Thread Pool. Sem Scheduler. Sem Cron. Sem paralelismo.
 * Sem RabbitMQ/Kafka/Azure/Redis/BullMQ. Sem Retry Engine. Sem Dead Letter.
 * Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
 * Toda comunicação exclusiva via WorkerRuntimePort (sem novos Ports/Gateways).
 */
export type {
  AllocateWorkerInput,
  AllocateWorkerResult,
  CanonicalWorker,
  CanonicalWorkerCapabilities,
  CanonicalWorkerExecution,
  CanonicalWorkerHealth,
  CanonicalWorkerIdentity,
  CanonicalWorkerMetadata,
  CanonicalWorkerOperation,
  CanonicalWorkerProvider,
  CanonicalWorkerResult,
  CanonicalWorkerStatistics,
  CanonicalWorkerStatus,
  CanonicalWorkerTask,
  HeartbeatWorkerInput,
  HeartbeatWorkerResult,
  RegisterWorkerInput,
  RegisterWorkerResult,
  ReleaseWorkerInput,
  ReleaseWorkerResult,
  UnregisterWorkerInput,
  UnregisterWorkerResult,
  WorkerRuntimeCapabilities,
  WorkerRuntimeEnterpriseDeps,
  WorkerRuntimeHealth,
  WorkerRuntimeInfo,
  WorkerRuntimeOperationEnvelope,
  WorkerRuntimeOperationalControls,
  WorkerRuntimeOptions,
  WorkerRuntimePort,
  WorkerRuntimePortCapabilities,
  WorkerRuntimeProviderId,
  WorkerRuntimeProviderMetadata,
  WorkerRuntimeRegistration,
  WorkerRuntimeStatus,
  WorkerRuntimeStructuredLog,
  WorkerRuntimeTelemetry,
  WorkerStatsInput,
  WorkerStatsResult,
} from "./ports";

export {
  DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES,
  DEFAULT_WORKER_RUNTIME_CAPABILITIES,
  createWorkerExecutionId,
  createWorkerId,
  createWorkerResultId,
  createWorkerRuntimeRequestId,
  createWorkerTaskId,
  defineWorkerRuntimeCapabilities,
  emptyWorkerRuntimeCapabilities,
  resetWorkerRuntimeIdSequences,
  toCanonicalWorkerCapabilities,
} from "./ports";

export {
  DEFAULT_WORKER_QUEUE_NAME,
  DEFAULT_WORKER_RUNTIME_ADAPTER_ID,
  DEFAULT_WORKER_RUNTIME_VERSION,
  DEFAULT_MOCK_WORKER_RUNTIME_VERSION,
  DefaultWorkerRuntimeAdapter,
  EnterpriseWorkerRuntimeAdapter,
  MOCK_WORKER_RUNTIME_ADAPTER_ID,
  MockWorkerRuntimeAdapter,
  type DefaultWorkerRuntimeAdapterOptions,
  type MockWorkerRuntimeAdapterOptions,
} from "./adapters";

export {
  DEFAULT_WORKER_POLL_INTERVAL_MS,
  WorkerQueueConsumer,
  type WorkerQueueConsumerOptions,
  type WorkerQueueProcessOutcome,
  type WorkerQueueProcessedEvent,
  type WorkerQueueSessionStartInput,
} from "./operational";

export {
  WorkerRuntimeFactory,
  createWorkerRuntimeFactory,
  type WorkerRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_WORKER_RUNTIME_PROVIDER_COUNT,
  WorkerRuntimeRegistry,
  createDefaultWorkerRuntimeRegistry,
  type WorkerRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_WORKER_RUNTIME_STORE_ID,
  InMemoryWorkerRuntimeStore,
  type InMemoryWorkerRuntimeStoreOptions,
  type StoredCanonicalWorker,
  type StoredCanonicalWorkerExecution,
  type StoredCanonicalWorkerTask,
  type WorkerRuntimeStore,
} from "./store";

export {
  WorkerRuntimeProvider,
  createWorkerRuntimePort,
  getWorkerRuntimeFactory,
} from "./providers";

export { getWorkerRuntimeHealthSummary, type WorkerRuntimeHealthSummary } from "./demo";
