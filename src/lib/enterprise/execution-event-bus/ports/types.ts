/**
 * Tipos vendor-agnósticos do Execution Event Bus — EPC-24 Sprint 05.
 *
 * Representa estruturalmente o fluxo de eventos de uma execução.
 * NÃO entrega eventos. NÃO executa subscribers. NÃO cria filas.
 * NÃO usa Pub/Sub, EventEmitter, Workers ou Engines.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionEventBusPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionEvent,
  ExecutionEventBus,
  ExecutionEventEnvelope,
  ExecutionEventHistory,
  ExecutionEventPublisher,
  ExecutionEventRegistration,
  ExecutionEventResult,
  ExecutionEventSubscriber,
  ExecutionEventType,
} from "./models";

export type {
  ExecutionEvent,
  ExecutionEventBus,
  ExecutionEventCapabilities,
  ExecutionEventContext,
  ExecutionEventEnvelope,
  ExecutionEventHistory,
  ExecutionEventMetadata,
  ExecutionEventPublisher,
  ExecutionEventRecordKind,
  ExecutionEventRegistration,
  ExecutionEventResult,
  ExecutionEventSubscriber,
  ExecutionEventType,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Event Bus (extensível). */
export type ExecutionEventBusProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — createEventBus
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de criação do Event Bus. */
export type CreateEventBusInput = {
  eventBusId?: string;
  executionId: string;
  correlationId?: string;
  publisher?: Partial<Omit<ExecutionEventPublisher, "kind" | "id">> & { id?: string };
  tags?: readonly string[];
  version?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Resultado estrutural de createEventBus. */
export type CreateEventBusResult = {
  ok: boolean;
  bus?: ExecutionEventBus;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — publish (estrutural — sem entrega)
 * ───────────────────────────────────────────────────────────────────────── */

/** Pedido estrutural de publicação (armazenamento apenas). */
export type PublishEventInput = {
  eventBusId: string;
  type: ExecutionEventType;
  notes?: string;
  opaquePayload?: Readonly<Record<string, unknown>>;
  context?: {
    stateMachineId?: string;
    contextId?: string;
    stageName?: string;
    attributes?: Readonly<Record<string, string | number | boolean | null>>;
  };
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Resultado estrutural de publish — sempre sem entrega. */
export type PublishEventResult = ExecutionEventResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — register / unregister (estrutural — sem callbacks)
 * ───────────────────────────────────────────────────────────────────────── */

/** Pedido estrutural de registro de subscriber (sem callback). */
export type RegisterSubscriberInput = {
  eventBusId: string;
  subscriberId?: string;
  name: string;
  eventTypeFilter?: ExecutionEventType | "*";
  source?: string;
  notes?: string;
};

export type RegisterSubscriberResult = {
  ok: boolean;
  registration?: ExecutionEventRegistration;
  bus?: ExecutionEventBus;
  message?: string;
  code?: string;
  callbacksExecuted: false;
};

export type UnregisterSubscriberInput = {
  eventBusId: string;
  registrationId: string;
};

export type UnregisterSubscriberResult = {
  ok: boolean;
  registration?: ExecutionEventRegistration;
  bus?: ExecutionEventBus;
  message?: string;
  code?: string;
  callbacksExecuted: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listSubscribers / listEvents
 * ───────────────────────────────────────────────────────────────────────── */

export type ListSubscribersInput = {
  eventBusId: string;
  activeOnly?: boolean;
};

export type ListSubscribersResult = {
  ok: boolean;
  registrations?: readonly ExecutionEventRegistration[];
  subscribers?: readonly ExecutionEventSubscriber[];
  total?: number;
  message?: string;
  code?: string;
};

export type ListEventsInput = {
  eventBusId: string;
  type?: ExecutionEventType;
  limit?: number;
};

export type ListEventsResult = {
  ok: boolean;
  history?: ExecutionEventHistory;
  envelopes?: readonly ExecutionEventEnvelope[];
  events?: readonly ExecutionEvent[];
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionEventBusHealth = {
  ok: boolean;
  provider: ExecutionEventBusProviderId;
  latencyMs?: number;
  message?: string;
  storedBusCount?: number;
  storedEventCount?: number;
  storedRegistrationCount?: number;
  storedHistoryCount?: number;
};

/**
 * Capacidades do ExecutionEventBusPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionEventBusPortCapabilities = {
  provider: ExecutionEventBusProviderId;
  adapterId: string;
  supportsCreateEventBus: true;
  supportsPublish: true;
  supportsRegister: true;
  supportsUnregister: true;
  supportsListSubscribers: true;
  supportsListEvents: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Barramento estrutural exclusivamente — sem entrega. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
};

/** Opções de resolução do ExecutionEventBusPort (provider factory). */
export type ExecutionEventBusProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionEventBusAdapter).
   */
  provider?: ExecutionEventBusProviderId;
};
