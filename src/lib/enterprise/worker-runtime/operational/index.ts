/**
 * OPER-INF-W — motor operacional interno do Worker Runtime.
 * Não é Port. Não é Gateway. Consome exclusivamente QueueRuntimePort.
 */
export {
  DEFAULT_WORKER_POLL_INTERVAL_MS,
  WorkerQueueConsumer,
  type WorkerQueueConsumerOptions,
  type WorkerQueueProcessOutcome,
  type WorkerQueueProcessedEvent,
  type WorkerQueueSessionStartInput,
} from "./worker-queue-consumer";
