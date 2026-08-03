/**
 * SchedulerRuntimeCapabilities — capacidades declarativas (INF-07).
 *
 * Apenas declaração estrutural. Sem Scheduler real. Sem Cron. Sem Timer.
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
  runtimeReady?: true;
  realScheduler?: false;
  cronImplemented?: false;
  timerImplemented?: false;
  retrySchedulingImplemented?: false;
  delayJobsImplemented?: false;
  jobDispatcherImplemented?: false;
  timeWindowsImplemented?: false;
  workersOrchestrated?: false;
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
  implementsRealScheduler?: false;
  implementsTimer?: false;
  implementsClock?: false;
  implementsBackgroundService?: false;
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
  runtimeReady: true,
  realScheduler: false,
  cronImplemented: false,
  timerImplemented: false,
  retrySchedulingImplemented: false,
  delayJobsImplemented: false,
  jobDispatcherImplemented: false,
  timeWindowsImplemented: false,
  workersOrchestrated: false,
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
  implementsRealScheduler: false,
  implementsTimer: false,
  implementsClock: false,
  implementsBackgroundService: false,
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

export const DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES: SchedulerRuntimeCapabilities = {
  ...DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
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
    realScheduler: false,
    cronImplemented: false,
    timerImplemented: false,
    retrySchedulingImplemented: false,
    delayJobsImplemented: false,
    jobDispatcherImplemented: false,
    timeWindowsImplemented: false,
    workersOrchestrated: false,
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
    implementsRealScheduler: false,
    implementsTimer: false,
    implementsClock: false,
    implementsBackgroundService: false,
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
