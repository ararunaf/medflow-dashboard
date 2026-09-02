/**
 * Tipos vendor-agnósticos do Enterprise Persistent Queue Runtime — INF-08.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → PersistentQueueRuntimePort
 *     → Adapter → Persistent Queue Runtime Store → Canonical Persistent Queue Result
 *
 * Sem backends persistentes reais. Sem RabbitMQ/Kafka/Azure/Redis/BullMQ. Sem Workers reais.
 */
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";
import type {
  CanonicalPersistentQueue,
  CanonicalPersistentQueueCapabilities,
  CanonicalPersistentEnvelope,
  CanonicalPersistentQueueHealth,
  CanonicalPersistentMessage,
  CanonicalPersistentQueueMetadata,
  CanonicalPersistentQueueResult,
  CanonicalPersistentQueueStatistics,
} from "./canonical";
import type { PersistentQueueRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalPersistentQueue,
  CanonicalPersistentQueueCapabilities,
  CanonicalPersistentEnvelope,
  CanonicalPersistentQueueHealth,
  CanonicalPersistentQueueIdentity,
  CanonicalPersistentMessage,
  CanonicalPersistentQueueMetadata,
  CanonicalPersistentQueueOperation,
  CanonicalPersistentQueueProvider,
  CanonicalPersistentQueueResult,
  CanonicalPersistentQueueStatistics,
  CanonicalPersistentQueueStatus,
} from "./canonical";
export type { PersistentQueueRuntimeCapabilities };

/** Provedores / mecanismos do Persistent Queue Runtime. */
export type PersistentQueueRuntimeProviderId =
  | "mock"
  | "test"
  | "default"
  | "enterprise"
  | "real-tiss";

/** Status operacional declarado no registry. */
export type PersistentQueueRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type PersistentQueueRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type PersistentQueueRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: PersistentQueueRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type PersistentQueueRuntimeHealth = CanonicalPersistentQueueHealth & {
  provider: PersistentQueueRuntimeProviderId;
  status?: PersistentQueueRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type PersistentQueueRuntimePortCapabilities = {
  provider: PersistentQueueRuntimeProviderId;
  adapterId: string;
  engine: PersistentQueueRuntimeCapabilities;
  canonical: CanonicalPersistentQueueCapabilities;
  supportsCanonicalPersistentQueue: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  /** INF-09 — dependência Observability Runtime preparada (sem consumo). */
  usesObservabilityRuntimePort: boolean;
  /** INF-10 — dependência Scalability Runtime preparada (sem consumo). */
  usesScalabilityRuntimePort: boolean;
  runtimeReady: true;
  realPersistentBackend: false;
  rabbitMqImplemented: false;
  kafkaImplemented: false;
  azureServiceBusImplemented: false;
  azureQueueImplemented: false;
  redisStreamsImplemented: false;
  bullMqImplemented: false;
  deadLetterImplemented: false;
  retryQueueImplemented: false;
  delayQueueImplemented: false;
  messagePersistenceImplemented: false;
  implementsRabbitMq: false;
  implementsKafka: false;
  implementsAzureServiceBus: false;
  implementsAzureQueue: false;
  implementsRedisStreams: false;
  implementsBullMq: false;
  implementsDeadLetter: false;
  implementsRetryQueue: false;
  implementsDelayQueue: false;
  implementsPriorityQueue: false;
  implementsMessagePersistence: false;
  implementsRetryEngine: false;
  implementsRealPersistentBackend: false;
  implementsThreadPool: false;
  implementsWorkers: false;
  implementsParallelProcessing: false;
  implementsRedis: false;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type PersistentQueueRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type PersistentQueueRuntimeInfo = {
  providerId: PersistentQueueRuntimeProviderId;
  metadata: PersistentQueueRuntimeProviderMetadata;
  status: PersistentQueueRuntimeStatus;
  providerType: "PERSISTENT_QUEUE_RUNTIME";
  capabilities: PersistentQueueRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type PersistentQueueRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type PersistentQueueRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: PersistentQueueRuntimeProviderId;
  telemetry: PersistentQueueRuntimeTelemetry;
  logs?: readonly PersistentQueueRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterPersistentQueueInput = PersistentQueueRuntimeOperationalControls & {
  queueName?: string;
  queueId?: string;
  correlationId?: string | null;
  metadata?: CanonicalPersistentQueueMetadata;
};

export type RegisterPersistentQueueResult = PersistentQueueRuntimeOperationEnvelope & {
  result?: CanonicalPersistentQueueResult;
  queue?: CanonicalPersistentQueue;
};

export type UnregisterPersistentQueueInput = PersistentQueueRuntimeOperationalControls & {
  queueId: string;
};

export type UnregisterPersistentQueueResult = PersistentQueueRuntimeOperationEnvelope & {
  result?: CanonicalPersistentQueueResult;
  queue?: CanonicalPersistentQueue;
};

export type PersistMessageInput = PersistentQueueRuntimeOperationalControls & {
  queueId?: string;
  queueName?: string;
  messageId?: string;
  metadata?: CanonicalPersistentQueueMetadata;
};

export type PersistMessageResult = PersistentQueueRuntimeOperationEnvelope & {
  result?: CanonicalPersistentQueueResult;
  queue?: CanonicalPersistentQueue;
  /** Nome distinto de OperationEnvelope.message (texto). */
  persistentMessage?: CanonicalPersistentMessage;
  envelope?: CanonicalPersistentEnvelope;
};

export type ReleaseMessageInput = PersistentQueueRuntimeOperationalControls & {
  queueId: string;
  messageId?: string;
};

export type ReleaseMessageResult = PersistentQueueRuntimeOperationEnvelope & {
  result?: CanonicalPersistentQueueResult;
  queue?: CanonicalPersistentQueue;
  /** Nome distinto de OperationEnvelope.message (texto). */
  persistentMessage?: CanonicalPersistentMessage;
};

export type ListPersistentQueuesInput = PersistentQueueRuntimeOperationalControls & {
  queueId?: string;
  activeOnly?: boolean;
};

export type ListPersistentQueuesResult = PersistentQueueRuntimeOperationEnvelope & {
  queues?: readonly CanonicalPersistentQueue[];
  messages?: readonly CanonicalPersistentMessage[];
  result?: CanonicalPersistentQueueResult;
};

export type PersistentQueueStatsInput = PersistentQueueRuntimeOperationalControls & {
  queueId?: string;
};

export type PersistentQueueStatsResult = PersistentQueueRuntimeOperationEnvelope & {
  statistics?: CanonicalPersistentQueueStatistics;
  result?: CanonicalPersistentQueueResult;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * Queue + Worker + Scheduler Runtime são dependências obrigatórias preparadas — NÃO consumidas nesta sprint.
 * Observability Runtime é dependência preparada (opcional no Port shape) — NÃO observada/emitida.
 */
export type PersistentQueueRuntimeEnterpriseDeps = {
  getQueueRuntimePort(): QueueRuntimePort;
  /** INF-09 — Observability Runtime preparado (sem consumo funcional). */
  /** INF-10 — Scalability Runtime preparado (sem consumo funcional). */
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
};

/** Opções de resolução do PersistentQueueRuntimePort. */
export type PersistentQueueRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (INF-08).
   */
  provider?: PersistentQueueRuntimeProviderId;
  enterpriseDeps?: PersistentQueueRuntimeEnterpriseDeps;
};

/** Entrada de registro no PersistentQueueRuntimeRegistry. */
export type PersistentQueueRuntimeRegistration = {
  providerId: PersistentQueueRuntimeProviderId;
  name: string;
  version: string;
  status: PersistentQueueRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: PersistentQueueRuntimeCapabilities;
  description?: string;
};
