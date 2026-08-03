/**
 * Modelos canônicos do Enterprise Scheduler Runtime — INF-07.
 *
 * Infraestrutura canônica estrutural de Schedulers futuros.
 * Sem Scheduler real. Sem Cron. Sem Quartz/Hangfire/Celery/BullMQ.
 * Sem Timer real. Sem Clock real. Sem Background Services.
 * Sem Retry Scheduling real. Sem Delay Jobs reais. Sem Job Dispatcher real.
 * Sem Time Windows reais. Sem orquestração real de Workers.
 * Sem Workers reais. Sem filas reais. Sem processamento paralelo.
 * Sem RabbitMQ/Kafka/Azure/Redis. Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
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
 * Schedule canônico estrutural.
 * Representa a infraestrutura de Schedule — sem timer real, sem cron.
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
  /** Sempre false — nenhum Scheduler real nesta fundação. */
  realScheduler: false;
  cronImplemented: false;
  timerImplemented: false;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: false;
  timeWindowsImplemented: false;
  workersOrchestrated: false;
  queueConsumed: false;
  parallelProcessing: false;
  persistenceImplemented: false;
};

/**
 * Job canônico estrutural (referência apenas — nunca agendado/executado de fato).
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
  realScheduler: false;
  cronImplemented: false;
  timerImplemented: false;
  workersOrchestrated: false;
  persistenceImplemented: false;
};

/**
 * Dispatch canônico estrutural (registro apenas — nunca despachado).
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
  realScheduler: false;
  cronImplemented: false;
  jobDispatcherImplemented: false;
  workersOrchestrated: false;
  persistenceImplemented: false;
};

/**
 * Resultado canônico de operação de Scheduler Runtime (INF-07).
 * Contém apenas referência/estrutura canônica — nunca agendamento real.
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
  /** Sempre false — nenhum Scheduler real. */
  realScheduler: false;
  cronImplemented: false;
  timerImplemented: false;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: false;
  timeWindowsImplemented: false;
  workersOrchestrated: false;
  queueConsumed: false;
  parallelProcessing: false;
  persistenceImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem Scheduler real). */
  runtimeReady: true;
  status: CanonicalSchedulerStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Scheduler Runtime (in-process).
 */
export type CanonicalSchedulerStatistics = {
  kind: "canonical-scheduler-statistics";
  totalSchedules: number;
  registeredSchedules: number;
  activeSchedules: number;
  cancelledSchedules: number;
  totalJobs: number;
  totalDispatches: number;
  realSchedulerCount: 0;
  cronImplementedCount: 0;
  timerImplementedCount: 0;
  retrySchedulingImplementedCount: 0;
  delayJobsImplementedCount: 0;
  jobDispatcherImplementedCount: 0;
  timeWindowsImplementedCount: 0;
  workersOrchestratedCount: 0;
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
  runtimeReady: true;
  realScheduler: false;
  cronImplemented: false;
  timerImplemented: false;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: false;
  timeWindowsImplemented: false;
  workersOrchestrated: false;
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
  realScheduler: false;
  cronImplemented: false;
  timerImplemented: false;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: false;
  timeWindowsImplemented: false;
  workersOrchestrated: false;
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
  implementsRealScheduler: false;
  implementsTimer: false;
  implementsClock: false;
  implementsBackgroundService: false;
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
