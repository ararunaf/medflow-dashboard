/**
 * Enterprise Scheduler Foundation — Ports & Adapters (INF-03).
 *
 * Fluxo oficial:
 *   Application → ExecutionSchedulerPort → ExecutionSchedulerAdapter
 *     → InMemoryExecutionSchedulerStore → ExecutionSchedulerFactory
 *     → ExecutionSchedulerProvider
 *
 * O Scheduler Foundation NÃO executa agendamentos. NÃO utiliza cron.
 * NÃO cria timers. NÃO dispara jobs. NÃO inicia Workers.
 * NÃO integra backends reais de Scheduler.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente a infraestrutura de agendamento.
 *
 * Integração com Worker Foundation: exclusivamente via ExecutionWorkerPort (INF-02).
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Message Queue (ExecutionQueuePort)
 *     → Worker Foundation (ExecutionWorkerPort)
 *     → Scheduler Foundation (ExecutionSchedulerPort)
 *     → Execution Context atualizado (executionSchedulerId)
 *
 * INF-03: infraestrutura estrutural apenas.
 * Nenhuma Engine é invocada. Nenhum Schedule é executado.
 */
export type {
  CanonicalSchedule,
  CanonicalScheduleCapabilities,
  CanonicalScheduleConfiguration,
  CanonicalScheduleHealth,
  CanonicalScheduleIdentity,
  CanonicalScheduleRecordKind,
  CanonicalScheduleReference,
  CanonicalScheduleStatistics,
  CanonicalScheduleStatus,
  CanonicalScheduleStatusValue,
  DisableScheduleInput,
  DisableScheduleResult,
  EnableScheduleInput,
  EnableScheduleResult,
  ExecutionSchedulerPort,
  ExecutionSchedulerPortCapabilities,
  ExecutionSchedulerPortHealth,
  GetScheduleInput,
  GetScheduleResult,
  ListSchedulesInput,
  ListSchedulesResult,
  PauseScheduleInput,
  PauseScheduleResult,
  RegisterScheduleInput,
  RegisterScheduleResult,
  ResumeScheduleInput,
  ResumeScheduleResult,
  ScheduleStatisticsResult,
  SchedulerFoundationProviderId,
  SchedulerFoundationProviderOptions,
  StructuralScheduleLifecycleStatus,
  UnregisterScheduleInput,
  UnregisterScheduleResult,
} from "./ports";

export {
  STRUCTURAL_SCHEDULER_FOUNDATION_CAPABILITY,
  createExecutionSchedulerId,
  resetAllSchedulerFoundationIdSequences,
  resetExecutionSchedulerIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_SCHEDULER_ADAPTER_ID,
  DEFAULT_EXECUTION_SCHEDULER_VERSION,
  DefaultExecutionSchedulerAdapter,
  MOCK_EXECUTION_SCHEDULER_ADAPTER_ID,
  MOCK_EXECUTION_SCHEDULER_VERSION,
  MockExecutionSchedulerAdapter,
  type DefaultExecutionSchedulerRuntime,
  type MockExecutionSchedulerAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_EXECUTION_SCHEDULER_STORE_ID,
  InMemoryExecutionSchedulerStore,
  type ExecutionSchedulerStore,
  type InMemoryExecutionSchedulerStoreOptions,
  type StoredCanonicalSchedule,
} from "./store";

export {
  ExecutionSchedulerFactory,
  createExecutionSchedulerFactory,
  type ExecutionSchedulerFactoryOptions,
} from "./factory";

export {
  ExecutionSchedulerProvider,
  createExecutionSchedulerPort,
  createExecutionSchedulerProvider,
} from "./providers";

export { getSchedulerFoundationHealthSummary, type SchedulerFoundationHealthSummary } from "./demo";

export {
  AI_SCHEDULER_FOUNDATION_CONSUMER_ID,
  AI_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE,
  OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_ID,
  OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE,
  TISS_SCHEDULER_FOUNDATION_CONSUMER_ID,
  TISS_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE,
  type AiSchedulerFoundationConsumerReference,
  type OcrPipelineSchedulerFoundationConsumerReference,
  type TissSchedulerFoundationConsumerReference,
} from "./consumers";
