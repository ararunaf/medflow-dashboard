/**
 * Modelos canônicos do Enterprise Worker Runtime — INF-06 / OPER-INF-W.
 *
 * Contrato canônico estável do WorkerRuntimePort.
 * OPER-INF-W: consumo operacional via QueueRuntimePort — sem novos Ports.
 * Sem Thread Pool. Sem Scheduler. Sem Cron. Sem paralelismo.
 * Sem RabbitMQ/Kafka/Azure/Redis/BullMQ. Sem Retry Engine. Sem Dead Letter.
 * Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
 */

/** Status estrutural de Worker / operação de Worker Runtime. */
export type CanonicalWorkerStatus =
  | "pending"
  | "registered"
  | "unregistered"
  | "allocated"
  | "released"
  | "heartbeat"
  | "idle"
  | "failed"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalWorkerIdentity = {
  kind: "canonical-worker-identity";
  workerId?: string;
  workerName?: string;
  taskId?: string;
  executionId?: string;
  correlationId?: string | null;
  sessionId?: string;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalWorkerProvider = {
  kind: "canonical-worker-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica de Worker / task / execução.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalWorkerMetadata = {
  kind: "canonical-worker-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Worker Runtime. */
export type CanonicalWorkerOperation =
  | "register"
  | "unregister"
  | "allocate"
  | "release"
  | "heartbeat"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Worker canônico.
 * OPER-INF-W: flags operacionais quando o adapter consome QueueRuntimePort.
 */
export type CanonicalWorker = {
  kind: "canonical-worker";
  workerId: string;
  workerName: string;
  identity?: CanonicalWorkerIdentity;
  metadata?: CanonicalWorkerMetadata;
  status: CanonicalWorkerStatus;
  allocated: boolean;
  lastHeartbeatAt?: string;
  createdAt: string;
  updatedAt: string;
  realWorkers: boolean;
  tasksExecuted: boolean;
  parallelProcessing: false;
  schedulerImplemented: false;
  threadPoolImplemented: false;
  persistenceImplemented: boolean;
  queueConsumed: boolean;
};

/**
 * Task canônica (referência de alocação / settle via QueueRuntimePort).
 */
export type CanonicalWorkerTask = {
  kind: "canonical-worker-task";
  taskId: string;
  workerId?: string;
  identity?: CanonicalWorkerIdentity;
  metadata?: CanonicalWorkerMetadata;
  status: CanonicalWorkerStatus;
  registeredAt: string;
  updatedAt: string;
  realWorkers: boolean;
  tasksExecuted: boolean;
  parallelProcessing: false;
  persistenceImplemented: boolean;
};

/**
 * Execução canônica (registro de settle ack/nack via QueueRuntimePort).
 */
export type CanonicalWorkerExecution = {
  kind: "canonical-worker-execution";
  executionId: string;
  workerId: string;
  taskId?: string;
  identity?: CanonicalWorkerIdentity;
  metadata?: CanonicalWorkerMetadata;
  status: CanonicalWorkerStatus;
  createdAt: string;
  updatedAt: string;
  realWorkers: boolean;
  tasksExecuted: boolean;
  parallelProcessing: false;
  persistenceImplemented: boolean;
};

/**
 * Resultado canônico de operação de Worker Runtime (INF-06 / OPER-INF-W).
 */
export type CanonicalWorkerResult = {
  kind: "canonical-worker-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalWorkerOperation;
  worker?: CanonicalWorker;
  task?: CanonicalWorkerTask;
  execution?: CanonicalWorkerExecution;
  identity?: CanonicalWorkerIdentity;
  metadata?: CanonicalWorkerMetadata;
  provider?: CanonicalWorkerProvider;
  realWorkers: boolean;
  tasksExecuted: boolean;
  parallelProcessing: false;
  schedulerImplemented: false;
  threadPoolImplemented: false;
  persistenceImplemented: boolean;
  queueConsumed: boolean;
  runtimeReady: true;
  status: CanonicalWorkerStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas do Worker Runtime.
 */
export type CanonicalWorkerStatistics = {
  kind: "canonical-worker-statistics";
  totalWorkers: number;
  registeredWorkers: number;
  allocatedWorkers: number;
  releasedWorkers: number;
  heartbeatCount: number;
  totalTasks: number;
  totalExecutions: number;
  realWorkersCount: number;
  tasksExecutedCount: number;
  parallelProcessingCount: number;
  schedulerImplementedCount: number;
  threadPoolImplementedCount: number;
  persistenceImplementedCount: number;
  queueConsumedCount: number;
};

/**
 * Saúde canônica do provedor Worker Runtime.
 */
export type CanonicalWorkerHealth = {
  kind: "canonical-worker-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedWorkerCount?: number;
  storedTaskCount?: number;
  storedExecutionCount?: number;
  queueRuntimeOk?: boolean;
  /** INF-07 — prontidão estrutural do Scheduler Runtime (dependência preparada). */
  schedulerRuntimeOk?: boolean;
  /** INF-08 — prontidão estrutural do Persistent Queue Runtime (dependência preparada). */
  persistentQueueRuntimeOk?: boolean;
  /** INF-09 — prontidão estrutural do Observability Runtime (dependência preparada). */
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  runtimeReady: true;
  realWorkers: boolean;
  tasksExecuted: boolean;
  parallelProcessing: false;
  schedulerImplemented: false;
  threadPoolImplemented: false;
  persistenceImplemented: boolean;
  queueConsumed: boolean;
};

/**
 * Capacidades canônicas declaradas do provedor Worker Runtime.
 */
export type CanonicalWorkerCapabilities = {
  kind: "canonical-worker-capabilities";
  supportsRegister: boolean;
  supportsUnregister: boolean;
  supportsAllocate: boolean;
  supportsRelease: boolean;
  supportsHeartbeat: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalWorker: boolean;
  runtimeReady: true;
  realWorkers: boolean;
  tasksExecuted: boolean;
  parallelProcessing: false;
  schedulerImplemented: false;
  threadPoolImplemented: false;
  persistenceImplemented: boolean;
  queueConsumed: boolean;
  implementsRabbitMq: false;
  implementsKafka: false;
  implementsAzureServiceBus: false;
  implementsAzureQueue: false;
  implementsRedis: false;
  implementsBullMq: false;
  implementsRealWorkers: boolean;
  implementsScheduler: false;
  implementsThreadPool: false;
  implementsCron: false;
  implementsDeadLetter: false;
  implementsRetryReal: false;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
