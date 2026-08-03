/**
 * DefaultWorkerRuntimeAdapter — INF-06.
 *
 * Adapter oficial do Enterprise Worker Runtime.
 * Responde exclusivamente de forma estrutural (sem Workers reais / sem threads).
 * Sem Scheduler. Sem Cron. Sem processamento paralelo. Sem consumo de Queue.
 */
import {
  DEFAULT_WORKER_RUNTIME_CAPABILITIES,
  toCanonicalWorkerCapabilities,
} from "../ports/capabilities";
import {
  createWorkerExecutionId,
  createWorkerId,
  createWorkerResultId,
  createWorkerRuntimeRequestId,
  createWorkerTaskId,
} from "../ports/identity";
import type { WorkerRuntimePort } from "../ports/worker-runtime-port";
import type {
  CanonicalWorker,
  CanonicalWorkerExecution,
  CanonicalWorkerResult,
  CanonicalWorkerTask,
} from "../ports/canonical";
import type {
  AllocateWorkerInput,
  AllocateWorkerResult,
  HeartbeatWorkerInput,
  HeartbeatWorkerResult,
  RegisterWorkerInput,
  RegisterWorkerResult,
  ReleaseWorkerInput,
  ReleaseWorkerResult,
  UnregisterWorkerInput,
  UnregisterWorkerResult,
  WorkerRuntimeEnterpriseDeps,
  WorkerRuntimeHealth,
  WorkerRuntimeInfo,
  WorkerRuntimeOperationEnvelope,
  WorkerRuntimeOperationalControls,
  WorkerRuntimePortCapabilities,
  WorkerRuntimeProviderId,
  WorkerRuntimeProviderMetadata,
  WorkerRuntimeStructuredLog,
  WorkerStatsInput,
  WorkerStatsResult,
} from "../ports/types";
import { InMemoryWorkerRuntimeStore, type WorkerRuntimeStore } from "../store";

export const DEFAULT_WORKER_RUNTIME_ADAPTER_ID = "default-enterprise-worker";
export const DEFAULT_WORKER_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultWorkerRuntimeAdapterOptions = {
  provider?: Extract<WorkerRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: WorkerRuntimeStore;
  enterpriseDeps?: WorkerRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: WorkerRuntimeOperationalControls): AbortSignal | undefined {
  if (input.signal instanceof AbortSignal) return input.signal;
  const attr = input.attributes?.signal;
  return attr instanceof AbortSignal ? attr : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return fallback;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Adapter oficial INF-06 — Worker Runtime default / enterprise.
 */
export class DefaultWorkerRuntimeAdapter implements WorkerRuntimePort {
  readonly providerId: Extract<WorkerRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: WorkerRuntimeProviderMetadata;
  private readonly store: WorkerRuntimeStore;
  private readonly enterpriseDeps?: WorkerRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultWorkerRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Worker Runtime ready (structural only — no real workers / no scheduler).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default Worker Runtime" : "Enterprise Worker Runtime",
      version: DEFAULT_WORKER_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official INF-06 Enterprise Worker Runtime — canonical worker infrastructure only.",
    };
    this.store = options.store ?? new InMemoryWorkerRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;

    if (this.enterpriseDeps && typeof this.enterpriseDeps.getQueueRuntimePort !== "function") {
      throw new Error(
        "DefaultWorkerRuntimeAdapter exige enterpriseDeps.getQueueRuntimePort (INF-06) quando deps são fornecidas.",
      );
    }
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): WorkerRuntimeStore {
    return this.store;
  }

  capabilities(): WorkerRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_WORKER_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_WORKER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalWorkerCapabilities(DEFAULT_WORKER_RUNTIME_CAPABILITIES),
      supportsCanonicalWorker: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      runtimeReady: true,
      realWorkers: false,
      tasksExecuted: false,
      parallelProcessing: false,
      schedulerImplemented: false,
      threadPoolImplemented: false,
      persistenceImplemented: false,
      queueConsumed: false,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsAzureQueue: false,
      implementsRedis: false,
      implementsBullMq: false,
      implementsRealWorkers: false,
      implementsScheduler: false,
      implementsThreadPool: false,
      implementsCron: false,
      implementsDeadLetter: false,
      implementsRetryReal: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): WorkerRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "WORKER_RUNTIME",
      capabilities: { ...DEFAULT_WORKER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<WorkerRuntimeHealth> {
    const storeHealth = this.store.health();
    let queueRuntimeOk = true;
    let schedulerRuntimeOk = true;
    if (this.enterpriseDeps) {
      const queueHealth = await this.enterpriseDeps.getQueueRuntimePort().health();
      queueRuntimeOk = queueHealth.ok;
      // INF-07: Scheduler preparado — valida Port sem chamar health()
      // (evita ciclo Worker.health ↔ Scheduler.health).
      if (typeof this.enterpriseDeps.getSchedulerRuntimePort === "function") {
        const schedulerPort = this.enterpriseDeps.getSchedulerRuntimePort();
        schedulerRuntimeOk =
          !!schedulerPort &&
          typeof schedulerPort.health === "function" &&
          typeof schedulerPort.capabilities === "function";
      }
    }
    const ok = this.healthy && storeHealth.ok && queueRuntimeOk && schedulerRuntimeOk;
    return {
      kind: "canonical-worker-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedWorkerCount: this.store.workerCount(),
      storedTaskCount: this.store.taskCount(),
      storedExecutionCount: this.store.executionCount(),
      queueRuntimeOk,
      schedulerRuntimeOk,
      runtimeReady: true,
      realWorkers: false,
      tasksExecuted: false,
      parallelProcessing: false,
      schedulerImplemented: false,
      threadPoolImplemented: false,
      persistenceImplemented: false,
      queueConsumed: false,
      message: this.healthy ? (storeHealth.message ?? this.message) : "Worker Runtime unhealthy.",
    };
  }

  async register(input: RegisterWorkerInput): Promise<RegisterWorkerResult> {
    return this.runOperation("register", input, async () => {
      const stamp = this.now();
      const workerName = input.workerName ?? "canonical-foundation-worker";
      const existing = input.workerId
        ? this.store.getWorker(input.workerId)
        : this.store.getWorkerByName(workerName);
      if (existing) {
        return {
          ok: false,
          code: "WORKER_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical worker already registered.",
          worker: existing,
        };
      }
      const workerId = input.workerId ?? createWorkerId();
      const worker: CanonicalWorker = {
        kind: "canonical-worker",
        workerId,
        workerName,
        identity: {
          kind: "canonical-worker-identity",
          workerId,
          workerName,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        status: "registered",
        allocated: false,
        createdAt: stamp,
        updatedAt: stamp,
        realWorkers: false,
        tasksExecuted: false,
        parallelProcessing: false,
        schedulerImplemented: false,
        threadPoolImplemented: false,
        persistenceImplemented: false,
        queueConsumed: false,
      };
      this.store.setWorker(worker);
      const result = this.buildResult({
        operation: "register",
        status: "registered",
        worker,
        stamp,
        code: "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Worker Runtime structural register (INF-06 foundation — no real workers).",
      });
      return {
        ok: true,
        result,
        worker,
        code: "WORKER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregister(input: UnregisterWorkerInput): Promise<UnregisterWorkerResult> {
    return this.runOperation("unregister", input, async () => {
      const existing = this.store.getWorker(input.workerId);
      if (!existing) {
        return {
          ok: false,
          code: "WORKER_RUNTIME_WORKER_NOT_FOUND",
          message: "Canonical worker not found.",
        };
      }
      const stamp = this.now();
      const worker: CanonicalWorker = {
        ...existing,
        status: "unregistered",
        allocated: false,
        updatedAt: stamp,
      };
      this.store.removeWorker(input.workerId);
      const result = this.buildResult({
        operation: "unregister",
        status: "unregistered",
        worker,
        stamp,
        code: "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Worker Runtime structural unregister (INF-06 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        worker,
        code: "WORKER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async allocate(input: AllocateWorkerInput): Promise<AllocateWorkerResult> {
    return this.runOperation("allocate", input, async () => {
      const stamp = this.now();
      let worker = this.resolveWorker(input.workerId, input.workerName);
      if (!worker) {
        const workerName = input.workerName ?? "canonical-foundation-worker";
        const workerId = input.workerId ?? createWorkerId();
        worker = {
          kind: "canonical-worker",
          workerId,
          workerName,
          identity: {
            kind: "canonical-worker-identity",
            workerId,
            workerName,
          },
          metadata: input.metadata,
          status: "registered",
          allocated: false,
          createdAt: stamp,
          updatedAt: stamp,
          realWorkers: false,
          tasksExecuted: false,
          parallelProcessing: false,
          schedulerImplemented: false,
          threadPoolImplemented: false,
          persistenceImplemented: false,
          queueConsumed: false,
        };
        this.store.setWorker(worker);
      }
      const taskId = input.taskId ?? createWorkerTaskId();
      const task: CanonicalWorkerTask = {
        kind: "canonical-worker-task",
        taskId,
        workerId: worker.workerId,
        identity: {
          kind: "canonical-worker-identity",
          workerId: worker.workerId,
          workerName: worker.workerName,
          taskId,
        },
        metadata: input.metadata,
        status: "allocated",
        registeredAt: stamp,
        updatedAt: stamp,
        realWorkers: false,
        tasksExecuted: false,
        parallelProcessing: false,
        persistenceImplemented: false,
      };
      this.store.setTask(task);
      const execution: CanonicalWorkerExecution = {
        kind: "canonical-worker-execution",
        executionId: createWorkerExecutionId(),
        workerId: worker.workerId,
        taskId,
        identity: {
          kind: "canonical-worker-identity",
          workerId: worker.workerId,
          taskId,
        },
        metadata: input.metadata,
        status: "allocated",
        createdAt: stamp,
        updatedAt: stamp,
        realWorkers: false,
        tasksExecuted: false,
        parallelProcessing: false,
        persistenceImplemented: false,
      };
      this.store.setExecution(execution);
      const updated: CanonicalWorker = {
        ...worker,
        status: "allocated",
        allocated: true,
        updatedAt: stamp,
        tasksExecuted: false,
        parallelProcessing: false,
        queueConsumed: false,
      };
      this.store.setWorker(updated);
      const result = this.buildResult({
        operation: "allocate",
        status: "allocated",
        worker: updated,
        task,
        execution,
        stamp,
        code: "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Worker Runtime structural allocate (INF-06 foundation — no task execution).",
      });
      return {
        ok: true,
        result,
        worker: updated,
        task,
        execution,
        code: "WORKER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async release(input: ReleaseWorkerInput): Promise<ReleaseWorkerResult> {
    return this.runOperation("release", input, async () => {
      const existing = this.store.getWorker(input.workerId);
      if (!existing) {
        return {
          ok: false,
          code: "WORKER_RUNTIME_WORKER_NOT_FOUND",
          message: "Canonical worker not found.",
        };
      }
      const stamp = this.now();
      const worker: CanonicalWorker = {
        ...existing,
        status: "released",
        allocated: false,
        updatedAt: stamp,
      };
      this.store.setWorker(worker);
      const result = this.buildResult({
        operation: "release",
        status: "released",
        worker,
        stamp,
        code: "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Worker Runtime structural release (INF-06 foundation — no real release).",
      });
      return {
        ok: true,
        result,
        worker,
        code: "WORKER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async heartbeat(input: HeartbeatWorkerInput): Promise<HeartbeatWorkerResult> {
    return this.runOperation("heartbeat", input, async () => {
      const existing = this.store.getWorker(input.workerId);
      if (!existing) {
        return {
          ok: false,
          code: "WORKER_RUNTIME_WORKER_NOT_FOUND",
          message: "Canonical worker not found.",
        };
      }
      const stamp = this.now();
      const worker: CanonicalWorker = {
        ...existing,
        status: existing.allocated ? "allocated" : "heartbeat",
        lastHeartbeatAt: stamp,
        updatedAt: stamp,
      };
      this.store.setWorker(worker);
      if (this.store instanceof InMemoryWorkerRuntimeStore) {
        this.store.recordHeartbeat();
      }
      const result = this.buildResult({
        operation: "heartbeat",
        status: "heartbeat",
        worker,
        stamp,
        code: "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Worker Runtime structural heartbeat (INF-06 foundation — no real liveness).",
      });
      return {
        ok: true,
        result,
        worker,
        code: "WORKER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: WorkerStatsInput = {}): Promise<WorkerStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Worker Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "WORKER_RUNTIME_OK",
        message: `Worker Runtime stats: ${statistics.totalWorkers} workers, ${statistics.totalTasks} tasks.`,
      };
    });
  }

  private resolveWorker(
    workerId: string | undefined,
    workerName: string | undefined,
  ): CanonicalWorker | undefined {
    if (workerId) {
      const byId = this.store.getWorker(workerId);
      if (byId) return byId;
    }
    if (workerName) return this.store.getWorkerByName(workerName);
    const all = this.store.listWorkers();
    return all[0];
  }

  private buildResult(args: {
    operation: CanonicalWorkerResult["operation"];
    status: CanonicalWorkerResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    worker?: CanonicalWorker;
    task?: CanonicalWorkerTask;
    execution?: CanonicalWorkerExecution;
  }): CanonicalWorkerResult {
    return {
      kind: "canonical-worker-result",
      ok: true,
      resultId: createWorkerResultId(),
      operation: args.operation,
      worker: args.worker,
      task: args.task,
      execution: args.execution,
      provider: {
        kind: "canonical-worker-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_WORKER_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      realWorkers: false,
      tasksExecuted: false,
      parallelProcessing: false,
      schedulerImplemented: false,
      threadPoolImplemented: false,
      persistenceImplemented: false,
      queueConsumed: false,
      runtimeReady: true,
      status: args.status,
      messageText: args.messageText,
      code: args.code,
      createdAt: args.stamp,
      updatedAt: args.stamp,
    };
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: WorkerRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & WorkerRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createWorkerRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: WorkerRuntimeStructuredLog[] = [];
    let attempts = 0;
    let lastError: unknown;

    try {
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        attempts = attempt + 1;
        if (signal?.aborted) {
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          return {
            ok: false,
            requestId,
            provider: this.providerId,
            code: "WORKER_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & WorkerRuntimeOperationEnvelope;
        }

        try {
          if (this.failAttemptsRemaining > 0) {
            this.failAttemptsRemaining -= 1;
            throw new Error("Forced transient failure (test).");
          }

          const body = await this.withTimeout(fn(), timeoutMs, signal);
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          logs.push({
            level: "info",
            code: body.code ?? "WORKER_RUNTIME_OK",
            message: body.message ?? `${operation} completed`,
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          return {
            ...body,
            requestId,
            provider: this.providerId,
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: false,
              operation,
            },
            logs,
          };
        } catch (err) {
          lastError = err;
          logs.push({
            level: "warn",
            code: "WORKER_RUNTIME_RETRY",
            message: err instanceof Error ? err.message : String(err),
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          if (attempt < retryCount) {
            await this.sleep(this.defaultRetryBackoffMs * (attempt + 1));
          }
        }
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        lastError instanceof Error ? lastError.message : String(lastError ?? "unknown error");
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "WORKER_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & WorkerRuntimeOperationEnvelope;
    } catch (err) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const isTimeout =
        err instanceof Error && (err.name === "TimeoutError" || /timeout/i.test(err.message));
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "WORKER_RUNTIME_CANCELLED"
          : isTimeout
            ? "WORKER_RUNTIME_TIMEOUT"
            : "WORKER_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & WorkerRuntimeOperationEnvelope;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<T> {
    if (timeoutMs <= 0 && !signal) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          if (timeoutMs > 0) {
            timer = setTimeout(() => {
              const err = new Error(`Worker Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Worker Runtime operation aborted");
              err.name = "AbortError";
              reject(err);
            };
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
          }
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    }
  }
}

/** Alias oficial do adapter enterprise (INF-06). */
export const EnterpriseWorkerRuntimeAdapter = DefaultWorkerRuntimeAdapter;
