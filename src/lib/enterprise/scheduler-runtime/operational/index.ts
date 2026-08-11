/**
 * OPER-INF-S — motor operacional interno do Scheduler Runtime.
 * Não é Port. Não é Gateway. Consome exclusivamente WorkerRuntimePort.
 */
export {
  DEFAULT_SCHEDULER_MAX_CONCURRENT,
  DEFAULT_SCHEDULER_POLL_INTERVAL_MS,
  SchedulerWorkerDispatcher,
  type SchedulerDispatchOutcome,
  type SchedulerDispatchedEvent,
  type SchedulerSessionStartInput,
  type SchedulerWorkerDispatcherOptions,
} from "./scheduler-worker-dispatcher";
