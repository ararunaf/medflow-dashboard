/**
 * QueueRuntimeCapabilities — capacidades declarativas (INF-05).
 *
 * Apenas declaração estrutural. Sem filas reais. Sem workers. Sem backends.
 */

import type { CanonicalQueueCapabilities } from "./canonical";

export type QueueRuntimeCapabilities = {
  supportsEnqueue?: boolean;
  supportsDequeue?: boolean;
  supportsPeek?: boolean;
  supportsAck?: boolean;
  supportsNack?: boolean;
  supportsPurge?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalQueue?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  /** INF-06 — dependência Worker Runtime preparada (sem consumo). */
  usesWorkerRuntimePort?: boolean;
  runtimeReady?: true;
  realQueueBackend?: false;
  messagesPublished?: false;
  messagesConsumed?: false;
  workersInvoked?: false;
  processingPerformed?: false;
  persistenceImplemented?: false;
  implementsRabbitMq?: false;
  implementsKafka?: false;
  implementsAzureServiceBus?: false;
  implementsAzureQueue?: false;
  implementsRedis?: false;
  implementsBullMq?: false;
  implementsWorkers?: false;
  implementsScheduler?: false;
  implementsDeadLetter?: false;
  implementsRetryReal?: false;
  implementsHttp?: false;
  implementsWebsocket?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyQueueRuntimeCapabilities(): QueueRuntimeCapabilities {
  return {};
}

export function defineQueueRuntimeCapabilities(
  capabilities: QueueRuntimeCapabilities = {},
): QueueRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_QUEUE_RUNTIME_CAPABILITIES: QueueRuntimeCapabilities = {
  supportsEnqueue: true,
  supportsDequeue: true,
  supportsPeek: true,
  supportsAck: true,
  supportsNack: true,
  supportsPurge: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalQueue: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesWorkerRuntimePort: true,
  runtimeReady: true,
  realQueueBackend: false,
  messagesPublished: false,
  messagesConsumed: false,
  workersInvoked: false,
  processingPerformed: false,
  persistenceImplemented: false,
  implementsRabbitMq: false,
  implementsKafka: false,
  implementsAzureServiceBus: false,
  implementsAzureQueue: false,
  implementsRedis: false,
  implementsBullMq: false,
  implementsWorkers: false,
  implementsScheduler: false,
  implementsDeadLetter: false,
  implementsRetryReal: false,
  implementsHttp: false,
  implementsWebsocket: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES: QueueRuntimeCapabilities = {
  ...DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
};

export function toCanonicalQueueCapabilities(
  capabilities: QueueRuntimeCapabilities = DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
): CanonicalQueueCapabilities {
  return {
    kind: "canonical-queue-capabilities",
    supportsEnqueue: capabilities.supportsEnqueue === true,
    supportsDequeue: capabilities.supportsDequeue === true,
    supportsPeek: capabilities.supportsPeek === true,
    supportsAck: capabilities.supportsAck === true,
    supportsNack: capabilities.supportsNack === true,
    supportsPurge: capabilities.supportsPurge === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalQueue: capabilities.supportsCanonicalQueue === true,
    runtimeReady: true,
    realQueueBackend: false,
    messagesPublished: false,
    messagesConsumed: false,
    workersInvoked: false,
    processingPerformed: false,
    persistenceImplemented: false,
    implementsRabbitMq: false,
    implementsKafka: false,
    implementsAzureServiceBus: false,
    implementsAzureQueue: false,
    implementsRedis: false,
    implementsBullMq: false,
    implementsWorkers: false,
    implementsScheduler: false,
    implementsDeadLetter: false,
    implementsRetryReal: false,
    implementsHttp: false,
    implementsWebsocket: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
