/**
 * Helpers internos do Execution Event Bus (EPC-24 Sprint 05).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem entrega de eventos. Sem execução de callbacks. Sem filas. Sem Engines.
 */
import {
  createEnvelopeId,
  createEventHistoryId,
  createEventId,
  createPublisherId,
  createRegistrationId,
  createSubscriberId,
} from "../ports/identity";
import {
  STRUCTURAL_EVENT_BUS_CAPABILITY,
  type ExecutionEvent,
  type ExecutionEventBus,
  type ExecutionEventEnvelope,
  type ExecutionEventHistory,
  type ExecutionEventMetadata,
  type ExecutionEventPublisher,
  type ExecutionEventRegistration,
  type ExecutionEventSubscriber,
} from "../ports/models";
import type {
  CreateEventBusInput,
  ExecutionEventBusPortCapabilities,
  PublishEventInput,
  RegisterSubscriberInput,
} from "../ports/types";
import type { ExecutionEventBusStore } from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionEventBusPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsCreateEventBus: true,
    supportsPublish: true,
    supportsRegister: true,
    supportsUnregister: true,
    supportsListSubscribers: true,
    supportsListEvents: true,
    supportsHealth: true,
    supportsCapabilities: true,
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
}

export function buildEventBus(
  input: CreateEventBusInput,
  eventBusId: string,
  stamp: string,
  factories?: {
    createPublisherId?: () => string;
    createHistoryId?: () => string;
  },
): ExecutionEventBus {
  const publisherId = factories?.createPublisherId ?? createPublisherId;
  const histId = factories?.createHistoryId ?? createEventHistoryId;

  const publisher: ExecutionEventPublisher = {
    kind: "execution-event-publisher",
    id: input.publisher?.id ?? publisherId(),
    name: input.publisher?.name ?? "structural-execution-publisher",
    source: input.publisher?.source ?? "execution-event-bus",
    notes: input.publisher?.notes ?? "Structural publisher descriptor — no real delivery performed",
  };

  const metadata: ExecutionEventMetadata = {
    kind: "execution-event-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  const history: ExecutionEventHistory = {
    kind: "execution-event-history",
    id: histId(),
    eventBusId,
    executionId: input.executionId,
    envelopes: [],
    entryCount: 0,
    createdAt: stamp,
    updatedAt: stamp,
  };

  return {
    kind: "execution-event-bus",
    id: eventBusId,
    eventBusId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    publisher,
    registrations: [],
    history,
    metadata,
    capability: STRUCTURAL_EVENT_BUS_CAPABILITY,
    eventsDelivered: false,
    subscribersExecuted: false,
    callbacksExecuted: false,
    queuesImplemented: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
  };
}

export function applyStructuralPublish(
  bus: ExecutionEventBus,
  input: PublishEventInput,
  stamp: string,
  factories?: {
    createEventId?: () => string;
    createEnvelopeId?: () => string;
  },
): { bus: ExecutionEventBus; event: ExecutionEvent; envelope: ExecutionEventEnvelope } {
  const eventId = factories?.createEventId ?? createEventId;
  const envelopeId = factories?.createEnvelopeId ?? createEnvelopeId;

  const event: ExecutionEvent = {
    kind: "execution-event",
    id: eventId(),
    eventBusId: bus.eventBusId,
    executionId: bus.executionId,
    type: input.type,
    occurredAt: stamp,
    publisher: bus.publisher,
    context: {
      kind: "execution-event-context",
      executionId: bus.executionId,
      correlationId: bus.correlationId,
      stateMachineId: input.context?.stateMachineId,
      contextId: input.context?.contextId ?? bus.executionId,
      stageName: input.context?.stageName,
      attributes: input.context?.attributes,
    },
    metadata: {
      kind: "execution-event-metadata",
      tags: input.tags,
      version: bus.metadata.version,
      createdAt: stamp,
      updatedAt: stamp,
      structuralNotes: input.notes,
      customAttributes: input.customAttributes,
    },
    opaquePayload: input.opaquePayload,
    notes:
      input.notes ?? `Structural event ${input.type} stored — not delivered, no callbacks executed`,
    delivered: false,
    subscribersNotified: false,
    callbacksExecuted: false,
    enginesInvoked: false,
  };

  const envelope: ExecutionEventEnvelope = {
    kind: "execution-event-envelope",
    id: envelopeId(),
    eventBusId: bus.eventBusId,
    executionId: bus.executionId,
    event,
    enqueuedAt: stamp,
    delivered: false,
    deliveryAttempted: false,
    subscribersMatched: 0,
    callbacksExecuted: false,
    notes: "Structural envelope stored in-memory — no queue, no delivery",
  };

  const envelopes = [...bus.history.envelopes, envelope];
  const history: ExecutionEventHistory = {
    ...bus.history,
    envelopes,
    entryCount: envelopes.length,
    updatedAt: stamp,
  };

  const metadata: ExecutionEventMetadata = {
    ...bus.metadata,
    updatedAt: stamp,
  };

  return {
    event,
    envelope,
    bus: {
      ...bus,
      history,
      metadata,
      eventsDelivered: false,
      subscribersExecuted: false,
      callbacksExecuted: false,
      queuesImplemented: false,
      enginesInvoked: false,
      stagesExecuted: false,
      processingPerformed: false,
    },
  };
}

export function applyStructuralRegister(
  bus: ExecutionEventBus,
  input: RegisterSubscriberInput,
  stamp: string,
  factories?: {
    createSubscriberId?: () => string;
    createRegistrationId?: () => string;
  },
): { bus: ExecutionEventBus; registration: ExecutionEventRegistration } {
  const subscriberId = factories?.createSubscriberId ?? createSubscriberId;
  const registrationId = factories?.createRegistrationId ?? createRegistrationId;

  const subscriber: ExecutionEventSubscriber = {
    kind: "execution-event-subscriber",
    id: input.subscriberId ?? subscriberId(),
    name: input.name,
    eventTypeFilter: input.eventTypeFilter ?? "*",
    source: input.source ?? "structural-registration",
    notes: input.notes ?? "Structural subscriber descriptor — hasCallback:false, never executed",
    hasCallback: false,
    callbacksExecuted: false,
  };

  const registration: ExecutionEventRegistration = {
    kind: "execution-event-registration",
    id: registrationId(),
    eventBusId: bus.eventBusId,
    executionId: bus.executionId,
    subscriber,
    registeredAt: stamp,
    active: true,
    notes: "Structural registration stored — no delivery wiring",
  };

  const registrations = [...bus.registrations, registration];
  const metadata: ExecutionEventMetadata = {
    ...bus.metadata,
    updatedAt: stamp,
  };

  return {
    registration,
    bus: {
      ...bus,
      registrations,
      metadata,
      eventsDelivered: false,
      subscribersExecuted: false,
      callbacksExecuted: false,
      queuesImplemented: false,
      enginesInvoked: false,
      stagesExecuted: false,
      processingPerformed: false,
    },
  };
}

export function applyStructuralUnregister(
  bus: ExecutionEventBus,
  registrationId: string,
  stamp: string,
):
  | { ok: true; bus: ExecutionEventBus; registration: ExecutionEventRegistration }
  | { ok: false; code: string; message: string } {
  const existing = bus.registrations.find((r) => r.id === registrationId);
  if (!existing) {
    return {
      ok: false,
      code: "not_found",
      message: "registration not found",
    };
  }

  if (!existing.active) {
    return {
      ok: false,
      code: "already_unregistered",
      message: "registration already inactive",
    };
  }

  const registration: ExecutionEventRegistration = {
    ...existing,
    active: false,
    unregisteredAt: stamp,
    notes: "Structurally unregistered — no callback side effects",
  };

  const registrations = bus.registrations.map((r) => (r.id === registrationId ? registration : r));

  const metadata: ExecutionEventMetadata = {
    ...bus.metadata,
    updatedAt: stamp,
  };

  return {
    ok: true,
    registration,
    bus: {
      ...bus,
      registrations,
      metadata,
      eventsDelivered: false,
      subscribersExecuted: false,
      callbacksExecuted: false,
      queuesImplemented: false,
      enginesInvoked: false,
      stagesExecuted: false,
      processingPerformed: false,
    },
  };
}

export function persistBus(store: ExecutionEventBusStore, bus: ExecutionEventBus): void {
  store.setBus({ bus });
}
