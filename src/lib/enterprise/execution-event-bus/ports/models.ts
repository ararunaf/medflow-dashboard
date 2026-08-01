/**
 * Modelos canônicos do Execution Event Bus — EPC-24 Sprint 05.
 *
 * Representação estrutural do fluxo de eventos de uma execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem filas. Sem Pub/Sub. Sem EventEmitter. Sem Workers.
 * Sem entrega real de eventos. Sem execução de subscribers.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Tipos estruturais de eventos da execução.
 * Apenas enumeração — nenhuma ação associada.
 */
export type ExecutionEventType =
  | "execution.created"
  | "execution.context-attached"
  | "execution.state-changed"
  | "execution.pipeline-resolved"
  | "execution.pipeline-attached"
  | "execution.event-bus-attached"
  | "execution.structural-walk"
  | "execution.completed"
  | "execution.cancelled"
  | "execution.failed"
  | "execution.custom";

/** Kinds de registros canônicos do Event Bus. */
export type ExecutionEventRecordKind =
  | "execution-event"
  | "execution-event-envelope"
  | "execution-event-metadata"
  | "execution-event-type"
  | "execution-event-context"
  | "execution-event-publisher"
  | "execution-event-subscriber"
  | "execution-event-registration"
  | "execution-event-history"
  | "execution-event-capabilities"
  | "execution-event-result"
  | "execution-event-bus";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais do Event Bus / evento.
 * Sem interpretação de negócio.
 */
export type ExecutionEventMetadata = {
  kind: "execution-event-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventContext
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Contexto estrutural opaco associado a um evento.
 * Referências apenas — sem conteúdo de negócio.
 */
export type ExecutionEventContext = {
  kind: "execution-event-context";
  executionId: string;
  correlationId?: string;
  stateMachineId?: string;
  contextId?: string;
  stageName?: string;
  attributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventPublisher
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Descritor estrutural de publicador.
 * NÃO é um publicador real. Nenhuma entrega ocorre.
 */
export type ExecutionEventPublisher = {
  kind: "execution-event-publisher";
  id: string;
  name: string;
  source?: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventSubscriber
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Descritor estrutural de subscriber.
 * NÃO contém callback. NÃO é executado.
 */
export type ExecutionEventSubscriber = {
  kind: "execution-event-subscriber";
  id: string;
  name: string;
  /** Filtro estrutural de tipo de evento (opaco). */
  eventTypeFilter?: ExecutionEventType | "*";
  source?: string;
  notes?: string;
  /** Explicitamente sem callback executável. */
  hasCallback: false;
  callbacksExecuted: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventRegistration
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Registro estrutural de subscriber no bus.
 * Apenas armazenamento — nenhuma entrega.
 */
export type ExecutionEventRegistration = {
  kind: "execution-event-registration";
  id: string;
  eventBusId: string;
  executionId: string;
  subscriber: ExecutionEventSubscriber;
  registeredAt: string;
  active: boolean;
  unregisteredAt?: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEvent
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Evento estrutural da execução.
 * Sem payload de negócio interpretado. Sem entrega.
 */
export type ExecutionEvent = {
  kind: "execution-event";
  id: string;
  eventBusId: string;
  executionId: string;
  type: ExecutionEventType;
  occurredAt: string;
  publisher?: ExecutionEventPublisher;
  context?: ExecutionEventContext;
  metadata: ExecutionEventMetadata;
  /** Payload opaco — nunca interpretado. */
  opaquePayload?: Readonly<Record<string, unknown>>;
  notes?: string;
  delivered: false;
  subscribersNotified: false;
  callbacksExecuted: false;
  enginesInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventEnvelope
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Envelope estrutural que envolve um evento no bus.
 * Representa o armazenamento — não a entrega.
 */
export type ExecutionEventEnvelope = {
  kind: "execution-event-envelope";
  id: string;
  eventBusId: string;
  executionId: string;
  event: ExecutionEvent;
  enqueuedAt: string;
  /** Sempre false nesta sprint — nenhuma entrega. */
  delivered: false;
  deliveryAttempted: false;
  subscribersMatched: 0;
  callbacksExecuted: false;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventHistory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Histórico estrutural de envelopes publicados (armazenados) no bus.
 */
export type ExecutionEventHistory = {
  kind: "execution-event-history";
  id: string;
  eventBusId: string;
  executionId: string;
  envelopes: readonly ExecutionEventEnvelope[];
  entryCount: number;
  createdAt: string;
  updatedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Event Bus.
 * Explicitamente sem filas / PubSub / Workers / Engines.
 */
export type ExecutionEventCapabilities = {
  kind: "execution-event-capabilities";
  structuralEventBusOnly: true;
  eventsDelivered: false;
  subscribersExecuted: false;
  callbacksExecuted: false;
  queuesImplemented: false;
  pubSubImplemented: false;
  eventEmitterUsed: false;
  workersUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsTissRules: false;
  implementsMapping: false;
  implementsValidation: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventBus (agregado)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado canônico do barramento de eventos de uma execução.
 * Representa estruturalmente o fluxo de eventos — sem entrega.
 */
export type ExecutionEventBus = {
  kind: "execution-event-bus";
  id: string;
  /** Alias (= id do bus). */
  eventBusId: string;
  executionId: string;
  correlationId?: string;
  publisher: ExecutionEventPublisher;
  registrations: readonly ExecutionEventRegistration[];
  history: ExecutionEventHistory;
  metadata: ExecutionEventMetadata;
  capability: ExecutionEventCapabilities;
  eventsDelivered: false;
  subscribersExecuted: false;
  callbacksExecuted: false;
  queuesImplemented: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionEventResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Event Bus.
 * Sem efeitos colaterais de entrega / negócio.
 */
export type ExecutionEventResult = {
  kind: "execution-event-result";
  ok: boolean;
  eventBusId: string;
  executionId: string;
  event?: ExecutionEvent;
  envelope?: ExecutionEventEnvelope;
  registration?: ExecutionEventRegistration;
  bus?: ExecutionEventBus;
  code?: string;
  message?: string;
  delivered: false;
  callbacksExecuted: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Catálogo canônico dos tipos estruturais de eventos. */
export const EXECUTION_EVENT_TYPES: readonly ExecutionEventType[] = [
  "execution.created",
  "execution.context-attached",
  "execution.state-changed",
  "execution.pipeline-resolved",
  "execution.pipeline-attached",
  "execution.event-bus-attached",
  "execution.structural-walk",
  "execution.completed",
  "execution.cancelled",
  "execution.failed",
  "execution.custom",
] as const;

/** Capacidades canônicas embutidas em todo Event Bus. */
export const STRUCTURAL_EVENT_BUS_CAPABILITY: ExecutionEventCapabilities = {
  kind: "execution-event-capabilities",
  structuralEventBusOnly: true,
  eventsDelivered: false,
  subscribersExecuted: false,
  callbacksExecuted: false,
  queuesImplemented: false,
  pubSubImplemented: false,
  eventEmitterUsed: false,
  workersUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  implementsOcr: false,
  implementsAi: false,
  implementsXmlParser: false,
  implementsTissRules: false,
  implementsMapping: false,
  implementsValidation: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpWorkersQueues: false,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
};

export function isKnownExecutionEventType(type: string): type is ExecutionEventType {
  return (EXECUTION_EVENT_TYPES as readonly string[]).includes(type);
}
