/**
 * OPER-INF-O — tipos de diagnóstico operacional (somente leitura).
 *
 * Observability coleta e expõe informações dos Ports existentes.
 * Nunca executa regras. Nunca altera o fluxo. Nunca interfere na execução.
 * Sem Prometheus / Grafana / OpenTelemetry / alertas / tracing distribuído.
 */

export type OperationalRuntimeStatus = "ready" | "degraded" | "unavailable" | "unknown";

/** Contadores operacionais agregados (Port.stats — somente leitura). */
export type OperationalCounters = {
  queueTotalMessages: number;
  queueEnqueued: number;
  queueDequeued: number;
  queueAcked: number;
  queueNacked: number;
  queuePurged: number;
  workerTotal: number;
  workerRegistered: number;
  workerAllocated: number;
  workerHeartbeats: number;
  workerTasks: number;
  workerExecutions: number;
  schedulerTotal: number;
  schedulerRegistered: number;
  schedulerActive: number;
  schedulerCancelled: number;
  schedulerJobs: number;
  schedulerDispatches: number;
  deadLetterTotal: number;
  observabilityScopes: number;
  observabilitySignals: number;
  observabilityEnvelopes: number;
};

/** Timers / sinais temporais do Scheduler (somente leitura). */
export type OperationalTimers = {
  schedulerTimerImplementedCount: number;
  schedulerActiveSchedules: number;
  collectionLatencyMs: number;
};

/** Throughput derivado dos contadores dos Ports (snapshot, não série temporal). */
export type OperationalThroughput = {
  messagesPublished: number;
  messagesConsumed: number;
  queueConsumedByWorkers: number;
  workersOrchestrated: number;
  schedulerDispatches: number;
};

/** Filas pendentes (mensagens ainda na fila). */
export type OperationalPendingQueues = {
  pendingMessages: number;
  totalQueues: number;
};

/** Workers ativos (alocados / em execução estrutural-operacional). */
export type OperationalActiveWorkers = {
  allocatedWorkers: number;
  registeredWorkers: number;
  totalWorkers: number;
};

/** Status do Scheduler Runtime (somente leitura). */
export type OperationalSchedulerStatus = {
  status: OperationalRuntimeStatus;
  activeSchedules: number;
  totalSchedules: number;
  totalDispatches: number;
  ok: boolean;
};

/** Stats da Dead Letter via Ports (DLQ interno → QueueRuntimePort). */
export type OperationalDeadLetterStats = {
  totalDeadLetters: number;
  ok: boolean;
  source: "dead-letter-port" | "queue-stats" | "unavailable";
};

/** Health checks agregados dos Ports (shape + stats.ok — sem ciclo health↔health). */
export type OperationalHealthChecks = {
  queueRuntimeOk: boolean;
  workerRuntimeOk: boolean;
  schedulerRuntimeOk: boolean;
  persistentQueueRuntimeOk: boolean;
  tissRuntimeOk: boolean;
  scalabilityRuntimeOk: boolean;
  deadLetterOk: boolean;
};

/**
 * Snapshot operacional completo exposto por stats()/health().
 * Somente leitura — não decide retry, não despacha, não muta filas/workers.
 */
export type OperationalRuntimeDiagnostics = {
  kind: "operational-runtime-diagnostics";
  collectedAt: string;
  runtimeStatus: OperationalRuntimeStatus;
  healthChecks: OperationalHealthChecks;
  counters: OperationalCounters;
  timers: OperationalTimers;
  throughput: OperationalThroughput;
  pendingQueues: OperationalPendingQueues;
  activeWorkers: OperationalActiveWorkers;
  schedulerStatus: OperationalSchedulerStatus;
  deadLetter: OperationalDeadLetterStats;
  /** Sempre true nesta sprint — coleta Port-only ativa. */
  operationalCollection: true;
  /** Sempre false — sem backends externos de observabilidade. */
  realObservabilityBackend: false;
  openTelemetryImplemented: false;
  prometheusImplemented: false;
  grafanaImplemented: false;
  realAlertsImplemented: false;
  distributedTracingImplemented: false;
};
