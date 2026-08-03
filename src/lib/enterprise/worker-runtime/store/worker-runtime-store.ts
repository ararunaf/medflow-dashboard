/**
 * WorkerRuntimeStore — contrato interno do store (INF-06).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO cria threads; NÃO agenda jobs; NÃO executa Workers.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalWorker,
  CanonicalWorkerExecution,
  CanonicalWorkerStatistics,
  CanonicalWorkerTask,
} from "../ports/canonical";

export type StoredCanonicalWorker = CanonicalWorker;
export type StoredCanonicalWorkerTask = CanonicalWorkerTask;
export type StoredCanonicalWorkerExecution = CanonicalWorkerExecution;

export interface WorkerRuntimeStore {
  readonly storeId: string;

  getWorker(workerId: string): StoredCanonicalWorker | undefined;
  getWorkerByName(workerName: string): StoredCanonicalWorker | undefined;
  setWorker(worker: StoredCanonicalWorker): void;
  removeWorker(workerId: string): void;
  listWorkers(): readonly StoredCanonicalWorker[];

  getTask(taskId: string): StoredCanonicalWorkerTask | undefined;
  setTask(task: StoredCanonicalWorkerTask): void;
  listTasks(workerId?: string): readonly StoredCanonicalWorkerTask[];

  getExecution(executionId: string): StoredCanonicalWorkerExecution | undefined;
  setExecution(execution: StoredCanonicalWorkerExecution): void;
  listExecutions(workerId?: string): readonly StoredCanonicalWorkerExecution[];

  workerCount(): number;
  taskCount(): number;
  executionCount(): number;
  statistics(): CanonicalWorkerStatistics;
  health(): { ok: boolean; message?: string };
}
