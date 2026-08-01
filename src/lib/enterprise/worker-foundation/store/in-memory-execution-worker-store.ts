/**
 * InMemoryExecutionWorkerStore — store in-process padrão (INF-02).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem execução. Sem persistência real. Sem cache distribuído.
 * Sem concorrência. Sem threads. Sem background jobs.
 */
import type { ExecutionWorkerStore, StoredCanonicalWorker } from "./execution-worker-store";

export const IN_MEMORY_EXECUTION_WORKER_STORE_ID = "in-memory-execution-worker";

export type InMemoryExecutionWorkerStoreOptions = {
  workers?: readonly StoredCanonicalWorker[];
};

export class InMemoryExecutionWorkerStore implements ExecutionWorkerStore {
  readonly storeId = IN_MEMORY_EXECUTION_WORKER_STORE_ID;
  private readonly workers = new Map<string, StoredCanonicalWorker>();
  private readonly byExecution = new Map<string, string>();

  constructor(options: InMemoryExecutionWorkerStoreOptions = {}) {
    for (const stored of options.workers ?? []) {
      this.setWorker(stored);
    }
  }

  getWorker(executionWorkerId: string): StoredCanonicalWorker | undefined {
    return this.workers.get(executionWorkerId);
  }

  getWorkerByExecution(executionId: string): StoredCanonicalWorker | undefined {
    const workerId = this.byExecution.get(executionId);
    if (!workerId) return undefined;
    return this.workers.get(workerId);
  }

  setWorker(stored: StoredCanonicalWorker): void {
    this.workers.set(stored.worker.executionWorkerId, stored);
    if (stored.worker.executionId) {
      this.byExecution.set(stored.worker.executionId, stored.worker.executionWorkerId);
    }
  }

  removeWorker(executionWorkerId: string): StoredCanonicalWorker | undefined {
    const existing = this.workers.get(executionWorkerId);
    if (!existing) return undefined;
    this.workers.delete(executionWorkerId);
    if (existing.worker.executionId) {
      this.byExecution.delete(existing.worker.executionId);
    }
    return existing;
  }

  listWorkers(): readonly StoredCanonicalWorker[] {
    return [...this.workers.values()];
  }

  workerCount(): number {
    return this.workers.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.workers.values()) {
      total += stored.worker.references.length;
    }
    return total;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `InMemoryExecutionWorkerStore ready (${this.workers.size} workers).`,
    };
  }
}
