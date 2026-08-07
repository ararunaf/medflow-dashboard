/**
 * BusinessAuditTrailEngine — E-08.
 *
 * Reconstrói trilhas de auditoria a partir do BusinessEventLogEngine.
 * Não duplica lógica. Sem persistência. Sem banco. Sem IA.
 */
import type { BusinessEventLogEngine } from "../business-event-log";
import type {
  CanonicalBusinessAuditTrail,
  CanonicalBusinessAuditTrailEntry,
} from "../ports/canonical";

export interface BusinessAuditTrailStore {
  getByCorrelationId(correlationId: string): CanonicalBusinessAuditTrail | undefined;
  getByTransactionId(transactionId: string): CanonicalBusinessAuditTrail | undefined;
  all(): CanonicalBusinessAuditTrail[];
  set(trail: CanonicalBusinessAuditTrail): void;
}

export class InMemoryBusinessAuditTrailStore implements BusinessAuditTrailStore {
  private readonly byCorrelation = new Map<string, CanonicalBusinessAuditTrail>();
  private readonly byTransaction = new Map<string, CanonicalBusinessAuditTrail>();

  getByCorrelationId(correlationId: string): CanonicalBusinessAuditTrail | undefined {
    return this.byCorrelation.get(correlationId);
  }

  getByTransactionId(transactionId: string): CanonicalBusinessAuditTrail | undefined {
    return this.byTransaction.get(transactionId);
  }

  all(): CanonicalBusinessAuditTrail[] {
    return [...new Set(this.byTransaction.values())];
  }

  set(trail: CanonicalBusinessAuditTrail): void {
    this.byCorrelation.set(trail.correlationId, trail);
    this.byTransaction.set(trail.transactionId, trail);
  }
}

export class BusinessAuditTrailEngine {
  constructor(
    private readonly eventLog: BusinessEventLogEngine,
    private readonly store: BusinessAuditTrailStore = new InMemoryBusinessAuditTrailStore(),
  ) {}

  create(
    auditId: string,
    correlationId: string,
    transactionId: string,
  ): { ok: boolean; code: string; message: string } {
    const events = [
      ...this.eventLog.listByTransactionId(transactionId),
      ...this.eventLog.listByCorrelationId(correlationId),
    ];

    const unique = new Map<string, (typeof events)[0]>();
    for (const event of events) {
      unique.set(event.eventId, event);
    }

    const sorted = [...unique.values()].sort((a, b) => a.timestamp - b.timestamp);

    const entries: CanonicalBusinessAuditTrailEntry[] = sorted.map((event, index) => ({
      kind: "canonical-business-audit-trail-entry",
      entryId: `${auditId}-${index + 1}`,
      timestamp: event.timestamp,
      eventId: event.eventId,
      eventType: event.eventType,
      action: "event-observed",
      context: {
        ...event.payload,
        correlationId: event.correlationId,
        transactionId: event.transactionId,
      },
    }));

    const trail: CanonicalBusinessAuditTrail = {
      kind: "canonical-business-audit-trail",
      auditId,
      correlationId,
      transactionId,
      createdAt: Date.now(),
      entries,
    };

    this.store.set(trail);

    return {
      ok: true,
      code: "BUSINESS_AUDIT_TRAIL_CREATED",
      message: "audit trail created",
    };
  }

  findByCorrelationId(correlationId: string): CanonicalBusinessAuditTrail | undefined {
    return this.store.getByCorrelationId(correlationId);
  }

  findByTransactionId(transactionId: string): CanonicalBusinessAuditTrail | undefined {
    return this.store.getByTransactionId(transactionId);
  }

  all(): CanonicalBusinessAuditTrail[] {
    return this.store.all();
  }
}
