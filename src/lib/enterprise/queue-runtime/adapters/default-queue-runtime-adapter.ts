/**
 * DefaultQueueRuntimeAdapter — INF-05.
 *
 * Adapter oficial do Enterprise Queue Runtime.
 * Responde exclusivamente de forma estrutural (sem fila real / sem workers).
 * Sem RabbitMQ. Sem Azure. Sem Kafka. Sem Redis. Sem processamento assíncrono.
 */
import {
  DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
  toCanonicalQueueCapabilities,
} from "../ports/capabilities";
import {
  createQueueBatchId,
  createQueueId,
  createQueueMessageId,
  createQueueResultId,
  createQueueRuntimeRequestId,
} from "../ports/identity";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type {
  CanonicalQueue,
  CanonicalQueueBatch,
  CanonicalQueueMessage,
  CanonicalQueueResult,
} from "../ports/canonical";
import type {
  AckInput,
  AckResult,
  DequeueInput,
  DequeueResult,
  EnqueueInput,
  EnqueueResult,
  NackInput,
  NackResult,
  PeekInput,
  PeekResult,
  PurgeInput,
  PurgeResult,
  QueueRuntimeEnterpriseDeps,
  QueueRuntimeHealth,
  QueueRuntimeInfo,
  QueueRuntimeOperationEnvelope,
  QueueRuntimeOperationalControls,
  QueueRuntimePortCapabilities,
  QueueRuntimeProviderId,
  QueueRuntimeProviderMetadata,
  QueueRuntimeStructuredLog,
  StatsInput,
  StatsResult,
} from "../ports/types";
import { InMemoryQueueRuntimeStore, type QueueRuntimeStore } from "../store";

export const DEFAULT_QUEUE_RUNTIME_ADAPTER_ID = "default-enterprise-queue";
export const DEFAULT_QUEUE_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultQueueRuntimeAdapterOptions = {
  provider?: Extract<QueueRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: QueueRuntimeStore;
  /** INF-06 — Worker Runtime preparado (sem alocação/execução). */
  enterpriseDeps?: QueueRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: QueueRuntimeOperationalControls): AbortSignal | undefined {
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
 * Adapter oficial INF-05 — Queue Runtime default / enterprise.
 */
export class DefaultQueueRuntimeAdapter implements QueueRuntimePort {
  readonly providerId: Extract<QueueRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: QueueRuntimeProviderMetadata;
  private readonly store: QueueRuntimeStore;
  private readonly enterpriseDeps?: QueueRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultQueueRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Queue Runtime ready (structural only — no real queue / no workers).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default Queue Runtime" : "Enterprise Queue Runtime",
      version: DEFAULT_QUEUE_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official INF-05 Enterprise Queue Runtime — canonical queue infrastructure only.",
    };
    this.store = options.store ?? new InMemoryQueueRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;

    if (this.enterpriseDeps && typeof this.enterpriseDeps.getWorkerRuntimePort !== "function") {
      throw new Error(
        "DefaultQueueRuntimeAdapter exige enterpriseDeps.getWorkerRuntimePort (INF-06) quando deps são fornecidas.",
      );
    }
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): QueueRuntimeStore {
    return this.store;
  }

  capabilities(): QueueRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_QUEUE_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_QUEUE_RUNTIME_CAPABILITIES },
      canonical: toCanonicalQueueCapabilities(DEFAULT_QUEUE_RUNTIME_CAPABILITIES),
      supportsCanonicalQueue: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      runtimeReady: true,
      realQueueBackend: false,
      messagesPublished: false,
      messagesConsumed: false,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: false,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsAzureQueue: false,
      implementsRedis: false,
      implementsBullMq: false,
      implementsWorkers: false,
      implementsScheduler: false,
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

  providerInfo(): QueueRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "QUEUE_RUNTIME",
      capabilities: { ...DEFAULT_QUEUE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<QueueRuntimeHealth> {
    const storeHealth = this.store.health();
    let workerRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let observabilityRuntimeOk = true;
    let scalabilityRuntimeOk = true;
    if (this.enterpriseDeps) {
      // INF-06 / INF-07 / INF-08 / INF-09 / INF-10: deps preparadas — valida Port sem chamar health()
      // (evita ciclo Queue.health ↔ Worker/Scheduler/PersistentQueue/Observability/Scalability.health).
      const workerPort = this.enterpriseDeps.getWorkerRuntimePort();
      workerRuntimeOk =
        !!workerPort &&
        typeof workerPort.health === "function" &&
        typeof workerPort.capabilities === "function";
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
      workerRuntimeOk &&
      schedulerRuntimeOk &&
      persistentQueueRuntimeOk &&
      observabilityRuntimeOk &&
      scalabilityRuntimeOk;
    return {
      kind: "canonical-queue-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedQueueCount: this.store.queueCount(),
      storedMessageCount: this.store.messageCount(),
      workerRuntimeOk,
      schedulerRuntimeOk,
      persistentQueueRuntimeOk,
      observabilityRuntimeOk,
      scalabilityRuntimeOk,
      runtimeReady: true,
      realQueueBackend: false,
      messagesPublished: false,
      messagesConsumed: false,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: false,
      message: this.healthy ? (storeHealth.message ?? this.message) : "Queue Runtime unhealthy.",
    };
  }

  async enqueue(input: EnqueueInput): Promise<EnqueueResult> {
    return this.runOperation("enqueue", input, async () => {
      const stamp = this.now();
      const queue = this.ensureQueue(input.queueId, input.queueName, stamp);
      const messageId = input.messageId ?? createQueueMessageId();
      const message: CanonicalQueueMessage = {
        kind: "canonical-queue-message",
        messageId,
        queueId: queue.queueId,
        identity: {
          kind: "canonical-queue-identity",
          queueId: queue.queueId,
          queueName: queue.queueName,
          messageId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        payloadRef: input.payloadRef,
        status: "enqueued",
        registeredAt: stamp,
        updatedAt: stamp,
        messagesPublished: false,
        messagesConsumed: false,
        workersInvoked: false,
        processingPerformed: false,
        persistenceImplemented: false,
        realQueueBackend: false,
      };
      this.store.setMessage(message);
      const updatedQueue = this.attachMessage(queue, messageId, stamp);
      const result = this.buildResult({
        operation: "enqueue",
        status: "enqueued",
        queue: updatedQueue,
        message,
        stamp,
        code: "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Queue Runtime structural enqueue (INF-05 foundation — no real publish).",
      });
      return {
        ok: true,
        result,
        queue: updatedQueue,
        queueMessage: message,
        code: "QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async dequeue(input: DequeueInput): Promise<DequeueResult> {
    return this.runOperation("dequeue", input, async () => {
      const stamp = this.now();
      const queue = this.resolveQueue(input.queueId, input.queueName);
      if (!queue) {
        return {
          ok: false,
          code: "QUEUE_RUNTIME_QUEUE_NOT_FOUND",
          message: "Canonical queue not found.",
        };
      }
      const next = this.store.listMessages(queue.queueId).find((m) => m.status === "enqueued");
      if (!next) {
        return {
          ok: false,
          code: "QUEUE_RUNTIME_EMPTY",
          message: "Canonical queue has no enqueued messages.",
          queue,
        };
      }
      const message: CanonicalQueueMessage = {
        ...next,
        status: "dequeued",
        updatedAt: stamp,
        messagesConsumed: false,
        processingPerformed: false,
      };
      this.store.setMessage(message);
      const result = this.buildResult({
        operation: "dequeue",
        status: "dequeued",
        queue,
        message,
        stamp,
        code: "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Queue Runtime structural dequeue (INF-05 foundation — no real consume).",
      });
      return {
        ok: true,
        result,
        queue,
        queueMessage: message,
        code: "QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async peek(input: PeekInput): Promise<PeekResult> {
    return this.runOperation("peek", input, async () => {
      const queue = this.resolveQueue(input.queueId, input.queueName);
      if (!queue) {
        return {
          ok: false,
          code: "QUEUE_RUNTIME_QUEUE_NOT_FOUND",
          message: "Canonical queue not found.",
        };
      }
      const messages = this.store.listMessages(queue.queueId);
      const message = input.messageId
        ? messages.find((m) => m.messageId === input.messageId)
        : (messages.find((m) => m.status === "enqueued") ?? messages[0]);
      if (!message) {
        return {
          ok: false,
          code: "QUEUE_RUNTIME_EMPTY",
          message: "Canonical queue has no messages to peek.",
          queue,
        };
      }
      const stamp = this.now();
      const result = this.buildResult({
        operation: "peek",
        status: message.status,
        queue,
        message,
        stamp,
        code: "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Queue Runtime structural peek (INF-05 foundation — no side-effects).",
      });
      return {
        ok: true,
        result,
        queue,
        queueMessage: message,
        code: "QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async ack(input: AckInput): Promise<AckResult> {
    return this.runOperation("ack", input, async () => {
      const existing = this.store.getMessage(input.messageId);
      if (!existing) {
        return {
          ok: false,
          code: "QUEUE_RUNTIME_MESSAGE_NOT_FOUND",
          message: "Canonical queue message not found.",
        };
      }
      const stamp = this.now();
      const message: CanonicalQueueMessage = {
        ...existing,
        status: "acked",
        updatedAt: stamp,
      };
      this.store.setMessage(message);
      const result = this.buildResult({
        operation: "ack",
        status: "acked",
        message,
        stamp,
        code: "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Queue Runtime structural ack (INF-05 foundation — no real ack).",
      });
      return {
        ok: true,
        result,
        queueMessage: message,
        code: "QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async nack(input: NackInput): Promise<NackResult> {
    return this.runOperation("nack", input, async () => {
      const existing = this.store.getMessage(input.messageId);
      if (!existing) {
        return {
          ok: false,
          code: "QUEUE_RUNTIME_MESSAGE_NOT_FOUND",
          message: "Canonical queue message not found.",
        };
      }
      const stamp = this.now();
      const message: CanonicalQueueMessage = {
        ...existing,
        status: "nacked",
        updatedAt: stamp,
      };
      this.store.setMessage(message);
      const result = this.buildResult({
        operation: "nack",
        status: "nacked",
        message,
        stamp,
        code: "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Queue Runtime structural nack (INF-05 foundation — no real nack).",
      });
      return {
        ok: true,
        result,
        queueMessage: message,
        code: "QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async purge(input: PurgeInput): Promise<PurgeResult> {
    return this.runOperation("purge", input, async () => {
      const queue = this.resolveQueue(input.queueId, input.queueName);
      if (!queue) {
        return {
          ok: false,
          code: "QUEUE_RUNTIME_QUEUE_NOT_FOUND",
          message: "Canonical queue not found.",
        };
      }
      const stamp = this.now();
      const before = this.store.listMessages(queue.queueId);
      const purgedCount = this.store.removeMessagesByQueue(queue.queueId);
      const cleared: CanonicalQueue = {
        ...queue,
        messageIds: [],
        messageCount: 0,
        updatedAt: stamp,
      };
      this.store.setQueue(cleared);
      const batch: CanonicalQueueBatch = {
        kind: "canonical-queue-batch",
        batchId: createQueueBatchId(),
        queueId: queue.queueId,
        messageIds: before.map((m) => m.messageId),
        messageCount: purgedCount,
        createdAt: stamp,
        realQueueBackend: false,
        processingPerformed: false,
      };
      const result = this.buildResult({
        operation: "purge",
        status: "purged",
        queue: cleared,
        batch,
        stamp,
        code: "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Queue Runtime structural purge (INF-05 foundation — no real purge).",
      });
      return {
        ok: true,
        result,
        queue: cleared,
        batch,
        purgedCount,
        code: "QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: StatsInput = {}): Promise<StatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Queue Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "QUEUE_RUNTIME_OK",
        message: `Queue Runtime stats: ${statistics.totalQueues} queues, ${statistics.totalMessages} messages.`,
      };
    });
  }

  private ensureQueue(
    queueId: string | undefined,
    queueName: string | undefined,
    stamp: string,
  ): CanonicalQueue {
    const byId = queueId ? this.store.getQueue(queueId) : undefined;
    if (byId) return byId;
    const name = queueName ?? "canonical-foundation-queue";
    const byName = this.store.getQueueByName(name);
    if (byName) return byName;
    const created: CanonicalQueue = {
      kind: "canonical-queue",
      queueId: queueId ?? createQueueId(),
      queueName: name,
      identity: {
        kind: "canonical-queue-identity",
        queueId: queueId,
        queueName: name,
      },
      messageIds: [],
      messageCount: 0,
      createdAt: stamp,
      updatedAt: stamp,
      realQueueBackend: false,
      messagesPublished: false,
      messagesConsumed: false,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: false,
    };
    created.identity = {
      kind: "canonical-queue-identity",
      queueId: created.queueId,
      queueName: created.queueName,
    };
    this.store.setQueue(created);
    return created;
  }

  private resolveQueue(
    queueId: string | undefined,
    queueName: string | undefined,
  ): CanonicalQueue | undefined {
    if (queueId) {
      const byId = this.store.getQueue(queueId);
      if (byId) return byId;
    }
    if (queueName) return this.store.getQueueByName(queueName);
    const all = this.store.listQueues();
    return all[0];
  }

  private attachMessage(queue: CanonicalQueue, messageId: string, stamp: string): CanonicalQueue {
    const messageIds = queue.messageIds.includes(messageId)
      ? queue.messageIds
      : [...queue.messageIds, messageId];
    const updated: CanonicalQueue = {
      ...queue,
      messageIds,
      messageCount: messageIds.length,
      updatedAt: stamp,
    };
    this.store.setQueue(updated);
    return updated;
  }

  private buildResult(args: {
    operation: CanonicalQueueResult["operation"];
    status: CanonicalQueueResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    queue?: CanonicalQueue;
    message?: CanonicalQueueMessage;
    batch?: CanonicalQueueBatch;
  }): CanonicalQueueResult {
    return {
      kind: "canonical-queue-result",
      ok: true,
      resultId: createQueueResultId(),
      operation: args.operation,
      queue: args.queue,
      message: args.message,
      batch: args.batch,
      provider: {
        kind: "canonical-queue-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_QUEUE_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      realQueueBackend: false,
      messagesPublished: false,
      messagesConsumed: false,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: false,
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
    input: QueueRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & QueueRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createQueueRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: QueueRuntimeStructuredLog[] = [];
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
            code: "QUEUE_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & QueueRuntimeOperationEnvelope;
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
            code: body.code ?? "QUEUE_RUNTIME_OK",
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
            code: "QUEUE_RUNTIME_RETRY",
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
        code: "QUEUE_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & QueueRuntimeOperationEnvelope;
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
          ? "QUEUE_RUNTIME_CANCELLED"
          : isTimeout
            ? "QUEUE_RUNTIME_TIMEOUT"
            : "QUEUE_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & QueueRuntimeOperationEnvelope;
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
              const err = new Error(`Queue Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Queue Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (INF-05). */
export const EnterpriseQueueRuntimeAdapter = DefaultQueueRuntimeAdapter;
