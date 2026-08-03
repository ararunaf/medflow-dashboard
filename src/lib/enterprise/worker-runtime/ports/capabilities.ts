/**
 * WorkerRuntimeCapabilities — capacidades declarativas (INF-06).
 *
 * Apenas declaração estrutural. Sem Workers reais. Sem Scheduler. Sem Thread Pool.
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
  runtimeReady?: true;
  realWorkers?: false;
  tasksExecuted?: false;
  parallelProcessing?: false;
  schedulerImplemented?: false;
  threadPoolImplemented?: false;
  persistenceImplemented?: false;
  queueConsumed?: false;
  implementsRabbitMq?: false;
  implementsKafka?: false;
  implementsAzureServiceBus?: false;
  implementsAzureQueue?: false;
  implementsRedis?: false;
  implementsBullMq?: false;
  implementsRealWorkers?: false;
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
  runtimeReady: true,
  realWorkers: false,
  tasksExecuted: false,
  parallelProcessing: false,
  schedulerImplemented: false,
  threadPoolImplemented: false,
  persistenceImplemented: false,
  queueConsumed: false,
  implementsRabbitMq: false,
  implementsKafka: false,
  implementsAzureServiceBus: false,
  implementsAzureQueue: false,
  implementsRedis: false,
  implementsBullMq: false,
  implementsRealWorkers: false,
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

export const DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES: WorkerRuntimeCapabilities = {
  ...DEFAULT_WORKER_RUNTIME_CAPABILITIES,
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
    realWorkers: false,
    tasksExecuted: false,
    parallelProcessing: false,
    schedulerImplemented: false,
    threadPoolImplemented: false,
    persistenceImplemented: false,
    queueConsumed: false,
    implementsRabbitMq: false,
    implementsKafka: false,
    implementsAzureServiceBus: false,
    implementsAzureQueue: false,
    implementsRedis: false,
    implementsBullMq: false,
    implementsRealWorkers: false,
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
