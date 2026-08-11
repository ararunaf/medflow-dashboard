/**
 * Modelos canônicos do Enterprise Scheduler Runtime — INF-07 / OPER-INF-S.
 *
 * OPER-INF-S: flags operacionais (realScheduler / timerImplemented /
 * jobDispatcherImplemented / workersOrchestrated) quando o adapter aciona
 * WorkerRuntimePort. Sem Cron. Sem Quartz/Hangfire/Celery/BullMQ.
 * Sem acesso a QueueRuntimePort. Sem paralelismo. Sem RabbitMQ/Kafka/Azure/Redis.
 * Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
 */

/** Status estrutural de Schedule / Job / operação de Scheduler Runtime. */
export type CanonicalSchedulerStatus =
  | "pending"
  | "registered"
  | "unregistered"
  | "scheduled"
  | "cancelled"
  | "listed"
  | "idle"
  | "failed"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalSchedulerIdentity = {
  kind: "canonical-scheduler-identity";
  scheduleId?: string;
  scheduleName?: string;
  jobId?: string;
  dispatchId?: string;
  correlationId?: string | null;
  sessionId?: string;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalSchedulerProvider = {
  kind: "canonical-scheduler-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica de Schedule / Job / Dispatch.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalSchedulerMetadata = {
  kind: "canonical-scheduler-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Scheduler Runtime. */
export type CanonicalSchedulerOperation =
  | "register"
  | "unregister"
  | "schedule"
  | "cancel"
  | "list"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Schedule canônico.
 * OPER-INF-S: flags operacionais quando o adapter aciona WorkerRuntimePort.
 */
export type CanonicalSchedule = {
  kind: "canonical-schedule";
  scheduleId: string;
  scheduleName: string;
  identity?: CanonicalSchedulerIdentity;
  metadata?: CanonicalSchedulerMetadata;
  status: CanonicalSchedulerStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  realScheduler: boolean;
  cronImplemented: false;
  timerImplemented: boolean;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: boolean;
  timeWindowsImplemented: false;
  workersOrchestrated: boolean;
  queueConsumed: false;
  parallelProcessing: false;
  persistenceImplemented: false;
};

/**
 * Job canônico (OPER-INF-S: agendado temporalmente via dispatcher interno).
 */
export type CanonicalSchedulerJob = {
  kind: "canonical-scheduler-job";
  jobId: string;
  scheduleId?: string;
  identity?: CanonicalSchedulerIdentity;
  metadata?: CanonicalSchedulerMetadata;
  status: CanonicalSchedulerStatus;
  registeredAt: string;
  updatedAt: string;
  realScheduler: boolean;
  cronImplemented: false;
  timerImplemented: boolean;
  workersOrchestrated: boolean;
  persistenceImplemented: false;
};

/**
 * Dispatch canônico (OPER-INF-S: despacho via WorkerRuntimePort.allocate).
 */
export type CanonicalSchedulerDispatch = {
  kind: "canonical-scheduler-dispatch";
  dispatchId: string;
  scheduleId: string;
  jobId?: string;
  identity?: CanonicalSchedulerIdentity;
  metadata?: CanonicalSchedulerMetadata;
  status: CanonicalSchedulerStatus;
  createdAt: string;
  updatedAt: string;
  realScheduler: boolean;
  cronImplemented: false;
  jobDispatcherImplemented: boolean;
  workersOrchestrated: boolean;
  persistenceImplemented: false;
};

/**
 * Resultado canônico de operação de Scheduler Runtime (INF-07 / OPER-INF-S).
 */
export type CanonicalSchedulerResult = {
  kind: "canonical-scheduler-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalSchedulerOperation;
  schedule?: CanonicalSchedule;
  job?: CanonicalSchedulerJob;
  dispatch?: CanonicalSchedulerDispatch;
  identity?: CanonicalSchedulerIdentity;
  metadata?: CanonicalSchedulerMetadata;
  provider?: CanonicalSchedulerProvider;
  realScheduler: boolean;
  cronImplemented: false;
  timerImplemented: boolean;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: boolean;
  timeWindowsImplemented: false;
  workersOrchestrated: boolean;
  queueConsumed: false;
  parallelProcessing: false;
  persistenceImplemented: false;
  runtimeReady: true;
  status: CanonicalSchedulerStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas do Scheduler Runtime (in-process + contadores operacionais).
 */
export type CanonicalSchedulerStatistics = {
  kind: "canonical-scheduler-statistics";
  totalSchedules: number;
  registeredSchedules: number;
  activeSchedules: number;
  cancelledSchedules: number;
  totalJobs: number;
  totalDispatches: number;
  realSchedulerCount: number;
  cronImplementedCount: 0;
  timerImplementedCount: number;
  retrySchedulingImplementedCount: 0;
  delayJobsImplementedCount: 0;
  jobDispatcherImplementedCount: number;
  timeWindowsImplementedCount: 0;
  workersOrchestratedCount: number;
  queueConsumedCount: 0;
  parallelProcessingCount: 0;
  persistenceImplementedCount: 0;
};

/**
 * Saúde canônica do provedor Scheduler Runtime.
 */
export type CanonicalSchedulerHealth = {
  kind: "canonical-scheduler-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedScheduleCount?: number;
  storedJobCount?: number;
  storedDispatchCount?: number;
  queueRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  /** INF-08 — prontidão estrutural do Persistent Queue Runtime (dependência preparada). */
  persistentQueueRuntimeOk?: boolean;
  /** INF-09 — prontidão estrutural do Observability Runtime (dependência preparada). */
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  runtimeReady: true;
  realScheduler: boolean;
  cronImplemented: false;
  timerImplemented: boolean;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: boolean;
  timeWindowsImplemented: false;
  workersOrchestrated: boolean;
  queueConsumed: false;
  parallelProcessing: false;
  persistenceImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Scheduler Runtime.
 */
export type CanonicalSchedulerCapabilities = {
  kind: "canonical-scheduler-capabilities";
  supportsRegister: boolean;
  supportsUnregister: boolean;
  supportsSchedule: boolean;
  supportsCancel: boolean;
  supportsList: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalSchedule: boolean;
  runtimeReady: true;
  realScheduler: boolean;
  cronImplemented: false;
  timerImplemented: boolean;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: boolean;
  timeWindowsImplemented: false;
  workersOrchestrated: boolean;
  queueConsumed: false;
  parallelProcessing: false;
  persistenceImplemented: false;
  implementsCron: false;
  implementsQuartz: false;
  implementsHangfire: false;
  implementsCelery: false;
  implementsBullMq: false;
  implementsAzureScheduler: false;
  implementsAzureFunctionsTimer: false;
  implementsTaskScheduler: false;
  implementsRealScheduler: boolean;
  implementsTimer: boolean;
  implementsClock: false;
  implementsBackgroundService: boolean;
  implementsRetryReal: false;
  implementsDelayQueue: false;
  implementsThreadPool: false;
  implementsWorkers: false;
  implementsParallelProcessing: false;
  implementsRabbitMq: false;
  implementsKafka: false;
  implementsAzureServiceBus: false;
  implementsRedis: false;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
