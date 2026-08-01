/**
 * MockExecutionEventBusAdapter — EPC-24 Sprint 05.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas. Sem Pub/Sub.
 */
import {
  createEnvelopeId,
  createEventBusId,
  createEventHistoryId,
  createEventId,
  createPublisherId,
  createRegistrationId,
  createSubscriberId,
} from "../ports/identity";
import type { ExecutionEventBusPort } from "../ports/execution-event-bus-port";
import type {
  CreateEventBusInput,
  CreateEventBusResult,
  ExecutionEventBusHealth,
  ExecutionEventBusPortCapabilities,
  ExecutionEventBusProviderId,
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
} from "../ports/types";
import { DefaultExecutionEventBusStore, type ExecutionEventBusStore } from "../store";
import {
  applyStructuralPublish,
  applyStructuralRegister,
  applyStructuralUnregister,
  buildEventBus,
  foundationCapabilitiesBase,
  persistBus,
} from "./event-bus-helpers";

export const MOCK_EXECUTION_EVENT_BUS_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_EVENT_BUS_VERSION = "1.0.0";

export type MockExecutionEventBusAdapterOptions = {
  provider?: Extract<ExecutionEventBusProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionEventBusStore;
  createEventBusId?: () => string;
  createEventId?: () => string;
  createEnvelopeId?: () => string;
  createHistoryId?: () => string;
  createPublisherId?: () => string;
  createSubscriberId?: () => string;
  createRegistrationId?: () => string;
  now?: () => string;
};

export class MockExecutionEventBusAdapter implements ExecutionEventBusPort {
  readonly providerId: Extract<ExecutionEventBusProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionEventBusStore;
  private readonly createEventBusIdFn: () => string;
  private readonly createEventIdFn: () => string;
  private readonly createEnvelopeIdFn: () => string;
  private readonly createHistoryIdFn: () => string;
  private readonly createPublisherIdFn: () => string;
  private readonly createSubscriberIdFn: () => string;
  private readonly createRegistrationIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionEventBusAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-event-bus ready.`;
    this.store = options.store ?? new DefaultExecutionEventBusStore();
    this.createEventBusIdFn = options.createEventBusId ?? createEventBusId;
    this.createEventIdFn = options.createEventId ?? createEventId;
    this.createEnvelopeIdFn = options.createEnvelopeId ?? createEnvelopeId;
    this.createHistoryIdFn = options.createHistoryId ?? createEventHistoryId;
    this.createPublisherIdFn = options.createPublisherId ?? createPublisherId;
    this.createSubscriberIdFn = options.createSubscriberId ?? createSubscriberId;
    this.createRegistrationIdFn = options.createRegistrationId ?? createRegistrationId;
    this.now = options.now;
  }

  getStore(): ExecutionEventBusStore {
    return this.store;
  }

  capabilities(): ExecutionEventBusPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionEventBusHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedBusCount: this.store.busCount(),
      storedEventCount: this.store.eventCount(),
      storedRegistrationCount: this.store.registrationCount(),
      storedHistoryCount: this.store.historyCount(),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private unhealthyResult<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async createEventBus(input: CreateEventBusInput): Promise<CreateEventBusResult> {
    if (!this.healthy) return this.unhealthyResult<CreateEventBusResult>();

    if (!input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionId required",
      };
    }

    const existingByExecution = this.store.getBusByExecution(input.executionId);
    if (existingByExecution) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution event bus already exists for executionId",
      };
    }

    const stamp = this.stamp();
    const eventBusId = input.eventBusId ?? this.createEventBusIdFn();

    if (this.store.getBus(eventBusId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution event bus already exists",
      };
    }

    const bus = buildEventBus(input, eventBusId, stamp, {
      createPublisherId: this.createPublisherIdFn,
      createHistoryId: this.createHistoryIdFn,
    });

    persistBus(this.store, bus);

    return {
      ok: true,
      bus,
      code: "created",
      message: "execution event bus created structurally — no events delivered",
    };
  }

  async publish(input: PublishEventInput): Promise<PublishEventResult> {
    if (!this.healthy) {
      return {
        kind: "execution-event-result",
        ok: false,
        eventBusId: input.eventBusId ?? "",
        executionId: "",
        code: "unhealthy",
        message: this.message,
        delivered: false,
        callbacksExecuted: false,
      };
    }

    if (!input.eventBusId) {
      return {
        kind: "execution-event-result",
        ok: false,
        eventBusId: "",
        executionId: "",
        code: "invalid_input",
        message: "eventBusId required",
        delivered: false,
        callbacksExecuted: false,
      };
    }

    const stored = this.store.getBus(input.eventBusId);
    if (!stored) {
      return {
        kind: "execution-event-result",
        ok: false,
        eventBusId: input.eventBusId,
        executionId: "",
        code: "not_found",
        message: "execution event bus not found",
        delivered: false,
        callbacksExecuted: false,
      };
    }

    const stamp = this.stamp();
    const applied = applyStructuralPublish(stored.bus, input, stamp, {
      createEventId: this.createEventIdFn,
      createEnvelopeId: this.createEnvelopeIdFn,
    });

    persistBus(this.store, applied.bus);

    return {
      kind: "execution-event-result",
      ok: true,
      eventBusId: applied.bus.eventBusId,
      executionId: applied.bus.executionId,
      event: applied.event,
      envelope: applied.envelope,
      bus: applied.bus,
      code: "published_structurally",
      message: "event stored structurally — not delivered, no callbacks executed",
      delivered: false,
      callbacksExecuted: false,
    };
  }

  async register(input: RegisterSubscriberInput): Promise<RegisterSubscriberResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterSubscriberResult>({ callbacksExecuted: false });
    }

    if (!input.eventBusId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "eventBusId required",
        callbacksExecuted: false,
      };
    }

    if (!input.name) {
      return {
        ok: false,
        code: "invalid_input",
        message: "subscriber name required",
        callbacksExecuted: false,
      };
    }

    const stored = this.store.getBus(input.eventBusId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution event bus not found",
        callbacksExecuted: false,
      };
    }

    const stamp = this.stamp();
    const applied = applyStructuralRegister(stored.bus, input, stamp, {
      createSubscriberId: this.createSubscriberIdFn,
      createRegistrationId: this.createRegistrationIdFn,
    });

    persistBus(this.store, applied.bus);

    return {
      ok: true,
      registration: applied.registration,
      bus: applied.bus,
      code: "registered",
      message: "subscriber registered structurally — no callback executed",
      callbacksExecuted: false,
    };
  }

  async unregister(input: UnregisterSubscriberInput): Promise<UnregisterSubscriberResult> {
    if (!this.healthy) {
      return this.unhealthyResult<UnregisterSubscriberResult>({ callbacksExecuted: false });
    }

    if (!input.eventBusId || !input.registrationId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "eventBusId and registrationId required",
        callbacksExecuted: false,
      };
    }

    const stored = this.store.getBus(input.eventBusId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution event bus not found",
        callbacksExecuted: false,
      };
    }

    const stamp = this.stamp();
    const applied = applyStructuralUnregister(stored.bus, input.registrationId, stamp);
    if (!applied.ok) {
      return {
        ok: false,
        code: applied.code,
        message: applied.message,
        callbacksExecuted: false,
      };
    }

    persistBus(this.store, applied.bus);

    return {
      ok: true,
      registration: applied.registration,
      bus: applied.bus,
      code: "unregistered",
      message: "subscriber unregistered structurally — no callback side effects",
      callbacksExecuted: false,
    };
  }

  async listSubscribers(input: ListSubscribersInput): Promise<ListSubscribersResult> {
    if (!this.healthy) return this.unhealthyResult<ListSubscribersResult>();

    if (!input.eventBusId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "eventBusId required",
      };
    }

    const stored = this.store.getBus(input.eventBusId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution event bus not found",
      };
    }

    const registrations =
      input.activeOnly === true
        ? stored.bus.registrations.filter((r) => r.active)
        : stored.bus.registrations;

    return {
      ok: true,
      registrations,
      subscribers: registrations.map((r) => r.subscriber),
      total: registrations.length,
      code: "listed",
      message: "structural subscriber registrations listed",
    };
  }

  async listEvents(input: ListEventsInput): Promise<ListEventsResult> {
    if (!this.healthy) return this.unhealthyResult<ListEventsResult>();

    if (!input.eventBusId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "eventBusId required",
      };
    }

    const stored = this.store.getBus(input.eventBusId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution event bus not found",
      };
    }

    let envelopes = [...stored.bus.history.envelopes];
    if (input.type) {
      envelopes = envelopes.filter((e) => e.event.type === input.type);
    }
    if (typeof input.limit === "number" && input.limit >= 0) {
      envelopes = envelopes.slice(0, input.limit);
    }

    return {
      ok: true,
      history: stored.bus.history,
      envelopes,
      events: envelopes.map((e) => e.event),
      total: envelopes.length,
      code: "listed",
      message: "structural events listed — none delivered",
    };
  }
}
