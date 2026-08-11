/**
 * Enterprise Scheduler Runtime — Ports & Adapters (INF-07 / OPER-INF-S).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → SchedulerRuntimePort
 *     → DefaultSchedulerRuntimeAdapter / EnterpriseSchedulerRuntimeAdapter / MockSchedulerRuntimeAdapter
 *     → SchedulerWorkerDispatcher → WorkerRuntimePort
 *       → QueueRuntimePort → Backend Persistente
 *
 * OPER-INF-S: scheduler operacional via WorkerRuntimePort (sem novos Ports / Gateways).
 * Sem Cron. Sem Quartz/Hangfire/Celery/BullMQ. Sem acesso direto a Queue/DB.
 * Sem paralelismo. Sem RabbitMQ/Kafka/Azure/Redis. Sem HTTP.
 * Sem operadoras/ANS/XML/OCR/Capture/IA. Sem regras de negócio.
 * Toda comunicação exclusivamente via SchedulerRuntimePort.
 */
export type {
  CancelScheduleInput,
  CancelScheduleResult,
  CanonicalSchedule,
  CanonicalSchedulerCapabilities,
  CanonicalSchedulerDispatch,
  CanonicalSchedulerHealth,
  CanonicalSchedulerIdentity,
  CanonicalSchedulerJob,
  CanonicalSchedulerMetadata,
  CanonicalSchedulerOperation,
  CanonicalSchedulerProvider,
  CanonicalSchedulerResult,
  CanonicalSchedulerStatistics,
  CanonicalSchedulerStatus,
  ListSchedulesInput,
  ListSchedulesResult,
  RegisterScheduleInput,
  RegisterScheduleResult,
  ScheduleJobInput,
  ScheduleJobResult,
  SchedulerRuntimeCapabilities,
  SchedulerRuntimeEnterpriseDeps,
  SchedulerRuntimeHealth,
  SchedulerRuntimeInfo,
  SchedulerRuntimeOperationEnvelope,
  SchedulerRuntimeOperationalControls,
  SchedulerRuntimeOptions,
  SchedulerRuntimePort,
  SchedulerRuntimePortCapabilities,
  SchedulerRuntimeProviderId,
  SchedulerRuntimeProviderMetadata,
  SchedulerRuntimeRegistration,
  SchedulerRuntimeStatus,
  SchedulerRuntimeStructuredLog,
  SchedulerRuntimeTelemetry,
  SchedulerStatsInput,
  SchedulerStatsResult,
  UnregisterScheduleInput,
  UnregisterScheduleResult,
} from "./ports";

export {
  DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES,
  DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
  createScheduleId,
  createSchedulerDispatchId,
  createSchedulerJobId,
  createSchedulerResultId,
  createSchedulerRuntimeRequestId,
  defineSchedulerRuntimeCapabilities,
  emptySchedulerRuntimeCapabilities,
  resetSchedulerRuntimeIdSequences,
  toCanonicalSchedulerCapabilities,
} from "./ports";

export {
  DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID,
  DEFAULT_SCHEDULER_RUNTIME_VERSION,
  DEFAULT_SCHEDULER_WORKER_QUEUE_NAME,
  DEFAULT_MOCK_SCHEDULER_RUNTIME_VERSION,
  DefaultSchedulerRuntimeAdapter,
  EnterpriseSchedulerRuntimeAdapter,
  MOCK_SCHEDULER_RUNTIME_ADAPTER_ID,
  MockSchedulerRuntimeAdapter,
  type DefaultSchedulerRuntimeAdapterOptions,
  type MockSchedulerRuntimeAdapterOptions,
} from "./adapters";

export {
  DEFAULT_SCHEDULER_MAX_CONCURRENT,
  DEFAULT_SCHEDULER_POLL_INTERVAL_MS,
  SchedulerWorkerDispatcher,
  type SchedulerDispatchOutcome,
  type SchedulerDispatchedEvent,
  type SchedulerSessionStartInput,
  type SchedulerWorkerDispatcherOptions,
} from "./operational";

export {
  SchedulerRuntimeFactory,
  createSchedulerRuntimeFactory,
  type SchedulerRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_SCHEDULER_RUNTIME_PROVIDER_COUNT,
  SchedulerRuntimeRegistry,
  createDefaultSchedulerRuntimeRegistry,
  type SchedulerRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_SCHEDULER_RUNTIME_STORE_ID,
  InMemorySchedulerRuntimeStore,
  type InMemorySchedulerRuntimeStoreOptions,
  type StoredCanonicalSchedule,
  type StoredCanonicalSchedulerDispatch,
  type StoredCanonicalSchedulerJob,
  type SchedulerRuntimeStore,
} from "./store";

export {
  SchedulerRuntimeProvider,
  createSchedulerRuntimePort,
  getSchedulerRuntimeFactory,
} from "./providers";

export { getSchedulerRuntimeHealthSummary, type SchedulerRuntimeHealthSummary } from "./demo";
