/**
 * WorkerRuntimeCapabilities — capacidades declarativas (INF-06 / OPER-INF-W).
 *
 * Flags operacionais (realWorkers / queueConsumed / tasksExecuted / persistenceImplemented)
 * ativadas pelo adapter default que consome QueueRuntimePort.
 * Sem Scheduler. Sem Thread Pool. Sem paralelismo. Sem Dead Letter / Retry Engine.
 */

import type { CanonicalWorkerCapabilities } from "./canonical";

export type WorkerRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsUnregister?: boolean;
  supportsAllocate?: boolean;
  supportsRelease?: boolean;
  supportsHeartbeat?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalWorker?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesQueueRuntimePort?: boolean;
  /** INF-07 — dependência Scheduler Runtime preparada (sem consumo). */
  usesSchedulerRuntimePort?: boolean;
  /** INF-08 — dependência Persistent Queue Runtime preparada (sem consumo). */
  usesPersistentQueueRuntimePort?: boolean;
  /** INF-09 — dependência Observability Runtime preparada (sem consumo). */
  usesObservabilityRuntimePort?: boolean;
  usesScalabilityRuntimePort?: boolean;
  runtimeReady?: true;
  realWorkers?: boolean;
  tasksExecuted?: boolean;
  parallelProcessing?: false;
  schedulerImplemented?: false;
  threadPoolImplemented?: false;
  persistenceImplemented?: boolean;
  queueConsumed?: boolean;
  implementsRabbitMq?: false;
  implementsKafka?: false;
  implementsAzureServiceBus?: false;
  implementsAzureQueue?: false;
  implementsRedis?: false;
  implementsBullMq?: false;
  implementsRealWorkers?: boolean;
  implementsScheduler?: false;
  implementsThreadPool?: false;
  implementsCron?: false;
  implementsDeadLetter?: false;
  implementsRetryReal?: false;
  implementsHttp?: false;
  implementsWebsocket?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyWorkerRuntimeCapabilities(): WorkerRuntimeCapabilities {
  return {};
}

export function defineWorkerRuntimeCapabilities(
  capabilities: WorkerRuntimeCapabilities = {},
): WorkerRuntimeCapabilities {
  return { ...capabilities };
}

/** Capacidades operacionais do adapter default/enterprise (OPER-INF-W). */
export const DEFAULT_WORKER_RUNTIME_CAPABILITIES: WorkerRuntimeCapabilities = {
  supportsRegister: true,
  supportsUnregister: true,
  supportsAllocate: true,
  supportsRelease: true,
  supportsHeartbeat: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalWorker: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesQueueRuntimePort: true,
  usesSchedulerRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesObservabilityRuntimePort: true,
  usesScalabilityRuntimePort: true,
  runtimeReady: true,
  realWorkers: true,
  tasksExecuted: true,
  parallelProcessing: false,
  schedulerImplemented: false,
  threadPoolImplemented: false,
  persistenceImplemented: true,
  queueConsumed: true,
  implementsRabbitMq: false,
  implementsKafka: false,
  implementsAzureServiceBus: false,
  implementsAzureQueue: false,
  implementsRedis: false,
  implementsBullMq: false,
  implementsRealWorkers: true,
  implementsScheduler: false,
  implementsThreadPool: false,
  implementsCron: false,
  implementsDeadLetter: false,
  implementsRetryReal: false,
  implementsHttp: false,
  implementsWebsocket: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

/** Capacidades estruturais do mock/test (sem consumo operacional de fila). */
export const DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES: WorkerRuntimeCapabilities = {
  ...DEFAULT_WORKER_RUNTIME_CAPABILITIES,
  realWorkers: false,
  tasksExecuted: false,
  persistenceImplemented: false,
  queueConsumed: false,
  implementsRealWorkers: false,
};

export function toCanonicalWorkerCapabilities(
  capabilities: WorkerRuntimeCapabilities = DEFAULT_WORKER_RUNTIME_CAPABILITIES,
): CanonicalWorkerCapabilities {
  return {
    kind: "canonical-worker-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsUnregister: capabilities.supportsUnregister === true,
    supportsAllocate: capabilities.supportsAllocate === true,
    supportsRelease: capabilities.supportsRelease === true,
    supportsHeartbeat: capabilities.supportsHeartbeat === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalWorker: capabilities.supportsCanonicalWorker === true,
    runtimeReady: true,
    realWorkers: capabilities.realWorkers === true,
    tasksExecuted: capabilities.tasksExecuted === true,
    parallelProcessing: false,
    schedulerImplemented: false,
    threadPoolImplemented: false,
    persistenceImplemented: capabilities.persistenceImplemented === true,
    queueConsumed: capabilities.queueConsumed === true,
    implementsRabbitMq: false,
    implementsKafka: false,
    implementsAzureServiceBus: false,
    implementsAzureQueue: false,
    implementsRedis: false,
    implementsBullMq: false,
    implementsRealWorkers: capabilities.implementsRealWorkers === true,
    implementsScheduler: false,
    implementsThreadPool: false,
    implementsCron: false,
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
