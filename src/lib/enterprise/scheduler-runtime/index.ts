/**
 * Enterprise Scheduler Runtime — Ports & Adapters (INF-07).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → SchedulerRuntimePort
 *     → DefaultSchedulerRuntimeAdapter / EnterpriseSchedulerRuntimeAdapter / MockSchedulerRuntimeAdapter
 *     → InMemorySchedulerRuntimeStore
 *     → Canonical Scheduler Result
 *
 * INF-07: infraestrutura canônica de gerenciamento estrutural de Schedulers futuros.
 * Sem Scheduler real. Sem Cron. Sem Quartz/Hangfire/Celery/BullMQ.
 * Sem Timer real. Sem Clock real. Sem Background Services.
 * Sem Retry Scheduling real. Sem Delay Jobs. Sem Job Dispatcher.
 * Sem Time Windows reais. Sem orquestração real de Workers.
 * Sem Workers reais. Sem filas reais. Sem processamento paralelo.
 * Sem RabbitMQ/Kafka/Azure/Redis. Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
 * Dependências Queue Runtime + Worker Runtime preparadas — sem consumo/execução.
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
  DEFAULT_MOCK_SCHEDULER_RUNTIME_VERSION,
  DefaultSchedulerRuntimeAdapter,
  EnterpriseSchedulerRuntimeAdapter,
  MOCK_SCHEDULER_RUNTIME_ADAPTER_ID,
  MockSchedulerRuntimeAdapter,
  type DefaultSchedulerRuntimeAdapterOptions,
  type MockSchedulerRuntimeAdapterOptions,
} from "./adapters";

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
