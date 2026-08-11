/**
 * SchedulerRuntimeCapabilities — capacidades declarativas (INF-07 / OPER-INF-S).
 *
 * Flags operacionais (realScheduler / timerImplemented / jobDispatcherImplemented /
 * workersOrchestrated) ativadas pelo adapter default que aciona WorkerRuntimePort.
 * Sem Cron. Sem Quartz/Hangfire/Celery/BullMQ. Sem consumo direto de Queue.
 */

import type { CanonicalSchedulerCapabilities } from "./canonical";

export type SchedulerRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsUnregister?: boolean;
  supportsSchedule?: boolean;
  supportsCancel?: boolean;
  supportsList?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalSchedule?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesQueueRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  /** INF-08 — dependência Persistent Queue Runtime preparada (sem consumo). */
  usesPersistentQueueRuntimePort?: boolean;
  /** INF-09 — dependência Observability Runtime preparada (sem consumo). */
  usesObservabilityRuntimePort?: boolean;
  usesScalabilityRuntimePort?: boolean;
  runtimeReady?: true;
  realScheduler?: boolean;
  cronImplemented?: false;
  timerImplemented?: boolean;
  retrySchedulingImplemented?: false;
  delayJobsImplemented?: false;
  jobDispatcherImplemented?: boolean;
  timeWindowsImplemented?: false;
  workersOrchestrated?: boolean;
  queueConsumed?: false;
  parallelProcessing?: false;
  persistenceImplemented?: false;
  implementsCron?: false;
  implementsQuartz?: false;
  implementsHangfire?: false;
  implementsCelery?: false;
  implementsBullMq?: false;
  implementsAzureScheduler?: false;
  implementsAzureFunctionsTimer?: false;
  implementsTaskScheduler?: false;
  implementsRealScheduler?: boolean;
  implementsTimer?: boolean;
  implementsClock?: false;
  implementsBackgroundService?: boolean;
  implementsRetryReal?: false;
  implementsDelayQueue?: false;
  implementsThreadPool?: false;
  implementsWorkers?: false;
  implementsParallelProcessing?: false;
  implementsRabbitMq?: false;
  implementsKafka?: false;
  implementsAzureServiceBus?: false;
  implementsRedis?: false;
  implementsHttp?: false;
  implementsWebsocket?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptySchedulerRuntimeCapabilities(): SchedulerRuntimeCapabilities {
  return {};
}

export function defineSchedulerRuntimeCapabilities(
  capabilities: SchedulerRuntimeCapabilities = {},
): SchedulerRuntimeCapabilities {
  return { ...capabilities };
}

/** Capacidades operacionais do adapter default/enterprise (OPER-INF-S). */
export const DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES: SchedulerRuntimeCapabilities = {
  supportsRegister: true,
  supportsUnregister: true,
  supportsSchedule: true,
  supportsCancel: true,
  supportsList: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalSchedule: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesQueueRuntimePort: true,
  usesWorkerRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesObservabilityRuntimePort: true,
  usesScalabilityRuntimePort: true,
  runtimeReady: true,
  realScheduler: true,
  cronImplemented: false,
  timerImplemented: true,
  retrySchedulingImplemented: false,
  delayJobsImplemented: false,
  jobDispatcherImplemented: true,
  timeWindowsImplemented: false,
  workersOrchestrated: true,
  queueConsumed: false,
  parallelProcessing: false,
  persistenceImplemented: false,
  implementsCron: false,
  implementsQuartz: false,
  implementsHangfire: false,
  implementsCelery: false,
  implementsBullMq: false,
  implementsAzureScheduler: false,
  implementsAzureFunctionsTimer: false,
  implementsTaskScheduler: false,
  implementsRealScheduler: true,
  implementsTimer: true,
  implementsClock: false,
  implementsBackgroundService: true,
  implementsRetryReal: false,
  implementsDelayQueue: false,
  implementsThreadPool: false,
  implementsWorkers: false,
  implementsParallelProcessing: false,
  implementsRabbitMq: false,
  implementsKafka: false,
  implementsAzureServiceBus: false,
  implementsRedis: false,
  implementsHttp: false,
  implementsWebsocket: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

/** Capacidades estruturais do mock/test (sem acionamento operacional de Worker). */
export const DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES: SchedulerRuntimeCapabilities = {
  ...DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
  realScheduler: false,
  timerImplemented: false,
  jobDispatcherImplemented: false,
  workersOrchestrated: false,
  implementsRealScheduler: false,
  implementsTimer: false,
  implementsBackgroundService: false,
};

export function toCanonicalSchedulerCapabilities(
  capabilities: SchedulerRuntimeCapabilities = DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
): CanonicalSchedulerCapabilities {
  return {
    kind: "canonical-scheduler-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsUnregister: capabilities.supportsUnregister === true,
    supportsSchedule: capabilities.supportsSchedule === true,
    supportsCancel: capabilities.supportsCancel === true,
    supportsList: capabilities.supportsList === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalSchedule: capabilities.supportsCanonicalSchedule === true,
    runtimeReady: true,
    realScheduler: capabilities.realScheduler === true,
    cronImplemented: false,
    timerImplemented: capabilities.timerImplemented === true,
    retrySchedulingImplemented: false,
    delayJobsImplemented: false,
    jobDispatcherImplemented: capabilities.jobDispatcherImplemented === true,
    timeWindowsImplemented: false,
    workersOrchestrated: capabilities.workersOrchestrated === true,
    queueConsumed: false,
    parallelProcessing: false,
    persistenceImplemented: false,
    implementsCron: false,
    implementsQuartz: false,
    implementsHangfire: false,
    implementsCelery: false,
    implementsBullMq: false,
    implementsAzureScheduler: false,
    implementsAzureFunctionsTimer: false,
    implementsTaskScheduler: false,
    implementsRealScheduler: capabilities.implementsRealScheduler === true,
    implementsTimer: capabilities.implementsTimer === true,
    implementsClock: false,
    implementsBackgroundService: capabilities.implementsBackgroundService === true,
    implementsRetryReal: false,
    implementsDelayQueue: false,
    implementsThreadPool: false,
    implementsWorkers: false,
    implementsParallelProcessing: false,
    implementsRabbitMq: false,
    implementsKafka: false,
    implementsAzureServiceBus: false,
    implementsRedis: false,
    implementsHttp: false,
    implementsWebsocket: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
