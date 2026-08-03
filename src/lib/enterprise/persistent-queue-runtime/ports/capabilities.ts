/**
 * PersistentQueueRuntimeCapabilities — capacidades declarativas (INF-08).
 *
 * Apenas declaração estrutural. Sem backends persistentes reais.
 * Sem RabbitMQ / Kafka / Azure Service Bus / Azure Queue / Redis Streams / BullMQ.
 * Sem Dead Letter / Retry / Delay / Priority Queue reais. Sem persistência real.
 */

import type { CanonicalPersistentQueueCapabilities } from "./canonical";

export type PersistentQueueRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsUnregister?: boolean;
  supportsPersist?: boolean;
  supportsRelease?: boolean;
  supportsList?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalPersistentQueue?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesQueueRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  runtimeReady?: true;
  realPersistentBackend?: false;
  rabbitMqImplemented?: false;
  kafkaImplemented?: false;
  azureServiceBusImplemented?: false;
  azureQueueImplemented?: false;
  redisStreamsImplemented?: false;
  bullMqImplemented?: false;
  deadLetterImplemented?: false;
  retryQueueImplemented?: false;
  delayQueueImplemented?: false;
  messagePersistenceImplemented?: false;
  implementsRabbitMq?: false;
  implementsKafka?: false;
  implementsAzureServiceBus?: false;
  implementsAzureQueue?: false;
  implementsRedisStreams?: false;
  implementsBullMq?: false;
  implementsDeadLetter?: false;
  implementsRetryQueue?: false;
  implementsDelayQueue?: false;
  implementsPriorityQueue?: false;
  implementsMessagePersistence?: false;
  implementsRetryEngine?: false;
  implementsRealPersistentBackend?: false;
  implementsThreadPool?: false;
  implementsWorkers?: false;
  implementsParallelProcessing?: false;
  implementsRedis?: false;
  implementsHttp?: false;
  implementsWebsocket?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyPersistentQueueRuntimeCapabilities(): PersistentQueueRuntimeCapabilities {
  return {};
}

export function definePersistentQueueRuntimeCapabilities(
  capabilities: PersistentQueueRuntimeCapabilities = {},
): PersistentQueueRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES: PersistentQueueRuntimeCapabilities = {
  supportsRegister: true,
  supportsUnregister: true,
  supportsPersist: true,
  supportsRelease: true,
  supportsList: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalPersistentQueue: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesQueueRuntimePort: true,
  usesWorkerRuntimePort: true,
  usesSchedulerRuntimePort: true,
  runtimeReady: true,
  realPersistentBackend: false,
  rabbitMqImplemented: false,
  kafkaImplemented: false,
  azureServiceBusImplemented: false,
  azureQueueImplemented: false,
  redisStreamsImplemented: false,
  bullMqImplemented: false,
  deadLetterImplemented: false,
  retryQueueImplemented: false,
  delayQueueImplemented: false,
  messagePersistenceImplemented: false,
  implementsRabbitMq: false,
  implementsKafka: false,
  implementsAzureServiceBus: false,
  implementsAzureQueue: false,
  implementsRedisStreams: false,
  implementsBullMq: false,
  implementsDeadLetter: false,
  implementsRetryQueue: false,
  implementsDelayQueue: false,
  implementsPriorityQueue: false,
  implementsMessagePersistence: false,
  implementsRetryEngine: false,
  implementsRealPersistentBackend: false,
  implementsThreadPool: false,
  implementsWorkers: false,
  implementsParallelProcessing: false,
  implementsRedis: false,
  implementsHttp: false,
  implementsWebsocket: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES: PersistentQueueRuntimeCapabilities =
  {
    ...DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
  };

export function toCanonicalPersistentQueueCapabilities(
  capabilities: PersistentQueueRuntimeCapabilities = DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
): CanonicalPersistentQueueCapabilities {
  return {
    kind: "canonical-persistent-queue-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsUnregister: capabilities.supportsUnregister === true,
    supportsPersist: capabilities.supportsPersist === true,
    supportsRelease: capabilities.supportsRelease === true,
    supportsList: capabilities.supportsList === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalPersistentQueue: capabilities.supportsCanonicalPersistentQueue === true,
    runtimeReady: true,
    realPersistentBackend: false,
    rabbitMqImplemented: false,
    kafkaImplemented: false,
    azureServiceBusImplemented: false,
    azureQueueImplemented: false,
    redisStreamsImplemented: false,
    bullMqImplemented: false,
    deadLetterImplemented: false,
    retryQueueImplemented: false,
    delayQueueImplemented: false,
    messagePersistenceImplemented: false,
    implementsRabbitMq: false,
    implementsKafka: false,
    implementsAzureServiceBus: false,
    implementsAzureQueue: false,
    implementsRedisStreams: false,
    implementsBullMq: false,
    implementsDeadLetter: false,
    implementsRetryQueue: false,
    implementsDelayQueue: false,
    implementsPriorityQueue: false,
    implementsMessagePersistence: false,
    implementsRetryEngine: false,
    implementsRealPersistentBackend: false,
    implementsThreadPool: false,
    implementsWorkers: false,
    implementsParallelProcessing: false,
    implementsRedis: false,
    implementsHttp: false,
    implementsWebsocket: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
