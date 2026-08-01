/**
 * Enterprise Execution Event Bus Foundation — Ports & Adapters (EPC-24 Sprint 05).
 *
 * Fluxo oficial:
 *   Application → ExecutionEventBusPort → ExecutionEventBusAdapter
 *     → ExecutionEventBusStore → ExecutionEventBusFactory
 *     → ExecutionEventBusProvider
 *
 * O Event Bus NÃO entrega eventos. NÃO executa subscribers.
 * NÃO cria filas. NÃO usa Pub/Sub, EventEmitter ou Workers.
 * Apenas representa estruturalmente o fluxo de eventos da execução.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution State Machine
 *     → Execution Event Bus
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 05: barramento estrutural apenas.
 * Nenhum evento é publicado de fato. Nenhuma Engine é invocada.
 */
export type {
  CreateEventBusInput,
  CreateEventBusResult,
  ExecutionEvent,
  ExecutionEventBus,
  ExecutionEventBusHealth,
  ExecutionEventBusPort,
  ExecutionEventBusPortCapabilities,
  ExecutionEventBusProviderId,
  ExecutionEventBusProviderOptions,
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
  ListEventsInput,
  ListEventsResult,
  ListSubscribersInput,
  ListSubscribersResult,
  PublishEventInput,
  PublishEventResult,
  RegisterSubscriberInput,
  RegisterSubscriberResult,
  UnregisterSubscriberInput,
  UnregisterSubscriberResult,
} from "./ports";

export {
  EXECUTION_EVENT_TYPES,
  STRUCTURAL_EVENT_BUS_CAPABILITY,
  createEnvelopeId,
  createEventBusId,
  createEventHistoryId,
  createEventId,
  createPublisherId,
  createRegistrationId,
  createSubscriberId,
  isKnownExecutionEventType,
  resetAllExecutionEventBusIdSequences,
  resetEnvelopeIdSequence,
  resetEventBusIdSequence,
  resetEventHistoryIdSequence,
  resetEventIdSequence,
  resetPublisherIdSequence,
  resetRegistrationIdSequence,
  resetSubscriberIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_EVENT_BUS_ADAPTER_ID,
  DEFAULT_EXECUTION_EVENT_BUS_VERSION,
  DefaultExecutionEventBusAdapter,
  MOCK_EXECUTION_EVENT_BUS_ADAPTER_ID,
  MOCK_EXECUTION_EVENT_BUS_VERSION,
  MockExecutionEventBusAdapter,
  type DefaultExecutionEventBusRuntime,
  type MockExecutionEventBusAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_EVENT_BUS_STORE_ID,
  DefaultExecutionEventBusStore,
  type DefaultExecutionEventBusStoreOptions,
  type ExecutionEventBusStore,
  type StoredExecutionEventBus,
} from "./store";

export {
  ExecutionEventBusFactory,
  createExecutionEventBusFactory,
  type ExecutionEventBusFactoryOptions,
} from "./factory";

export { createExecutionEventBusPort } from "./providers";

export { getExecutionEventBusHealthSummary, type ExecutionEventBusHealthSummary } from "./demo";
