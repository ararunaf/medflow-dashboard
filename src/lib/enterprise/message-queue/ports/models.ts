/**
 * Modelos canônicos do Message Queue — INF-01 Message Queue Foundation.
 *
 * Representação estrutural da infraestrutura de filas Enterprise.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem workers. Sem consumidores reais.
 * Sem RabbitMQ / Redis / Azure Queue / SQS / Pub/Sub / Cloudflare Queues.
 * Sem Engines. Sem acesso externo. Sem processamento assíncrono.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Message Queue. */
export type CanonicalQueueRecordKind =
  | "canonical-queue"
  | "canonical-queue-message"
  | "canonical-queue-metadata"
  | "canonical-queue-reference"
  | "canonical-queue-configuration"
  | "canonical-queue-capabilities"
  | "canonical-queue-statistics"
  | "canonical-queue-health";

/** Status estrutural opaco de mensagem (sem processamento). */
export type CanonicalQueueMessageStatus =
  | "structural"
  | "enqueued-structural"
  | "dequeued-structural"
  | "acknowledged-structural"
  | "rejected-structural"
  | "retry-structural"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalQueueMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de uma fila / mensagem.
 * Sem validação de negócio.
 */
export type CanonicalQueueMetadata = {
  kind: "canonical-queue-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalQueueReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a uma fila / mensagem.
 * Sem conteúdo de negócio.
 */
export type CanonicalQueueReference = {
  kind: "canonical-queue-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalQueueConfiguration
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Configuração estrutural da fila.
 * Declara o contrato opaco — sem execução, sem backend real.
 */
export type CanonicalQueueConfiguration = {
  kind: "canonical-queue-configuration";
  key: string;
  name: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  notes?: string;
  /** Backend real NÃO está conectado nesta sprint. */
  backendConnected: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalQueueCapabilities
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Message Queue.
 * Explicitamente sem mensageria real / workers / Engines.
 */
export type CanonicalQueueCapabilities = {
  kind: "canonical-queue-capabilities";
  structuralMessageQueueOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  realQueueBackend: false;
  implementsOcr: false;
  implementsAi: false;
  implementsTiss: false;
  implementsXmlParser: false;
  implementsRabbitMq: false;
  implementsRedis: false;
  implementsAzureQueue: false;
  implementsAwsSqs: false;
  implementsGooglePubSub: false;
  implementsCloudflareQueues: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalQueueMessage
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Mensagem canônica estrutural.
 * Pode existir no store in-memory — NÃO é processada / entregue / consumida.
 */
export type CanonicalQueueMessage = {
  kind: "canonical-queue-message";
  id: string;
  messageId: string;
  executionMessageQueueId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  payloadRef?: string;
  status: CanonicalQueueMessageStatus;
  references: readonly CanonicalQueueReference[];
  metadata: CanonicalQueueMetadata;
  registeredAt: string;
  updatedAt: string;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalQueue
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Fila canônica estrutural.
 * Representa a infraestrutura de fila — sem backend real, sem workers.
 */
export type CanonicalQueue = {
  kind: "canonical-queue";
  id: string;
  /** Alias (= id da fila). Anexado ao Execution Context. */
  executionMessageQueueId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  executionCapabilityRegistryId?: string;
  executionDependencyRegistryId?: string;
  executionPolicyRegistryId?: string;
  executionConstraintRegistryId?: string;
  executionRequirementRegistryId?: string;
  executionResourceRegistryId?: string;
  executionEnvironmentRegistryId?: string;
  pipelineId?: string;
  configuration: CanonicalQueueConfiguration;
  messageIds: readonly string[];
  messageCount: number;
  references: readonly CanonicalQueueReference[];
  metadata: CanonicalQueueMetadata;
  capability: CanonicalQueueCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  realQueueBackend: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalQueueStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do store in-memory.
 * Sem métricas de negócio / sem analytics / sem throughput real.
 */
export type CanonicalQueueStatistics = {
  kind: "canonical-queue-statistics";
  totalQueues: number;
  totalMessages: number;
  totalReferences: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  realQueueBackend: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalQueueHealth
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Message Queue (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type CanonicalQueueHealth = {
  kind: "canonical-queue-health";
  ok: boolean;
  message?: string;
  queueCount: number;
  messageCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  realQueueBackend: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Message Queue. */
export const STRUCTURAL_MESSAGE_QUEUE_CAPABILITY: CanonicalQueueCapabilities = {
  kind: "canonical-queue-capabilities",
  structuralMessageQueueOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  messagesPublished: false,
  messagesConsumed: false,
  workersInvoked: false,
  realQueueBackend: false,
  implementsOcr: false,
  implementsAi: false,
  implementsTiss: false,
  implementsXmlParser: false,
  implementsRabbitMq: false,
  implementsRedis: false,
  implementsAzureQueue: false,
  implementsAwsSqs: false,
  implementsGooglePubSub: false,
  implementsCloudflareQueues: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpWorkersQueues: false,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
};
