/**
 * OPER-INF-W — motor operacional interno do Worker Runtime.
 * Não é Port. Não é Gateway. Consome exclusivamente QueueRuntimePort.
 * processMessage (opcional) ativa capabilities (TISS-RUNTIME-01B+) sem Port novo.
 */
export {
  DEFAULT_WORKER_POLL_INTERVAL_MS,
  WorkerQueueConsumer,
  type WorkerQueueConsumerOptions,
  type WorkerQueueProcessMessage,
  type WorkerQueueProcessMessageContext,
  type WorkerQueueProcessOutcome,
  type WorkerQueueProcessedEvent,
  type WorkerQueueSessionStartInput,
} from "./worker-queue-consumer";
