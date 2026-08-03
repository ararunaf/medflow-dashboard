/**
 * Modelos canônicos do Enterprise Persistent Queue Runtime — INF-08.
 *
 * Infraestrutura canônica estrutural de filas persistentes futuras.
 * Sem RabbitMQ. Sem Kafka. Sem Azure Service Bus. Sem Azure Queue Storage.
 * Sem Redis Streams. Sem BullMQ. Sem filas persistentes reais.
 * Sem Dead Letter Queue real. Sem Retry Queue real. Sem Delay Queue real.
 * Sem Priority Queue real. Sem Message Persistence real.
 * Sem Workers reais. Sem Scheduler real. Sem processamento assíncrono.
 * Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
 */

/** Status estrutural de PersistentQueue / Message / operação de Persistent Queue Runtime. */
export type CanonicalPersistentQueueStatus =
  | "pending"
  | "registered"
  | "unregistered"
  | "persisted"
  | "released"
  | "listed"
  | "idle"
  | "failed"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalPersistentQueueIdentity = {
  kind: "canonical-persistent-queue-identity";
  queueId?: string;
  queueName?: string;
  messageId?: string;
  envelopeId?: string;
  correlationId?: string | null;
  sessionId?: string;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalPersistentQueueProvider = {
  kind: "canonical-persistent-queue-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica de PersistentQueue / Message / Envelope.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalPersistentQueueMetadata = {
  kind: "canonical-persistent-queue-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Persistent Queue Runtime. */
export type CanonicalPersistentQueueOperation =
  | "register"
  | "unregister"
  | "persist"
  | "release"
  | "list"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * PersistentQueue canônico estrutural.
 * Representa a infraestrutura de PersistentQueue — sem backend persistente real.
 */
export type CanonicalPersistentQueue = {
  kind: "canonical-persistent-queue";
  queueId: string;
  queueName: string;
  identity?: CanonicalPersistentQueueIdentity;
  metadata?: CanonicalPersistentQueueMetadata;
  status: CanonicalPersistentQueueStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** Sempre false — nenhum backend persistente real nesta fundação. */
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
};

/**
 * Message canônica estrutural (referência apenas — nunca persistida/entregue de fato).
 */
export type CanonicalPersistentMessage = {
  kind: "canonical-persistent-message";
  messageId: string;
  queueId?: string;
  identity?: CanonicalPersistentQueueIdentity;
  metadata?: CanonicalPersistentQueueMetadata;
  status: CanonicalPersistentQueueStatus;
  registeredAt: string;
  updatedAt: string;
  realPersistentBackend: false;
  rabbitMqImplemented: false;
  kafkaImplemented: false;
  deadLetterImplemented: false;
  messagePersistenceImplemented: false;
};

/**
 * Envelope canônico estrutural (registro apenas — nunca despachado).
 */
export type CanonicalPersistentEnvelope = {
  kind: "canonical-persistent-envelope";
  envelopeId: string;
  queueId: string;
  messageId?: string;
  identity?: CanonicalPersistentQueueIdentity;
  metadata?: CanonicalPersistentQueueMetadata;
  status: CanonicalPersistentQueueStatus;
  createdAt: string;
  updatedAt: string;
  realPersistentBackend: false;
  rabbitMqImplemented: false;
  redisStreamsImplemented: false;
  deadLetterImplemented: false;
  messagePersistenceImplemented: false;
};

/**
 * Resultado canônico de operação de Persistent Queue Runtime (INF-08).
 * Contém apenas referência/estrutura canônica — nunca persistência/mensageria real.
 */
export type CanonicalPersistentQueueResult = {
  kind: "canonical-persistent-queue-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalPersistentQueueOperation;
  queue?: CanonicalPersistentQueue;
  message?: CanonicalPersistentMessage;
  envelope?: CanonicalPersistentEnvelope;
  identity?: CanonicalPersistentQueueIdentity;
  metadata?: CanonicalPersistentQueueMetadata;
  provider?: CanonicalPersistentQueueProvider;
  /** Sempre false — nenhum backend persistente real. */
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
  /** Sempre true — runtime estrutural pronto (sem backend persistente real). */
  runtimeReady: true;
  status: CanonicalPersistentQueueStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Persistent Queue Runtime (in-process).
 */
export type CanonicalPersistentQueueStatistics = {
  kind: "canonical-persistent-queue-statistics";
  totalQueues: number;
  registeredQueues: number;
  activeQueues: number;
  releasedQueues: number;
  totalMessages: number;
  totalEnvelopes: number;
  realPersistentBackendCount: 0;
  rabbitMqImplementedCount: 0;
  kafkaImplementedCount: 0;
  azureServiceBusImplementedCount: 0;
  azureQueueImplementedCount: 0;
  redisStreamsImplementedCount: 0;
  bullMqImplementedCount: 0;
  deadLetterImplementedCount: 0;
  retryQueueImplementedCount: 0;
  delayQueueImplementedCount: 0;
  messagePersistenceImplementedCount: 0;
};

/**
 * Saúde canônica do provedor Persistent Queue Runtime.
 */
export type CanonicalPersistentQueueHealth = {
  kind: "canonical-persistent-queue-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedQueueCount?: number;
  storedMessageCount?: number;
  storedEnvelopeCount?: number;
  queueRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  /** INF-09 — prontidão estrutural do Observability Runtime (dependência preparada). */
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
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
};

/**
 * Capacidades canônicas declaradas do provedor Persistent Queue Runtime.
 */
export type CanonicalPersistentQueueCapabilities = {
  kind: "canonical-persistent-queue-capabilities";
  supportsRegister: boolean;
  supportsUnregister: boolean;
  supportsPersist: boolean;
  supportsRelease: boolean;
  supportsList: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalPersistentQueue: boolean;
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
