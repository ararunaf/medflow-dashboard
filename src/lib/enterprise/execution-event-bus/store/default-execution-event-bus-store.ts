/**
 * DefaultExecutionEventBusStore — store in-process padrão (EPC-24 Sprint 05).
 *
 * Persistência estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas. Sem Pub/Sub.
 */
import type { ExecutionEventBusStore, StoredExecutionEventBus } from "./execution-event-bus-store";

export const DEFAULT_EXECUTION_EVENT_BUS_STORE_ID = "default-in-process";

export type DefaultExecutionEventBusStoreOptions = {
  buses?: readonly StoredExecutionEventBus[];
};

export class DefaultExecutionEventBusStore implements ExecutionEventBusStore {
  readonly storeId = DEFAULT_EXECUTION_EVENT_BUS_STORE_ID;
  private readonly buses = new Map<string, StoredExecutionEventBus>();
  private readonly byExecution = new Map<string, string>();

  constructor(options: DefaultExecutionEventBusStoreOptions = {}) {
    for (const entry of options.buses ?? []) {
      this.setBus(entry);
    }
  }

  getBus(eventBusId: string): StoredExecutionEventBus | undefined {
    return this.buses.get(eventBusId);
  }

  getBusByExecution(executionId: string): StoredExecutionEventBus | undefined {
    const eventBusId = this.byExecution.get(executionId);
    if (!eventBusId) return undefined;
    return this.buses.get(eventBusId);
  }

  setBus(entry: StoredExecutionEventBus): void {
    this.buses.set(entry.bus.eventBusId, entry);
    this.byExecution.set(entry.bus.executionId, entry.bus.eventBusId);
  }

  listBuses(): readonly StoredExecutionEventBus[] {
    return [...this.buses.values()];
  }

  removeBus(eventBusId: string): boolean {
    const existing = this.buses.get(eventBusId);
    if (!existing) return false;
    this.byExecution.delete(existing.bus.executionId);
    return this.buses.delete(eventBusId);
  }

  busCount(): number {
    return this.buses.size;
  }

  eventCount(): number {
    let total = 0;
    for (const entry of this.buses.values()) {
      total += entry.bus.history.envelopes.length;
    }
    return total;
  }

  registrationCount(): number {
    let total = 0;
    for (const entry of this.buses.values()) {
      total += entry.bus.registrations.length;
    }
    return total;
  }

  historyCount(): number {
    return this.buses.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionEventBusStore ready (${this.buses.size} buses).`,
    };
  }
}
