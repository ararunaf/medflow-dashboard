/**
 * DefaultExecutionEventBusAdapter — adapter default in-memory (EPC-24 Sprint 05).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas. Sem Pub/Sub.
 *
 * Representa estruturalmente o fluxo de eventos.
 * Nenhum evento é entregue. Nenhum subscriber é executado.
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

export const DEFAULT_EXECUTION_EVENT_BUS_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_EVENT_BUS_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionEventBusRuntime = {
  store?: ExecutionEventBusStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createEventBusId?: () => string;
  createEventId?: () => string;
  createEnvelopeId?: () => string;
  createHistoryId?: () => string;
  createPublisherId?: () => string;
  createSubscriberId?: () => string;
  createRegistrationId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionEventBusRuntime {
  return {
    store: new DefaultExecutionEventBusStore(),
  };
}

function nowIso(runtime: DefaultExecutionEventBusRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionEventBusAdapter implements ExecutionEventBusPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionEventBusRuntime;
  private readonly store: ExecutionEventBusStore;

  constructor(runtime: DefaultExecutionEventBusRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionEventBusStore();
  }

  getStore(): ExecutionEventBusStore {
    return this.store;
  }

  capabilities(): ExecutionEventBusPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_EVENT_BUS_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionEventBusHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default execution-event-bus probe ok."
            : "Default execution-event-bus probe falhou."),
        storedBusCount: this.store.busCount(),
        storedEventCount: this.store.eventCount(),
        storedRegistrationCount: this.store.registrationCount(),
        storedHistoryCount: this.store.historyCount(),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "DefaultExecutionEventBusStore pronto (sem I/O externo — EPC-24 Sprint 05).",
      storedBusCount: this.store.busCount(),
      storedEventCount: this.store.eventCount(),
      storedRegistrationCount: this.store.registrationCount(),
      storedHistoryCount: this.store.historyCount(),
    };
  }

  async createEventBus(input: CreateEventBusInput): Promise<CreateEventBusResult> {
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

    const stamp = nowIso(this.runtime);
    const eventBusId = input.eventBusId ?? this.runtime.createEventBusId?.() ?? createEventBusId();

    if (this.store.getBus(eventBusId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution event bus already exists",
      };
    }

    const bus = buildEventBus(input, eventBusId, stamp, {
      createPublisherId: this.runtime.createPublisherId ?? createPublisherId,
      createHistoryId: this.runtime.createHistoryId ?? createEventHistoryId,
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

    const stamp = nowIso(this.runtime);
    const applied = applyStructuralPublish(stored.bus, input, stamp, {
      createEventId: this.runtime.createEventId ?? createEventId,
      createEnvelopeId: this.runtime.createEnvelopeId ?? createEnvelopeId,
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

    const stamp = nowIso(this.runtime);
    const applied = applyStructuralRegister(stored.bus, input, stamp, {
      createSubscriberId: this.runtime.createSubscriberId ?? createSubscriberId,
      createRegistrationId: this.runtime.createRegistrationId ?? createRegistrationId,
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

    const stamp = nowIso(this.runtime);
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
