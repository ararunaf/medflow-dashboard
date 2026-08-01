/**
 * Enterprise Worker Foundation — Ports & Adapters (INF-02).
 *
 * Fluxo oficial:
 *   Application → ExecutionWorkerPort → ExecutionWorkerAdapter
 *     → InMemoryExecutionWorkerStore → ExecutionWorkerFactory
 *     → ExecutionWorkerProvider
 *
 * O Worker Foundation NÃO executa Workers. NÃO inicia threads.
 * NÃO processa mensagens. NÃO integra backends reais de Workers.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente a infraestrutura de Workers.
 *
 * Integração com Message Queue: exclusivamente via ExecutionQueuePort (INF-01).
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Message Queue (ExecutionQueuePort)
 *     → Worker Foundation (ExecutionWorkerPort)
 *     → Execution Context atualizado (executionWorkerId)
 *
 * INF-02: infraestrutura estrutural apenas.
 * Nenhuma Engine é invocada. Nenhum Worker é executado.
 */
export type {
  CanonicalWorker,
  CanonicalWorkerCapabilities,
  CanonicalWorkerConfiguration,
  CanonicalWorkerHealth,
  CanonicalWorkerIdentity,
  CanonicalWorkerRecordKind,
  CanonicalWorkerReference,
  CanonicalWorkerStatistics,
  CanonicalWorkerStatus,
  CanonicalWorkerStatusValue,
  ExecutionWorkerPort,
  ExecutionWorkerPortCapabilities,
  ExecutionWorkerPortHealth,
  GetWorkerInput,
  GetWorkerResult,
  PauseWorkerInput,
  PauseWorkerResult,
  RegisterWorkerInput,
  RegisterWorkerResult,
  ResumeWorkerInput,
  ResumeWorkerResult,
  StartWorkerInput,
  StartWorkerResult,
  StopWorkerInput,
  StopWorkerResult,
  StructuralWorkerLifecycleStatus,
  UnregisterWorkerInput,
  UnregisterWorkerResult,
  WorkerFoundationProviderId,
  WorkerFoundationProviderOptions,
  WorkerStatisticsResult,
} from "./ports";

export {
  STRUCTURAL_WORKER_FOUNDATION_CAPABILITY,
  createExecutionWorkerId,
  resetAllWorkerFoundationIdSequences,
  resetExecutionWorkerIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_WORKER_ADAPTER_ID,
  DEFAULT_EXECUTION_WORKER_VERSION,
  DefaultExecutionWorkerAdapter,
  MOCK_EXECUTION_WORKER_ADAPTER_ID,
  MOCK_EXECUTION_WORKER_VERSION,
  MockExecutionWorkerAdapter,
  type DefaultExecutionWorkerRuntime,
  type MockExecutionWorkerAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_EXECUTION_WORKER_STORE_ID,
  InMemoryExecutionWorkerStore,
  type ExecutionWorkerStore,
  type InMemoryExecutionWorkerStoreOptions,
  type StoredCanonicalWorker,
} from "./store";

export {
  ExecutionWorkerFactory,
  createExecutionWorkerFactory,
  type ExecutionWorkerFactoryOptions,
} from "./factory";

export {
  ExecutionWorkerProvider,
  createExecutionWorkerPort,
  createExecutionWorkerProvider,
} from "./providers";

export { getWorkerFoundationHealthSummary, type WorkerFoundationHealthSummary } from "./demo";

export {
  AI_WORKER_FOUNDATION_CONSUMER_ID,
  AI_WORKER_FOUNDATION_CONSUMER_REFERENCE,
  OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_ID,
  OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_REFERENCE,
  type AiWorkerFoundationConsumerReference,
  type OcrPipelineWorkerFoundationConsumerReference,
} from "./consumers";
