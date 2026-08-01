/**
 * DefaultExecutionWorkerAdapter — adapter default in-memory (INF-02).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem execução. Sem threads. Sem persistência real.
 * Sem BullMQ / Hangfire / Azure Workers / AWS Lambda / Cloudflare Workers / K8s Jobs.
 *
 * Representa estruturalmente a infraestrutura de Workers.
 * Nenhum Worker é executado. Nenhuma mensagem é consumida. Nenhuma Engine é invocada.
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

export const DEFAULT_EXECUTION_WORKER_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_WORKER_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionWorkerRuntime = {
  store?: ExecutionWorkerStore;
  /** Port exclusivo da Message Queue (INF-01) — sem acesso a adapters/stores. */
  executionQueue?: ExecutionQueuePort;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionWorkerId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionWorkerRuntime {
  return {
    store: new InMemoryExecutionWorkerStore(),
    executionQueue: createExecutionQueuePort(),
  };
}

function nowIso(runtime: DefaultExecutionWorkerRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionWorkerAdapter implements ExecutionWorkerPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionWorkerRuntime;
  private readonly store: ExecutionWorkerStore;
  private readonly executionQueuePort: ExecutionQueuePort;

  constructor(runtime: DefaultExecutionWorkerRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new InMemoryExecutionWorkerStore();
    this.executionQueuePort = runtime.executionQueue ?? createExecutionQueuePort();
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
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_WORKER_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionWorkerPortHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const stamp = nowIso(this.runtime);

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
            ? "Default worker-foundation probe ok."
            : "Default worker-foundation probe falhou."),
        storedWorkerCount: this.store.workerCount(),
        storedReferenceCount: this.store.referenceCount(),
        structuralHealth: buildStructuralHealth(this.store, stamp, probe.message),
      };
    }

    const storeHealth = this.store.health();
    const queueHealth = await this.executionQueuePort.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok && queueHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "InMemoryExecutionWorkerStore pronto (sem I/O externo — INF-02; queue via ExecutionQueuePort only).",
      storedWorkerCount: this.store.workerCount(),
      storedReferenceCount: this.store.referenceCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<WorkerStatisticsResult> {
    const stamp = nowIso(this.runtime);
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  private factories() {
    return {
      createWorkerId: this.runtime.createExecutionWorkerId ?? createExecutionWorkerId,
    };
  }

  /**
   * Resolve estruturalmente executionMessageQueueId via ExecutionQueuePort.getQueue.
   * NÃO enfileira. NÃO consome. NÃO processa.
   */
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
    const stamp = nowIso(this.runtime);
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
    const worker = ensureWorker(
      this.store,
      { ...input, executionMessageQueueId },
      stamp,
      this.factories(),
    );
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
    if (!input.executionWorkerId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionWorkerId required",
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
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
    if (!executionWorkerId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionWorkerId required",
        ...STRUCTURAL_WORKER_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
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
