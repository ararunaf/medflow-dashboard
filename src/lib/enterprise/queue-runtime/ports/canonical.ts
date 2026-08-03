/**
 * Modelos canônicos do Enterprise Queue Runtime — INF-05.
 *
 * Infraestrutura canônica estrutural de filas futuras.
 * Sem RabbitMQ. Sem Azure Service Bus. Sem Kafka. Sem Redis.
 * Sem workers. Sem scheduler. Sem processamento assíncrono real.
 * Sem persistência real. Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture.
 */

/** Status estrutural de mensagem / operação de Queue Runtime. */
export type CanonicalQueueStatus =
  | "pending"
  | "enqueued"
  | "dequeued"
  | "acked"
  | "nacked"
  | "purged"
  | "failed"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalQueueIdentity = {
  kind: "canonical-queue-identity";
  queueId?: string;
  queueName?: string;
  messageId?: string;
  batchId?: string;
  correlationId?: string | null;
  sessionId?: string;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalQueueProvider = {
  kind: "canonical-queue-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica de fila / mensagem / operação.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalQueueMetadata = {
  kind: "canonical-queue-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Queue Runtime. */
export type CanonicalQueueOperation =
  | "enqueue"
  | "dequeue"
  | "peek"
  | "ack"
  | "nack"
  | "purge"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Fila canônica estrutural.
 * Representa a infraestrutura de fila — sem backend real, sem workers.
 */
export type CanonicalQueue = {
  kind: "canonical-queue";
  queueId: string;
  queueName: string;
  identity?: CanonicalQueueIdentity;
  metadata?: CanonicalQueueMetadata;
  messageIds: readonly string[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  /** Sempre false — nenhum backend real nesta fundação. */
  realQueueBackend: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  persistenceImplemented: false;
};

/**
 * Mensagem canônica estrutural.
 * Pode existir no store in-memory — NÃO é processada / entregue / consumida de fato.
 */
export type CanonicalQueueMessage = {
  kind: "canonical-queue-message";
  messageId: string;
  queueId: string;
  identity?: CanonicalQueueIdentity;
  metadata?: CanonicalQueueMetadata;
  payloadRef?: string;
  status: CanonicalQueueStatus;
  registeredAt: string;
  updatedAt: string;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  persistenceImplemented: false;
  realQueueBackend: false;
};

/**
 * Lote canônico estrutural de mensagens.
 */
export type CanonicalQueueBatch = {
  kind: "canonical-queue-batch";
  batchId: string;
  queueId: string;
  messageIds: readonly string[];
  messageCount: number;
  metadata?: CanonicalQueueMetadata;
  createdAt: string;
  realQueueBackend: false;
  processingPerformed: false;
};

/**
 * Resultado canônico de operação de Queue Runtime (INF-05).
 * Contém apenas referência/estrutura canônica — nunca mensageria real.
 */
export type CanonicalQueueResult = {
  kind: "canonical-queue-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalQueueOperation;
  queue?: CanonicalQueue;
  message?: CanonicalQueueMessage;
  batch?: CanonicalQueueBatch;
  messages?: readonly CanonicalQueueMessage[];
  identity?: CanonicalQueueIdentity;
  metadata?: CanonicalQueueMetadata;
  provider?: CanonicalQueueProvider;
  /** Sempre false — nenhum backend real. */
  realQueueBackend: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  persistenceImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem fila real). */
  runtimeReady: true;
  status: CanonicalQueueStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Queue Runtime (in-process).
 */
export type CanonicalQueueStatistics = {
  kind: "canonical-queue-statistics";
  totalQueues: number;
  totalMessages: number;
  enqueuedMessages: number;
  dequeuedMessages: number;
  ackedMessages: number;
  nackedMessages: number;
  purgedMessages: number;
  realQueueBackendCount: 0;
  messagesPublishedCount: 0;
  messagesConsumedCount: 0;
  workersInvokedCount: 0;
  processingPerformedCount: 0;
  persistenceImplementedCount: 0;
};

/**
 * Saúde canônica do provedor Queue Runtime.
 */
export type CanonicalQueueHealth = {
  kind: "canonical-queue-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedQueueCount?: number;
  storedMessageCount?: number;
  runtimeReady: true;
  realQueueBackend: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  persistenceImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Queue Runtime.
 */
export type CanonicalQueueCapabilities = {
  kind: "canonical-queue-capabilities";
  supportsEnqueue: boolean;
  supportsDequeue: boolean;
  supportsPeek: boolean;
  supportsAck: boolean;
  supportsNack: boolean;
  supportsPurge: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalQueue: boolean;
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
