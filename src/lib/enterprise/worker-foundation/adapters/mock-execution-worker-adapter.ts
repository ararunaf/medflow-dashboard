/**
 * MockExecutionWorkerAdapter — INF-02 Worker Foundation.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem execução. Sem threads. Sem persistência real.
 * Sem BullMQ / Hangfire / Azure Workers / AWS Lambda / Cloudflare Workers / K8s Jobs.
 *
 * Integração com filas: exclusivamente via ExecutionQueuePort (INF-01).
 */
import type { ExecutionQueuePort } from "../../message-queue/ports/execution-queue-port";
import { createExecutionQueuePort } from "../../message-queue/providers/message-queue-provider";
import { createExecutionWorkerId } from "../ports/identity";
import type { ExecutionWorkerPort } from "../ports/execution-worker-port";
import type {
  ExecutionWorkerPortCapabilities,
  ExecutionWorkerPortHealth,
  GetWorkerInput,
  GetWorkerResult,
  PauseWorkerInput,
  PauseWorkerResult,
  RegisterWorkerInput,
  RegisterWorkerResult,
  ResumeWorkerInput,
  ResumeWorkerResult,
  StartWorkerInput,
  StartWorkerResult,
  StopWorkerInput,
  StopWorkerResult,
  StructuralWorkerLifecycleStatus,
  UnregisterWorkerInput,
  UnregisterWorkerResult,
  WorkerFoundationProviderId,
  WorkerStatisticsResult,
} from "../ports/types";
import { InMemoryExecutionWorkerStore, type ExecutionWorkerStore } from "../store";
import {
  STRUCTURAL_WORKER_NEGATION_FLAGS,
  buildStatistics,
  buildStructuralHealth,
  ensureWorker,
  foundationCapabilitiesBase,
  updateWorkerStatus,
} from "./worker-helpers";

export const MOCK_EXECUTION_WORKER_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_WORKER_VERSION = "1.0.0";

export type MockExecutionWorkerAdapterOptions = {
  provider?: Extract<WorkerFoundationProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionWorkerStore;
  executionQueue?: ExecutionQueuePort;
  createExecutionWorkerId?: () => string;
  now?: () => string;
};

export class MockExecutionWorkerAdapter implements ExecutionWorkerPort {
  readonly providerId: Extract<WorkerFoundationProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionWorkerStore;
  private readonly executionQueuePort: ExecutionQueuePort;
  private readonly createWorkerIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionWorkerAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} worker-foundation ready.`;
    this.store = options.store ?? new InMemoryExecutionWorkerStore();
    this.executionQueuePort =
      options.executionQueue ?? createExecutionQueuePort({ provider: "mock" });
    this.createWorkerIdFn = options.createExecutionWorkerId ?? createExecutionWorkerId;
    this.now = options.now;
  }

  getStore(): ExecutionWorkerStore {
    return this.store;
  }

  /** Acesso estrutural ao ExecutionQueuePort (INF-01) — sem enqueue/dequeue. */
  getExecutionQueuePort(): ExecutionQueuePort {
    return this.executionQueuePort;
  }

  capabilities(): ExecutionWorkerPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionWorkerPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedWorkerCount: this.store.workerCount(),
      storedReferenceCount: this.store.referenceCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  async statistics(): Promise<WorkerStatisticsResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
      };
    }
    return {
      ok: true,
      statistics: buildStatistics(this.store, this.stamp()),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private async resolveQueueId(input: GetWorkerInput): Promise<string | undefined> {
    if (input.executionMessageQueueId) return input.executionMessageQueueId;
    if (!input.executionId) return undefined;

    const resolved = await this.executionQueuePort.getQueue({
      executionId: input.executionId,
      createIfMissing: false,
    });
    return resolved.queue?.executionMessageQueueId;
  }

  async getWorker(input: GetWorkerInput = {}): Promise<GetWorkerResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
    const createIfMissing = input.createIfMissing ?? true;

    if (input.executionWorkerId) {
      const existing = this.store.getWorker(input.executionWorkerId);
      if (existing) {
        return {
          ok: true,
          worker: existing.worker,
          code: "found",
          message: "worker retrieved structurally",
          ...STRUCTURAL_WORKER_NEGATION_FLAGS,
        };
      }
      if (!createIfMissing) {
        return {
          ok: false,
          code: "not_found",
          message: "worker not found",
          ...STRUCTURAL_WORKER_NEGATION_FLAGS,
        };
      }
    }

    if (input.executionId) {
      const byExec = this.store.getWorkerByExecution(input.executionId);
      if (byExec) {
        return {
          ok: true,
          worker: byExec.worker,
          code: "found",
          message: "worker retrieved structurally by execution",
          ...STRUCTURAL_WORKER_NEGATION_FLAGS,
        };
      }
    }

    if (!createIfMissing) {
      return {
        ok: false,
        code: "not_found",
        message: "worker not found and createIfMissing=false",
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }

    const executionMessageQueueId = await this.resolveQueueId(input);
    const worker = ensureWorker(this.store, { ...input, executionMessageQueueId }, stamp, {
      createWorkerId: this.createWorkerIdFn,
    });
    return {
      ok: true,
      worker,
      code: "created",
      message:
        "worker created structurally — no execution, no threads, no background jobs, no engines invoked",
      ...STRUCTURAL_WORKER_NEGATION_FLAGS,
    };
  }

  async registerWorker(input: RegisterWorkerInput = {}): Promise<RegisterWorkerResult> {
    const result = await this.getWorker({ ...input, createIfMissing: true });
    if (!result.ok || !result.worker) return result;
    return {
      ...result,
      code: result.code === "found" ? "already_registered" : "registered-structural",
      message:
        "worker registered structurally — NOT started, NO threads, NO background jobs, NO message consumption",
    };
  }

  async unregisterWorker(input: UnregisterWorkerInput): Promise<UnregisterWorkerResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }
    if (!input.executionWorkerId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionWorkerId required",
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
    const existing = this.store.getWorker(input.executionWorkerId);
    if (!existing) {
      return {
        ok: false,
        code: "not_found",
        message: "worker not found",
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }

    const worker = updateWorkerStatus(
      this.store,
      input.executionWorkerId,
      "unregistered-structural",
      stamp,
      "Worker unregistered structurally — no teardown, no threads stopped",
    );
    this.store.removeWorker(input.executionWorkerId);

    return {
      ok: true,
      worker,
      code: "unregistered-structural",
      message: "worker unregistered structurally — NO execution teardown performed",
      ...STRUCTURAL_WORKER_NEGATION_FLAGS,
    };
  }

  async startWorker(input: StartWorkerInput): Promise<StartWorkerResult> {
    return this.transitionLifecycle(input.executionWorkerId, "started-structural");
  }

  async stopWorker(input: StopWorkerInput): Promise<StopWorkerResult> {
    return this.transitionLifecycle(input.executionWorkerId, "stopped-structural");
  }

  async pauseWorker(input: PauseWorkerInput): Promise<PauseWorkerResult> {
    return this.transitionLifecycle(input.executionWorkerId, "paused-structural");
  }

  async resumeWorker(input: ResumeWorkerInput): Promise<ResumeWorkerResult> {
    return this.transitionLifecycle(input.executionWorkerId, "resumed-structural");
  }

  private async transitionLifecycle(
    executionWorkerId: string,
    status: StructuralWorkerLifecycleStatus,
  ): Promise<StartWorkerResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }
    if (!executionWorkerId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionWorkerId required",
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
    const existing = this.store.getWorker(executionWorkerId);
    if (!existing) {
      return {
        ok: false,
        code: "not_found",
        message: "worker not found",
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }

    const worker = updateWorkerStatus(
      this.store,
      executionWorkerId,
      status,
      stamp,
      `Worker transitioned structurally to ${status} — NO execution, NO threads, NO background jobs`,
    );

    return {
      ok: true,
      worker,
      code: status,
      message: `worker transitioned structurally to ${status} — NO execution, NO threads, NO concurrency, NO message processing`,
      ...STRUCTURAL_WORKER_NEGATION_FLAGS,
    };
  }
}
