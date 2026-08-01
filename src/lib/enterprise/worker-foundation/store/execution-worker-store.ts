/**
 * ExecutionWorkerStore — contrato interno do store (INF-02).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem execução. Sem persistência real. Sem cache distribuído.
 * Sem concorrência. Sem threads. Sem background jobs.
 */
import type { CanonicalWorker } from "../ports/models";

export type StoredCanonicalWorker = {
  worker: CanonicalWorker;
};

export interface ExecutionWorkerStore {
  readonly storeId: string;
  getWorker(executionWorkerId: string): StoredCanonicalWorker | undefined;
  getWorkerByExecution(executionId: string): StoredCanonicalWorker | undefined;
  setWorker(stored: StoredCanonicalWorker): void;
  removeWorker(executionWorkerId: string): StoredCanonicalWorker | undefined;
  listWorkers(): readonly StoredCanonicalWorker[];
  workerCount(): number;
  referenceCount(): number;
  health(): { ok: boolean; message?: string };
}
