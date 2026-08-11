/**
 * InMemoryWorkerRuntimeStore — store in-process (INF-06 / OPER-INF-W).
 *
 * Implementação oficial do Worker Runtime Store (estado canônico local).
 * Persistência de mensagens permanece no QueueRuntimePort (OPER-INF-Q).
 * Sem Redis. Sem Threads. Sem Scheduler. Sem acesso direto a banco pelo Worker.
 */
import type { CanonicalWorkerStatistics } from "../ports/canonical";
import type {
  StoredCanonicalWorker,
  StoredCanonicalWorkerExecution,
  StoredCanonicalWorkerTask,
  WorkerRuntimeStore,
} from "./worker-runtime-store";

export const IN_MEMORY_WORKER_RUNTIME_STORE_ID = "in-memory-worker-runtime";

export type InMemoryWorkerRuntimeStoreOptions = {
  workers?: readonly StoredCanonicalWorker[];
  tasks?: readonly StoredCanonicalWorkerTask[];
  executions?: readonly StoredCanonicalWorkerExecution[];
};

/**
 * Store de Workers/tasks/execuções canônicas in-memory — exclusivo do Adapter (INF-06).
 */
export class InMemoryWorkerRuntimeStore implements WorkerRuntimeStore {
  readonly storeId = IN_MEMORY_WORKER_RUNTIME_STORE_ID;

  private readonly workers = new Map<string, StoredCanonicalWorker>();
  private readonly byName = new Map<string, string>();
  private readonly tasks = new Map<string, StoredCanonicalWorkerTask>();
  private readonly executions = new Map<string, StoredCanonicalWorkerExecution>();
  private heartbeatCount = 0;

  constructor(options: InMemoryWorkerRuntimeStoreOptions = {}) {
    for (const worker of options.workers ?? []) {
      this.setWorker(worker);
    }
    for (const task of options.tasks ?? []) {
      this.setTask(task);
    }
    for (const execution of options.executions ?? []) {
      this.setExecution(execution);
    }
  }

  getWorker(workerId: string): StoredCanonicalWorker | undefined {
    const worker = this.workers.get(workerId);
    return worker ? { ...worker } : undefined;
  }

  getWorkerByName(workerName: string): StoredCanonicalWorker | undefined {
    const workerId = this.byName.get(workerName);
    if (!workerId) return undefined;
    return this.getWorker(workerId);
  }

  setWorker(worker: StoredCanonicalWorker): void {
    this.workers.set(worker.workerId, { ...worker });
    this.byName.set(worker.workerName, worker.workerId);
  }

  removeWorker(workerId: string): void {
    const existing = this.workers.get(workerId);
    if (existing) {
      this.byName.delete(existing.workerName);
      this.workers.delete(workerId);
    }
  }

  listWorkers(): readonly StoredCanonicalWorker[] {
    return Array.from(this.workers.values()).map((worker) => ({ ...worker }));
  }

  getTask(taskId: string): StoredCanonicalWorkerTask | undefined {
    const task = this.tasks.get(taskId);
    return task ? { ...task } : undefined;
  }

  setTask(task: StoredCanonicalWorkerTask): void {
    this.tasks.set(task.taskId, { ...task });
  }

  listTasks(workerId?: string): readonly StoredCanonicalWorkerTask[] {
    const all = Array.from(this.tasks.values()).map((task) => ({ ...task }));
    if (!workerId) return all;
    return all.filter((task) => task.workerId === workerId);
  }

  getExecution(executionId: string): StoredCanonicalWorkerExecution | undefined {
    const execution = this.executions.get(executionId);
    return execution ? { ...execution } : undefined;
  }

  setExecution(execution: StoredCanonicalWorkerExecution): void {
    this.executions.set(execution.executionId, { ...execution });
  }

  listExecutions(workerId?: string): readonly StoredCanonicalWorkerExecution[] {
    const all = Array.from(this.executions.values()).map((execution) => ({ ...execution }));
    if (!workerId) return all;
    return all.filter((execution) => execution.workerId === workerId);
  }

  /** Contador estrutural de heartbeats (sem liveness real). */
  recordHeartbeat(): void {
    this.heartbeatCount += 1;
  }

  workerCount(): number {
    return this.workers.size;
  }

  taskCount(): number {
    return this.tasks.size;
  }

  executionCount(): number {
    return this.executions.size;
  }

  statistics(): CanonicalWorkerStatistics {
    const all = this.listWorkers();
    let registered = 0;
    let allocated = 0;
    let released = 0;
    for (const worker of all) {
      if (worker.status === "registered" || worker.status === "idle") registered += 1;
      if (worker.allocated || worker.status === "allocated") allocated += 1;
      if (worker.status === "released") released += 1;
    }
    return {
      kind: "canonical-worker-statistics",
      totalWorkers: all.length,
      registeredWorkers: registered,
      allocatedWorkers: allocated,
      releasedWorkers: released,
      heartbeatCount: this.heartbeatCount,
      totalTasks: this.taskCount(),
      totalExecutions: this.executionCount(),
      realWorkersCount: 0,
      tasksExecutedCount: 0,
      parallelProcessingCount: 0,
      schedulerImplementedCount: 0,
      threadPoolImplementedCount: 0,
      persistenceImplementedCount: 0,
      queueConsumedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Worker Runtime store ready (${this.workerCount()} workers, ${this.taskCount()} tasks, ${this.executionCount()} executions).`,
    };
  }
}
