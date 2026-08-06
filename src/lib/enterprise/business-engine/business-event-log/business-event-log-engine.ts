/**
 * BusinessEventLogEngine — E-07.
 *
 * Registra eventos de negócio em memória.
 * Sem persistência. Sem fila. Sem banco. Sem IA.
 */
import type { CanonicalBusinessEvent } from "../ports/canonical";

export interface BusinessEventLogStore {
  append(event: CanonicalBusinessEvent): void;
  get(eventId: string): CanonicalBusinessEvent | undefined;
  listByType(eventType: string): CanonicalBusinessEvent[];
  listByCorrelationId(correlationId: string): CanonicalBusinessEvent[];
  listByTransactionId(transactionId: string): CanonicalBusinessEvent[];
  all(): CanonicalBusinessEvent[];
}

export class InMemoryBusinessEventLogStore implements BusinessEventLogStore {
  private readonly events: CanonicalBusinessEvent[] = [];

  append(event: CanonicalBusinessEvent): void {
    this.events.push(event);
    this.events.sort((a, b) => a.timestamp - b.timestamp);
  }

  get(eventId: string): CanonicalBusinessEvent | undefined {
    return this.events.find((e) => e.eventId === eventId);
  }

  listByType(eventType: string): CanonicalBusinessEvent[] {
    return this.events.filter((e) => e.eventType === eventType);
  }

  listByCorrelationId(correlationId: string): CanonicalBusinessEvent[] {
    return this.events.filter((e) => e.correlationId === correlationId);
  }

  listByTransactionId(transactionId: string): CanonicalBusinessEvent[] {
    return this.events.filter((e) => e.transactionId === transactionId);
  }

  all(): CanonicalBusinessEvent[] {
    return [...this.events];
  }
}

export class BusinessEventLogEngine {
  constructor(
    private readonly store: BusinessEventLogStore = new InMemoryBusinessEventLogStore(),
  ) {}

  register(event: CanonicalBusinessEvent): { ok: boolean; code: string; message: string } {
    if (!event.eventId) {
      return {
        ok: false,
        code: "BUSINESS_EVENT_LOG_MISSING_ID",
        message: "eventId is required",
      };
    }
    if (!event.eventType) {
      return {
        ok: false,
        code: "BUSINESS_EVENT_LOG_MISSING_TYPE",
        message: "eventType is required",
      };
    }
    this.store.append(event);
    return {
      ok: true,
      code: "BUSINESS_EVENT_LOG_REGISTERED",
      message: "event registered",
    };
  }

  find(eventId: string): CanonicalBusinessEvent | undefined {
    return this.store.get(eventId);
  }

  listByType(eventType: string): CanonicalBusinessEvent[] {
    return this.store.listByType(eventType);
  }

  listByCorrelationId(correlationId: string): CanonicalBusinessEvent[] {
    return this.store.listByCorrelationId(correlationId);
  }

  listByTransactionId(transactionId: string): CanonicalBusinessEvent[] {
    return this.store.listByTransactionId(transactionId);
  }

  all(): CanonicalBusinessEvent[] {
    return this.store.all();
  }
}
