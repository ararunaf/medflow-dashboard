/**
 * InMemoryExecutionObservabilityStore — store in-process padrão (INF-04).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem logs. Sem métricas. Sem tracing. Sem persistência real.
 * Sem cache distribuído. Sem transmissão de eventos.
 */
import type {
  ExecutionObservabilityStore,
  StoredCanonicalObservation,
} from "./execution-observability-store";

export const IN_MEMORY_EXECUTION_OBSERVABILITY_STORE_ID = "in-memory-execution-observability";

export type InMemoryExecutionObservabilityStoreOptions = {
  observations?: readonly StoredCanonicalObservation[];
};

export class InMemoryExecutionObservabilityStore implements ExecutionObservabilityStore {
  readonly storeId = IN_MEMORY_EXECUTION_OBSERVABILITY_STORE_ID;
  private readonly observations = new Map<string, StoredCanonicalObservation>();
  private readonly byExecution = new Map<string, string>();

  constructor(options: InMemoryExecutionObservabilityStoreOptions = {}) {
    for (const stored of options.observations ?? []) {
      this.setObservation(stored);
    }
  }

  getObservation(executionObservabilityId: string): StoredCanonicalObservation | undefined {
    return this.observations.get(executionObservabilityId);
  }

  getObservationByExecution(executionId: string): StoredCanonicalObservation | undefined {
    const observabilityId = this.byExecution.get(executionId);
    if (!observabilityId) return undefined;
    return this.observations.get(observabilityId);
  }

  setObservation(stored: StoredCanonicalObservation): void {
    this.observations.set(stored.observation.executionObservabilityId, stored);
    if (stored.observation.executionId) {
      this.byExecution.set(
        stored.observation.executionId,
        stored.observation.executionObservabilityId,
      );
    }
  }

  removeObservation(executionObservabilityId: string): StoredCanonicalObservation | undefined {
    const existing = this.observations.get(executionObservabilityId);
    if (!existing) return undefined;
    this.observations.delete(executionObservabilityId);
    if (existing.observation.executionId) {
      this.byExecution.delete(existing.observation.executionId);
    }
    return existing;
  }

  listObservations(): readonly StoredCanonicalObservation[] {
    return [...this.observations.values()];
  }

  observationCount(): number {
    return this.observations.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.observations.values()) {
      total += stored.observation.references.length;
    }
    return total;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `InMemoryExecutionObservabilityStore ready (${this.observations.size} observations).`,
    };
  }
}
