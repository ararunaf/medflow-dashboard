/**
 * Enterprise Message Queue Foundation — Ports & Adapters (INF-01).
 *
 * Fluxo oficial:
 *   Application → ExecutionQueuePort → MessageQueueAdapter
 *     → InMemoryMessageQueueStore → MessageQueueFactory
 *     → MessageQueueProvider
 *
 * O Message Queue NÃO publica mensagens. NÃO consome mensagens.
 * NÃO invoca Workers. NÃO integra backends reais de fila.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente a infraestrutura de filas.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Message Queue (ExecutionQueuePort)
 *     → Execution Context atualizado (executionMessageQueueId)
 *
 * INF-01: infraestrutura estrutural apenas.
 * Nenhuma Engine é invocada. Nenhuma mensagem é publicada / consumida.
 */
export type {
  AcknowledgeInput,
  AcknowledgeResult,
  CanonicalQueue,
  CanonicalQueueCapabilities,
  CanonicalQueueConfiguration,
  CanonicalQueueHealth,
  CanonicalQueueMessage,
  CanonicalQueueMessageStatus,
  CanonicalQueueMetadata,
  CanonicalQueueRecordKind,
  CanonicalQueueReference,
  CanonicalQueueStatistics,
  DequeueInput,
  DequeueResult,
  EnqueueInput,
  EnqueueResult,
  ExecutionQueuePort,
  ExecutionQueuePortCapabilities,
  ExecutionQueuePortHealth,
  GetQueueInput,
  GetQueueResult,
  GetStatisticsResult,
  MessageQueueProviderId,
  MessageQueueProviderOptions,
  PeekInput,
  PeekResult,
  RejectInput,
  RejectResult,
  RetryInput,
  RetryResult,
} from "./ports";

export {
  STRUCTURAL_MESSAGE_QUEUE_CAPABILITY,
  createCanonicalQueueMessageId,
  createExecutionMessageQueueId,
  resetAllMessageQueueIdSequences,
  resetCanonicalQueueMessageIdSequence,
  resetExecutionMessageQueueIdSequence,
} from "./ports";

export {
  DEFAULT_MESSAGE_QUEUE_ADAPTER_ID,
  DEFAULT_MESSAGE_QUEUE_VERSION,
  DefaultMessageQueueAdapter,
  MOCK_MESSAGE_QUEUE_ADAPTER_ID,
  MOCK_MESSAGE_QUEUE_VERSION,
  MockMessageQueueAdapter,
  type DefaultMessageQueueRuntime,
  type MockMessageQueueAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_MESSAGE_QUEUE_STORE_ID,
  InMemoryMessageQueueStore,
  type InMemoryMessageQueueStoreOptions,
  type MessageQueueStore,
  type StoredCanonicalQueue,
  type StoredCanonicalQueueMessage,
} from "./store";

export {
  MessageQueueFactory,
  createMessageQueueFactory,
  type MessageQueueFactoryOptions,
} from "./factory";

export {
  MessageQueueProvider,
  createExecutionQueuePort,
  createMessageQueueProvider,
} from "./providers";

export { getMessageQueueHealthSummary, type MessageQueueHealthSummary } from "./demo";

export {
  OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_ID,
  OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_REFERENCE,
  type OcrPipelineMessageQueueConsumerReference,
} from "./consumers";
