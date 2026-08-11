/**
 * DefaultWorkerRuntimeAdapter — INF-06 / OPER-INF-W.
 *
 * Adapter oficial do Enterprise Worker Runtime.
 * OPER-INF-W: consumo operacional exclusivo via QueueRuntimePort
 * (polling controlado, claim/dequeue, lock, ack, nack, heartbeat, graceful shutdown).
 * Sem Scheduler. Sem Cron. Sem processamento paralelo. Sem Dead Letter / Retry Engine.
 * Sem acesso direto a banco — persistência permanece no QueueRuntimePort (OPER-INF-Q).
 */
import {
  DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES,
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
import {
  DEFAULT_WORKER_POLL_INTERVAL_MS,
  WorkerQueueConsumer,
  type WorkerQueueProcessMessage,
  type WorkerQueueProcessedEvent,
} from "../operational";
import { InMemoryWorkerRuntimeStore, type WorkerRuntimeStore } from "../store";

export const DEFAULT_WORKER_RUNTIME_ADAPTER_ID = "default-enterprise-worker";
export const DEFAULT_WORKER_RUNTIME_VERSION = "1.0.0";
export const DEFAULT_WORKER_QUEUE_NAME = "enterprise-worker-queue";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultWorkerRuntimeAdapterOptions = {
  provider?: Extract<WorkerRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: WorkerRuntimeStore;
  enterpriseDeps?: WorkerRuntimeEnterpriseDeps;
  /**
   * OPER-INF-W — quando true (default), ativa consumo via QueueRuntimePort.
   * Mock força false.
   */
  operational?: boolean;
  pollIntervalMs?: number;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry de envelope). */
  failAttempts?: number;
  /**
   * Hook de capability (TISS-RUNTIME-01B+) — injetável sem alterar WorkerRuntimePort.
   * Default: undefined → ack imediato (comportamento OPER-INF-W preservado).
   */
  processMessage?: WorkerQueueProcessMessage;
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

function readStringAttr(
  input: WorkerRuntimeOperationalControls & {
    metadata?: { customAttributes?: Readonly<Record<string, string | number | boolean | null>> };
  },
  key: string,
): string | undefined {
  const fromAttributes = input.attributes?.[key];
  if (typeof fromAttributes === "string" && fromAttributes.trim() !== "") {
    return fromAttributes.trim();
  }
  const fromMeta = input.metadata?.customAttributes?.[key];
  if (typeof fromMeta === "string" && fromMeta.trim() !== "") {
    return fromMeta.trim();
  }
  return undefined;
}

function readBoolAttr(input: WorkerRuntimeOperationalControls, key: string): boolean {
  const value = input.attributes?.[key];
  return value === true || value === "true";
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Adapter oficial INF-06 / OPER-INF-W — Worker Runtime default / enterprise.
 */
export class DefaultWorkerRuntimeAdapter implements WorkerRuntimePort {
  readonly providerId: Extract<WorkerRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: WorkerRuntimeProviderMetadata;
  private readonly store: WorkerRuntimeStore;
  private readonly enterpriseDeps?: WorkerRuntimeEnterpriseDeps;
  private readonly operational: boolean;
  private readonly defaultPollIntervalMs: number;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;
  private consumer: WorkerQueueConsumer | null = null;
  private tasksExecutedCount = 0;
  private queueConsumedCount = 0;

  constructor(options: DefaultWorkerRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.operational = options.operational ?? true;
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      (this.operational
        ? `${this.providerId} Worker Runtime ready (OPER-INF-W — QueueRuntimePort consumer active).`
        : `${this.providerId} Worker Runtime ready (structural only — no queue consumption).`);
    this.metadata = {
      name: this.providerId === "default" ? "Default Worker Runtime" : "Enterprise Worker Runtime",
      version: DEFAULT_WORKER_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official INF-06 Enterprise Worker Runtime — OPER-INF-W operational consumer via QueueRuntimePort.",
    };
    this.store = options.store ?? new InMemoryWorkerRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultPollIntervalMs = options.pollIntervalMs ?? DEFAULT_WORKER_POLL_INTERVAL_MS;
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

    if (this.operational && this.enterpriseDeps) {
      this.consumer = new WorkerQueueConsumer({
        getQueueRuntimePort: () => this.enterpriseDeps!.getQueueRuntimePort(),
        pollIntervalMs: this.defaultPollIntervalMs,
        sleep: this.sleep,
        now: this.now,
        onProcessed: (event) => this.onQueueProcessed(event),
        processMessage: options.processMessage,
      });
    }
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): WorkerRuntimeStore {
    return this.store;
  }

  /** Consumidor operacional ativo (OPER-INF-W) — null em modo estrutural. */
  getConsumer(): WorkerQueueConsumer | null {
    return this.consumer;
  }

  /**
   * Liga capability operacional no consumer existente (TISS-RUNTIME-01B).
   * Não cria Port — apenas configura o hook OPER-INF-W.
   */
  setProcessMessage(handler: WorkerQueueProcessMessage | undefined): void {
    this.consumer?.setProcessMessage(handler);
  }

  capabilities(): WorkerRuntimePortCapabilities {
    const engine = this.operational
      ? DEFAULT_WORKER_RUNTIME_CAPABILITIES
      : DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES;
    return {
      provider: this.providerId,
      adapterId: DEFAULT_WORKER_RUNTIME_ADAPTER_ID,
      engine: { ...engine },
      canonical: toCanonicalWorkerCapabilities(engine),
      supportsCanonicalWorker: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      runtimeReady: true,
      realWorkers: this.operational,
      tasksExecuted: this.operational,
      parallelProcessing: false,
      schedulerImplemented: false,
      threadPoolImplemented: false,
      persistenceImplemented: this.operational,
      queueConsumed: this.operational,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsAzureQueue: false,
      implementsRedis: false,
      implementsBullMq: false,
      implementsRealWorkers: this.operational,
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
    const caps = this.operational
      ? DEFAULT_WORKER_RUNTIME_CAPABILITIES
      : DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES;
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "WORKER_RUNTIME",
      capabilities: { ...caps },
    };
  }

  async health(): Promise<WorkerRuntimeHealth> {
    const storeHealth = this.store.health();
    let queueRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let observabilityRuntimeOk = true;
    let scalabilityRuntimeOk = true;
    if (this.enterpriseDeps) {
      const queueHealth = await this.enterpriseDeps.getQueueRuntimePort().health();
      queueRuntimeOk = queueHealth.ok;
      // INF-07 / INF-08 / INF-09: Scheduler/PersistentQueue/Observability preparados — valida Port sem chamar health()
      // (evita ciclo Worker.health ↔ Scheduler/PersistentQueue/Observability.health).
      if (typeof this.enterpriseDeps.getSchedulerRuntimePort === "function") {
        const schedulerPort = this.enterpriseDeps.getSchedulerRuntimePort();
        schedulerRuntimeOk =
          !!schedulerPort &&
          typeof schedulerPort.health === "function" &&
          typeof schedulerPort.capabilities === "function";
      }
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort === "function") {
        const persistentQueuePort = this.enterpriseDeps.getPersistentQueueRuntimePort();
        persistentQueueRuntimeOk =
          !!persistentQueuePort &&
          typeof persistentQueuePort.health === "function" &&
          typeof persistentQueuePort.capabilities === "function";
      }
      if (typeof this.enterpriseDeps.getObservabilityRuntimePort === "function") {
        const observabilityPort = this.enterpriseDeps.getObservabilityRuntimePort();
        observabilityRuntimeOk =
          !!observabilityPort &&
          typeof observabilityPort.health === "function" &&
          typeof observabilityPort.capabilities === "function";
      }
      if (typeof this.enterpriseDeps.getScalabilityRuntimePort === "function") {
        const scalabilityPort = this.enterpriseDeps.getScalabilityRuntimePort();
        scalabilityRuntimeOk =
          !!scalabilityPort &&
          typeof scalabilityPort.health === "function" &&
          typeof scalabilityPort.capabilities === "function";
      }
    }
    const ok =
      this.healthy &&
      storeHealth.ok &&
      queueRuntimeOk &&
      schedulerRuntimeOk &&
      persistentQueueRuntimeOk &&
      observabilityRuntimeOk &&
      scalabilityRuntimeOk;
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
      persistentQueueRuntimeOk,
      observabilityRuntimeOk,
      scalabilityRuntimeOk,
      runtimeReady: true,
      realWorkers: this.operational,
      tasksExecuted: this.operational,
      parallelProcessing: false,
      schedulerImplemented: false,
      threadPoolImplemented: false,
      persistenceImplemented: this.operational,
      queueConsumed: this.operational,
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
        realWorkers: this.operational,
        tasksExecuted: this.operational,
        parallelProcessing: false,
        schedulerImplemented: false,
        threadPoolImplemented: false,
        persistenceImplemented: this.operational,
        queueConsumed: this.operational,
      };
      this.store.setWorker(worker);
      const result = this.buildResult({
        operation: "register",
        status: "registered",
        worker,
        stamp,
        code: this.operational ? "WORKER_RUNTIME_OK" : "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Worker Runtime operational register (OPER-INF-W)."
          : "Canonical Worker Runtime structural register (INF-06 foundation — no real workers).",
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
      await this.consumer?.stop(input.workerId);
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
        code: this.operational ? "WORKER_RUNTIME_OK" : "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Worker Runtime operational unregister (OPER-INF-W — graceful shutdown)."
          : "Canonical Worker Runtime structural unregister (INF-06 foundation — no real teardown).",
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
          realWorkers: this.operational,
          tasksExecuted: this.operational,
          parallelProcessing: false,
          schedulerImplemented: false,
          threadPoolImplemented: false,
          persistenceImplemented: this.operational,
          queueConsumed: this.operational,
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
        realWorkers: this.operational,
        tasksExecuted: this.operational,
        parallelProcessing: false,
        persistenceImplemented: this.operational,
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
        realWorkers: this.operational,
        tasksExecuted: this.operational,
        parallelProcessing: false,
        persistenceImplemented: this.operational,
      };
      this.store.setExecution(execution);
      const updated: CanonicalWorker = {
        ...worker,
        status: "allocated",
        allocated: true,
        updatedAt: stamp,
        realWorkers: this.operational,
        tasksExecuted: this.operational,
        parallelProcessing: false,
        persistenceImplemented: this.operational,
        queueConsumed: this.operational,
      };
      this.store.setWorker(updated);

      if (this.consumer) {
        const queueName = readStringAttr(input, "queueName") ?? DEFAULT_WORKER_QUEUE_NAME;
        const pollIntervalMs = readPositiveInt(
          input.attributes?.pollIntervalMs,
          this.defaultPollIntervalMs,
        );
        this.consumer.start({
          workerId: updated.workerId,
          queueName,
          pollIntervalMs,
          forceNack: readBoolAttr(input, "forceNack"),
        });
      }

      const result = this.buildResult({
        operation: "allocate",
        status: "allocated",
        worker: updated,
        task,
        execution,
        stamp,
        code: this.operational ? "WORKER_RUNTIME_OK" : "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Worker Runtime operational allocate (OPER-INF-W — queue poll started)."
          : "Canonical Worker Runtime structural allocate (INF-06 foundation — no task execution).",
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
      await this.consumer?.stop(input.workerId);
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
        code: this.operational ? "WORKER_RUNTIME_OK" : "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Worker Runtime operational release (OPER-INF-W — graceful shutdown)."
          : "Canonical Worker Runtime structural release (INF-06 foundation — no real release).",
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
      this.consumer?.renewLock(input.workerId);
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
        code: this.operational ? "WORKER_RUNTIME_OK" : "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Worker Runtime operational heartbeat (OPER-INF-W — lock renew)."
          : "Canonical Worker Runtime structural heartbeat (INF-06 foundation — no real liveness).",
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
      const base = this.store.statistics();
      const statistics = this.operational
        ? {
            ...base,
            realWorkersCount: base.allocatedWorkers > 0 || base.totalWorkers > 0 ? 1 : 0,
            tasksExecutedCount: this.tasksExecutedCount,
            parallelProcessingCount: 0,
            schedulerImplementedCount: 0,
            threadPoolImplementedCount: 0,
            persistenceImplementedCount: 1,
            queueConsumedCount: this.queueConsumedCount,
          }
        : base;
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: this.operational ? "WORKER_RUNTIME_OK" : "WORKER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Worker Runtime operational statistics (OPER-INF-W)."
          : "Canonical Worker Runtime structural statistics.",
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

  private onQueueProcessed(event: WorkerQueueProcessedEvent): void {
    if (event.outcome === "ack" || event.outcome === "nack" || event.outcome === "nack-error") {
      this.queueConsumedCount += 1;
    }
    if (event.outcome === "ack") {
      this.tasksExecutedCount += 1;
    }
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
      realWorkers: this.operational,
      tasksExecuted: this.operational,
      parallelProcessing: false,
      schedulerImplemented: false,
      threadPoolImplemented: false,
      persistenceImplemented: this.operational,
      queueConsumed: this.operational,
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

/** Alias oficial do adapter enterprise (INF-06 / OPER-INF-W). */
export const EnterpriseWorkerRuntimeAdapter = DefaultWorkerRuntimeAdapter;
