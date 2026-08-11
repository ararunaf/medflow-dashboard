/**
 * Modelos canônicos do Enterprise Queue Runtime — INF-05 / OPER-INF-Q.
 *
 * Contrato canônico estável do QueueRuntimePort.
 * Backend persistente ativado via adapter (Supabase) — sem novos Ports.
 * Sem RabbitMQ. Sem Azure Service Bus. Sem Kafka. Sem Redis.
 * Sem workers. Sem scheduler. Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture.
 */

/** Status estrutural de mensagem / operação de Queue Runtime. */
export type CanonicalQueueStatus =
  | "pending"
  | "enqueued"
  | "dequeued"
  | "acked"
  | "nacked"
  | "purged"
  | "dead-lettered"
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
 * Fila canônica.
 * Representa a infraestrutura de fila — workers continuam fora deste Port.
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
  /** OPER-INF-Q — true quando backend persistente está ativo. */
  realQueueBackend: boolean;
  messagesPublished: boolean;
  messagesConsumed: boolean;
  workersInvoked: boolean;
  processingPerformed: boolean;
  persistenceImplemented: boolean;
};

/**
 * Mensagem canônica.
 * Persistida pelo backend operacional — sem invocação de workers neste Port.
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
  messagesPublished: boolean;
  messagesConsumed: boolean;
  workersInvoked: boolean;
  processingPerformed: boolean;
  persistenceImplemented: boolean;
  realQueueBackend: boolean;
};

/**
 * Lote canônico de mensagens.
 */
export type CanonicalQueueBatch = {
  kind: "canonical-queue-batch";
  batchId: string;
  queueId: string;
  messageIds: readonly string[];
  messageCount: number;
  metadata?: CanonicalQueueMetadata;
  createdAt: string;
  realQueueBackend: boolean;
  processingPerformed: boolean;
};

/**
 * Resultado canônico de operação de Queue Runtime (INF-05 / OPER-INF-Q).
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
  realQueueBackend: boolean;
  messagesPublished: boolean;
  messagesConsumed: boolean;
  workersInvoked: boolean;
  processingPerformed: boolean;
  persistenceImplemented: boolean;
  runtimeReady: true;
  status: CanonicalQueueStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas do Queue Runtime.
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
  realQueueBackendCount: number;
  messagesPublishedCount: number;
  messagesConsumedCount: number;
  workersInvokedCount: number;
  processingPerformedCount: number;
  persistenceImplementedCount: number;
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
  realQueueBackend: boolean;
  messagesPublished: boolean;
  messagesConsumed: boolean;
  workersInvoked: boolean;
  processingPerformed: boolean;
  persistenceImplemented: boolean;
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
  realQueueBackend: boolean;
  messagesPublished: boolean;
  messagesConsumed: boolean;
  workersInvoked: boolean;
  processingPerformed: boolean;
  persistenceImplemented: boolean;
  implementsRabbitMq: false;
  implementsKafka: false;
  implementsAzureServiceBus: false;
  implementsAzureQueue: false;
  implementsRedis: false;
  implementsBullMq: false;
  implementsWorkers: false;
  implementsScheduler: false;
  /** OPER-INF-D — true quando Dead Letter operacional está ativo. */
  implementsDeadLetter: boolean;
  /** OPER-INF-R — true quando Retry operacional está ativo. */
  implementsRetryReal: boolean;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
