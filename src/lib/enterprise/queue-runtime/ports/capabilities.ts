/**
 * QueueRuntimeCapabilities — capacidades declarativas (INF-05 / OPER-INF-Q).
 *
 * Flags operacionais (realQueueBackend / persistenceImplemented) ativadas
 * pelo adapter default com backend persistente. Sem workers neste Port.
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
  /** INF-07 — dependência Scheduler Runtime preparada (sem consumo). */
  usesSchedulerRuntimePort?: boolean;
  /** INF-08 — dependência Persistent Queue Runtime preparada (sem consumo). */
  usesPersistentQueueRuntimePort?: boolean;
  /** INF-09 — dependência Observability Runtime preparada (sem consumo). */
  usesObservabilityRuntimePort?: boolean;
  usesScalabilityRuntimePort?: boolean;
  runtimeReady?: true;
  realQueueBackend?: boolean;
  messagesPublished?: boolean;
  messagesConsumed?: boolean;
  workersInvoked?: boolean;
  processingPerformed?: boolean;
  persistenceImplemented?: boolean;
  implementsRabbitMq?: false;
  implementsKafka?: false;
  implementsAzureServiceBus?: false;
  implementsAzureQueue?: false;
  implementsRedis?: false;
  implementsBullMq?: false;
  implementsWorkers?: false;
  implementsScheduler?: false;
  /** OPER-INF-D — Dead Letter operacional atrás do QueueRuntimePort. */
  implementsDeadLetter?: boolean;
  /** OPER-INF-R — Retry operacional (decisão + agendamento via Ports existentes). */
  implementsRetryReal?: boolean;
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

/** Capacidades operacionais do adapter default/enterprise (OPER-INF-Q). */
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
  usesSchedulerRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesObservabilityRuntimePort: true,
  usesScalabilityRuntimePort: true,
  runtimeReady: true,
  realQueueBackend: true,
  messagesPublished: true,
  messagesConsumed: true,
  workersInvoked: false,
  processingPerformed: false,
  persistenceImplemented: true,
  implementsRabbitMq: false,
  implementsKafka: false,
  implementsAzureServiceBus: false,
  implementsAzureQueue: false,
  implementsRedis: false,
  implementsBullMq: false,
  implementsWorkers: false,
  implementsScheduler: false,
  implementsDeadLetter: true,
  implementsRetryReal: true,
  implementsHttp: false,
  implementsWebsocket: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

/** Capacidades estruturais do mock/test (sem backend operacional). */
export const DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES: QueueRuntimeCapabilities = {
  ...DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
  realQueueBackend: false,
  messagesPublished: false,
  messagesConsumed: false,
  workersInvoked: false,
  processingPerformed: false,
  persistenceImplemented: false,
  implementsDeadLetter: false,
  implementsRetryReal: false,
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
    realQueueBackend: capabilities.realQueueBackend === true,
    messagesPublished: capabilities.messagesPublished === true,
    messagesConsumed: capabilities.messagesConsumed === true,
    workersInvoked: capabilities.workersInvoked === true,
    processingPerformed: capabilities.processingPerformed === true,
    persistenceImplemented: capabilities.persistenceImplemented === true,
    implementsRabbitMq: false,
    implementsKafka: false,
    implementsAzureServiceBus: false,
    implementsAzureQueue: false,
    implementsRedis: false,
    implementsBullMq: false,
    implementsWorkers: false,
    implementsScheduler: false,
    implementsDeadLetter: capabilities.implementsDeadLetter === true,
    implementsRetryReal: capabilities.implementsRetryReal === true,
    implementsHttp: false,
    implementsWebsocket: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
