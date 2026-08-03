/**
 * Tipos vendor-agnósticos do Enterprise Queue Runtime — INF-05 / INF-06.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → QueueRuntimePort
 *     → Adapter → Queue Runtime Store → Canonical Queue Result
 *
 * Sem RabbitMQ. Sem Azure. Sem Kafka. Sem Redis. Sem workers. Sem filas reais.
 * INF-06: dependência Worker Runtime preparada — sem alocação/execução de Workers.
 */
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { SchedulerRuntimePort } from "../../scheduler-runtime/ports/scheduler-runtime-port";
import type { WorkerRuntimePort } from "../../worker-runtime/ports/worker-runtime-port";
import type {
  CanonicalQueue,
  CanonicalQueueBatch,
  CanonicalQueueCapabilities,
  CanonicalQueueHealth,
  CanonicalQueueMessage,
  CanonicalQueueMetadata,
  CanonicalQueueResult,
  CanonicalQueueStatistics,
} from "./canonical";
import type { QueueRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalQueue,
  CanonicalQueueBatch,
  CanonicalQueueCapabilities,
  CanonicalQueueHealth,
  CanonicalQueueIdentity,
  CanonicalQueueMessage,
  CanonicalQueueMetadata,
  CanonicalQueueOperation,
  CanonicalQueueProvider,
  CanonicalQueueResult,
  CanonicalQueueStatistics,
  CanonicalQueueStatus,
} from "./canonical";
export type { QueueRuntimeCapabilities };

/** Provedores / mecanismos do Queue Runtime. */
export type QueueRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type QueueRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type QueueRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type QueueRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: QueueRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type QueueRuntimeHealth = CanonicalQueueHealth & {
  provider: QueueRuntimeProviderId;
  status?: QueueRuntimeStatus;
  /** INF-06 — prontidão estrutural do Worker Runtime (dependência preparada). */
  workerRuntimeOk?: boolean;
  /** INF-07 — prontidão estrutural do Scheduler Runtime (dependência preparada). */
  schedulerRuntimeOk?: boolean;
  /** INF-08 — prontidão estrutural do Persistent Queue Runtime (dependência preparada). */
  persistentQueueRuntimeOk?: boolean;
};

/** Capacidades do adapter no nível do Port. */
export type QueueRuntimePortCapabilities = {
  provider: QueueRuntimeProviderId;
  adapterId: string;
  engine: QueueRuntimeCapabilities;
  canonical: CanonicalQueueCapabilities;
  supportsCanonicalQueue: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  /** INF-06 — dependência Worker Runtime preparada (sem consumo). */
  usesWorkerRuntimePort: boolean;
  /** INF-07 — dependência Scheduler Runtime preparada (sem consumo). */
  usesSchedulerRuntimePort: boolean;
  /** INF-08 — dependência Persistent Queue Runtime preparada (sem consumo). */
  usesPersistentQueueRuntimePort: boolean;
  runtimeReady: true;
  realQueueBackend: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  persistenceImplemented: false;
  implementsRabbitMq: false;
  implementsKafka: false;
  implementsAzureServiceBus: false;
  implementsAzureQueue: false;
  implementsRedis: false;
  implementsBullMq: false;
  implementsWorkers: false;
  implementsScheduler: false;
  implementsDeadLetter: false;
  implementsRetryReal: false;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type QueueRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type QueueRuntimeInfo = {
  providerId: QueueRuntimeProviderId;
  metadata: QueueRuntimeProviderMetadata;
  status: QueueRuntimeStatus;
  providerType: "QUEUE_RUNTIME";
  capabilities: QueueRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type QueueRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type QueueRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: QueueRuntimeProviderId;
  telemetry: QueueRuntimeTelemetry;
  logs?: readonly QueueRuntimeStructuredLog[];
  simulated?: boolean;
};

export type EnqueueInput = QueueRuntimeOperationalControls & {
  queueName?: string;
  queueId?: string;
  messageId?: string;
  payloadRef?: string;
  correlationId?: string | null;
  metadata?: CanonicalQueueMetadata;
};

export type EnqueueResult = QueueRuntimeOperationEnvelope & {
  result?: CanonicalQueueResult;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
};

export type DequeueInput = QueueRuntimeOperationalControls & {
  queueName?: string;
  queueId?: string;
};

export type DequeueResult = QueueRuntimeOperationEnvelope & {
  result?: CanonicalQueueResult;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
};

export type PeekInput = QueueRuntimeOperationalControls & {
  queueName?: string;
  queueId?: string;
  messageId?: string;
};

export type PeekResult = QueueRuntimeOperationEnvelope & {
  result?: CanonicalQueueResult;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
};

export type AckInput = QueueRuntimeOperationalControls & {
  queueName?: string;
  queueId?: string;
  messageId: string;
};

export type AckResult = QueueRuntimeOperationEnvelope & {
  result?: CanonicalQueueResult;
  queueMessage?: CanonicalQueueMessage;
};

export type NackInput = QueueRuntimeOperationalControls & {
  queueName?: string;
  queueId?: string;
  messageId: string;
};

export type NackResult = QueueRuntimeOperationEnvelope & {
  result?: CanonicalQueueResult;
  queueMessage?: CanonicalQueueMessage;
};

export type PurgeInput = QueueRuntimeOperationalControls & {
  queueName?: string;
  queueId?: string;
};

export type PurgeResult = QueueRuntimeOperationEnvelope & {
  result?: CanonicalQueueResult;
  queue?: CanonicalQueue;
  batch?: CanonicalQueueBatch;
  purgedCount?: number;
};

export type StatsInput = QueueRuntimeOperationalControls & {
  queueName?: string;
  queueId?: string;
};

export type StatsResult = QueueRuntimeOperationEnvelope & {
  statistics?: CanonicalQueueStatistics;
  result?: CanonicalQueueResult;
};

/**
 * Dependências Enterprise injetadas no Queue Runtime (INF-06 / INF-07 / INF-08).
 * Worker Runtime é dependência obrigatória preparada — NÃO alocada/executada.
 * Scheduler Runtime é dependência preparada (opcional no Port shape) — NÃO agendada/executada.
 * Persistent Queue Runtime é dependência preparada (opcional no Port shape) — NÃO persistida/consumida.
 */
export type QueueRuntimeEnterpriseDeps = {
  getWorkerRuntimePort(): WorkerRuntimePort;
  /** INF-07 — Scheduler Runtime preparado (sem consumo funcional). */
  getSchedulerRuntimePort?: () => SchedulerRuntimePort;
  /** INF-08 — Persistent Queue Runtime preparado (sem consumo funcional). */
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
};

/** Opções de resolução do QueueRuntimePort. */
export type QueueRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (INF-05).
   */
  provider?: QueueRuntimeProviderId;
  /** INF-06 — Worker Runtime preparado (sem consumo funcional). */
  enterpriseDeps?: QueueRuntimeEnterpriseDeps;
};

/** Entrada de registro no QueueRuntimeRegistry. */
export type QueueRuntimeRegistration = {
  providerId: QueueRuntimeProviderId;
  name: string;
  version: string;
  status: QueueRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: QueueRuntimeCapabilities;
  description?: string;
};
