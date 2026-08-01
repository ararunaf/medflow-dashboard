/**
 * Tipos vendor-agnósticos do Message Queue — INF-01 Message Queue Foundation.
 *
 * Representa estruturalmente a infraestrutura de filas Enterprise.
 * NÃO publica mensagens. NÃO consome mensagens. NÃO invoca workers.
 * NÃO integra RabbitMQ / Redis / Azure Queue / SQS / Pub/Sub / Cloudflare Queues.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionQueuePort → Adapter → Store → Factory → Provider
 */
import type {
  CanonicalQueue,
  CanonicalQueueHealth,
  CanonicalQueueMessage,
  CanonicalQueueStatistics,
} from "./models";

export type {
  CanonicalQueue,
  CanonicalQueueCapabilities,
  CanonicalQueueConfiguration,
  CanonicalQueueHealth,
  CanonicalQueueMessage,
  CanonicalQueueMessageStatus,
  CanonicalQueueMetadata,
  CanonicalQueueRecordKind,
  CanonicalQueueReference,
  CanonicalQueueStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Message Queue (extensível). */
export type MessageQueueProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getQueue (criação / obtenção estrutural)
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de obtenção / criação de fila. */
export type GetQueueInput = {
  executionMessageQueueId?: string;
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
  key?: string;
  name?: string;
  /** Se true (default), cria fila estrutural quando inexistente. */
  createIfMissing?: boolean;
  tags?: readonly string[];
  version?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  references?: readonly {
    name: string;
    value: string;
    notes?: string;
  }[];
};

export type GetQueueResult = {
  ok: boolean;
  queue?: CanonicalQueue;
  message?: string;
  code?: string;
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
 * Port I/O — enqueue / dequeue / peek / acknowledge / reject / retry
 * (estrutural apenas — sem publicação / consumo / processamento real)
 * ───────────────────────────────────────────────────────────────────────── */

export type EnqueueInput = {
  executionMessageQueueId: string;
  messageId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  payloadRef?: string;
  tags?: readonly string[];
  structuralNotes?: string;
  references?: readonly {
    name: string;
    value: string;
    notes?: string;
  }[];
};

export type EnqueueResult = {
  ok: boolean;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
  message?: string;
  code?: string;
  /** Sempre false — enqueue estrutural NÃO publica. */
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  realQueueBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

export type DequeueInput = {
  executionMessageQueueId: string;
  messageId?: string;
};

export type DequeueResult = {
  ok: boolean;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
  message?: string;
  code?: string;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  realQueueBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

export type PeekInput = {
  executionMessageQueueId: string;
  messageId?: string;
};

export type PeekResult = {
  ok: boolean;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
  message?: string;
  code?: string;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  realQueueBackend: false;
};

export type AcknowledgeInput = {
  executionMessageQueueId: string;
  messageId: string;
};

export type AcknowledgeResult = {
  ok: boolean;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
  message?: string;
  code?: string;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  realQueueBackend: false;
};

export type RejectInput = {
  executionMessageQueueId: string;
  messageId: string;
  reason?: string;
};

export type RejectResult = {
  ok: boolean;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
  message?: string;
  code?: string;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  realQueueBackend: false;
};

export type RetryInput = {
  executionMessageQueueId: string;
  messageId: string;
};

export type RetryResult = {
  ok: boolean;
  queue?: CanonicalQueue;
  queueMessage?: CanonicalQueueMessage;
  message?: string;
  code?: string;
  messagesPublished: false;
  messagesConsumed: false;
  workersInvoked: false;
  processingPerformed: false;
  realQueueBackend: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionQueuePortHealth = {
  ok: boolean;
  provider: MessageQueueProviderId;
  latencyMs?: number;
  message?: string;
  storedQueueCount?: number;
  storedMessageCount?: number;
  storedReferenceCount?: number;
  structuralHealth?: CanonicalQueueHealth;
};

/**
 * Capacidades do ExecutionQueuePort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionQueuePortCapabilities = {
  provider: MessageQueueProviderId;
  adapterId: string;
  supportsEnqueue: true;
  supportsDequeue: true;
  supportsPeek: true;
  supportsAcknowledge: true;
  supportsReject: true;
  supportsRetry: true;
  supportsGetQueue: true;
  supportsGetStatistics: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Message Queue estrutural exclusivamente — sem mensageria real. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping / TISS). */
  decoupledFromEngines: true;
};

export type GetStatisticsResult = {
  ok: boolean;
  statistics?: CanonicalQueueStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionQueuePort (provider factory). */
export type MessageQueueProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultMessageQueueAdapter).
   */
  provider?: MessageQueueProviderId;
};
