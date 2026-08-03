/**
 * DefaultPersistentQueueRuntimeAdapter — INF-08.
 *
 * Adapter oficial do Enterprise Persistent Queue Runtime.
 * Responde exclusivamente de forma estrutural (sem Scheduler real / sem Cron / sem Timer).
 * Sem Retry Scheduling real. Sem Delay Messages. Sem Job Dispatcher. Sem orquestração de Workers.
 */
import {
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
  toCanonicalPersistentQueueCapabilities,
} from "../ports/capabilities";
import {
  createPersistentQueueId,
  createPersistentEnvelopeId,
  createPersistentMessageId,
  createPersistentQueueResultId,
  createPersistentQueueRuntimeRequestId,
} from "../ports/identity";
import type { PersistentQueueRuntimePort } from "../ports/persistent-queue-runtime-port";
import type {
  CanonicalPersistentQueue,
  CanonicalPersistentEnvelope,
  CanonicalPersistentMessage,
  CanonicalPersistentQueueResult,
} from "../ports/canonical";
import type {
  ReleaseMessageInput,
  ReleaseMessageResult,
  ListPersistentQueuesInput,
  ListPersistentQueuesResult,
  RegisterPersistentQueueInput,
  RegisterPersistentQueueResult,
  PersistMessageInput,
  PersistMessageResult,
  PersistentQueueRuntimeEnterpriseDeps,
  PersistentQueueRuntimeHealth,
  PersistentQueueRuntimeInfo,
  PersistentQueueRuntimeOperationEnvelope,
  PersistentQueueRuntimeOperationalControls,
  PersistentQueueRuntimePortCapabilities,
  PersistentQueueRuntimeProviderId,
  PersistentQueueRuntimeProviderMetadata,
  PersistentQueueRuntimeStructuredLog,
  PersistentQueueStatsInput,
  PersistentQueueStatsResult,
  UnregisterPersistentQueueInput,
  UnregisterPersistentQueueResult,
} from "../ports/types";
import { InMemoryPersistentQueueRuntimeStore, type PersistentQueueRuntimeStore } from "../store";

export const DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID = "default-enterprise-persistent-queue";
export const DEFAULT_PERSISTENT_QUEUE_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultPersistentQueueRuntimeAdapterOptions = {
  provider?: Extract<PersistentQueueRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: PersistentQueueRuntimeStore;
  enterpriseDeps?: PersistentQueueRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry estrutural). */
  failAttempts?: number;
};

function readSignal(input: PersistentQueueRuntimeOperationalControls): AbortSignal | undefined {
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

const STRUCTURAL_FLAGS = {
  realPersistentBackend: false,
  rabbitMqImplemented: false,
  kafkaImplemented: false,
  azureServiceBusImplemented: false,
  azureQueueImplemented: false,
  redisStreamsImplemented: false,
  bullMqImplemented: false,
  deadLetterImplemented: false,
  retryQueueImplemented: false,
  delayQueueImplemented: false,
  messagePersistenceImplemented: false,
} as const;

/**
 * Adapter oficial INF-08 — Persistent Queue Runtime default / enterprise.
 */
export class DefaultPersistentQueueRuntimeAdapter implements PersistentQueueRuntimePort {
  readonly providerId: Extract<PersistentQueueRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: PersistentQueueRuntimeProviderMetadata;
  private readonly store: PersistentQueueRuntimeStore;
  private readonly enterpriseDeps?: PersistentQueueRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultPersistentQueueRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Persistent Queue Runtime ready (structural only — no real persistent backend / no RabbitMQ / no Kafka).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Persistent Queue Runtime"
          : "Enterprise Persistent Queue Runtime",
      version: DEFAULT_PERSISTENT_QUEUE_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official INF-08 Enterprise Persistent Queue Runtime — canonical persistent queue infrastructure only.",
    };
    this.store = options.store ?? new InMemoryPersistentQueueRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;

    if (this.enterpriseDeps) {
      if (typeof this.enterpriseDeps.getQueueRuntimePort !== "function") {
        throw new Error(
          "DefaultPersistentQueueRuntimeAdapter exige enterpriseDeps.getQueueRuntimePort (INF-08) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getWorkerRuntimePort !== "function") {
        throw new Error(
          "DefaultPersistentQueueRuntimeAdapter exige enterpriseDeps.getWorkerRuntimePort (INF-08) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getSchedulerRuntimePort !== "function") {
        throw new Error(
          "DefaultPersistentQueueRuntimeAdapter exige enterpriseDeps.getSchedulerRuntimePort (INF-08) quando deps são fornecidas.",
        );
      }
    }
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): PersistentQueueRuntimeStore {
    return this.store;
  }

  capabilities(): PersistentQueueRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES },
      canonical: toCanonicalPersistentQueueCapabilities(
        DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalPersistentQueue: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      runtimeReady: true,
      ...STRUCTURAL_FLAGS,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsAzureQueue: false,
      implementsRedisStreams: false,
      implementsBullMq: false,
      implementsDeadLetter: false,
      implementsRetryQueue: false,
      implementsDelayQueue: false,
      implementsPriorityQueue: false,
      implementsMessagePersistence: false,
      implementsRetryEngine: false,
      implementsRealPersistentBackend: false,
      implementsThreadPool: false,
      implementsWorkers: false,
      implementsParallelProcessing: false,
      implementsRedis: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): PersistentQueueRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "PERSISTENT_QUEUE_RUNTIME",
      capabilities: { ...DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<PersistentQueueRuntimeHealth> {
    const storeHealth = this.store.health();
    let queueRuntimeOk = true;
    let workerRuntimeOk = true;
    let schedulerRuntimeOk = true;
    if (this.enterpriseDeps) {
      // INF-08: deps preparadas — valida Port shape sem chamar health()
      // (evita ciclos PersistentQueue.health ↔ Queue/Worker/Scheduler.health).
      const queuePort = this.enterpriseDeps.getQueueRuntimePort();
      const workerPort = this.enterpriseDeps.getWorkerRuntimePort();
      const schedulerPort = this.enterpriseDeps.getSchedulerRuntimePort();
      queueRuntimeOk =
        !!queuePort &&
        typeof queuePort.health === "function" &&
        typeof queuePort.capabilities === "function";
      workerRuntimeOk =
        !!workerPort &&
        typeof workerPort.health === "function" &&
        typeof workerPort.capabilities === "function";
      schedulerRuntimeOk =
        !!schedulerPort &&
        typeof schedulerPort.health === "function" &&
        typeof schedulerPort.capabilities === "function";
    }
    const ok =
      this.healthy && storeHealth.ok && queueRuntimeOk && workerRuntimeOk && schedulerRuntimeOk;
    return {
      kind: "canonical-persistent-queue-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedQueueCount: this.store.queueCount(),
      storedMessageCount: this.store.messageCount(),
      storedEnvelopeCount: this.store.envelopeCount(),
      queueRuntimeOk,
      workerRuntimeOk,
      schedulerRuntimeOk,
      runtimeReady: true,
      ...STRUCTURAL_FLAGS,
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "Persistent Queue Runtime unhealthy.",
    };
  }

  async register(input: RegisterPersistentQueueInput): Promise<RegisterPersistentQueueResult> {
    return this.runOperation("register", input, async () => {
      const stamp = this.now();
      const queueName = input.queueName ?? "canonical-foundation-persistent-queue";
      const existing = input.queueId
        ? this.store.getQueue(input.queueId)
        : this.store.getQueueByName(queueName);
      if (existing) {
        return {
          ok: false,
          code: "PERSISTENT_QUEUE_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical schedule already registered.",
          queue: existing,
        };
      }
      const queueId = input.queueId ?? createPersistentQueueId();
      const queue: CanonicalPersistentQueue = {
        kind: "canonical-persistent-queue",
        queueId,
        queueName,
        identity: {
          kind: "canonical-persistent-queue-identity",
          queueId,
          queueName,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        status: "registered",
        active: false,
        createdAt: stamp,
        updatedAt: stamp,
        ...STRUCTURAL_FLAGS,
      };
      this.store.setQueue(queue);
      const result = this.buildResult({
        operation: "register",
        status: "registered",
        queue,
        stamp,
        code: "PERSISTENT_QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Persistent Queue Runtime structural register (INF-08 foundation — no real persistent backend).",
      });
      return {
        ok: true,
        result,
        queue,
        code: "PERSISTENT_QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregister(
    input: UnregisterPersistentQueueInput,
  ): Promise<UnregisterPersistentQueueResult> {
    return this.runOperation("unregister", input, async () => {
      const existing = this.store.getQueue(input.queueId);
      if (!existing) {
        return {
          ok: false,
          code: "PERSISTENT_QUEUE_RUNTIME_SCHEDULE_NOT_FOUND",
          message: "Canonical schedule not found.",
        };
      }
      const stamp = this.now();
      const queue: CanonicalPersistentQueue = {
        ...existing,
        status: "unregistered",
        active: false,
        updatedAt: stamp,
      };
      this.store.removeQueue(input.queueId);
      const result = this.buildResult({
        operation: "unregister",
        status: "unregistered",
        queue,
        stamp,
        code: "PERSISTENT_QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Persistent Queue Runtime structural unregister (INF-08 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        queue,
        code: "PERSISTENT_QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async persist(input: PersistMessageInput): Promise<PersistMessageResult> {
    return this.runOperation("persist", input, async () => {
      const stamp = this.now();
      let queue = this.resolveQueue(input.queueId, input.queueName);
      if (!queue) {
        const queueName = input.queueName ?? "canonical-foundation-persistent-queue";
        const queueId = input.queueId ?? createPersistentQueueId();
        queue = {
          kind: "canonical-persistent-queue",
          queueId,
          queueName,
          identity: {
            kind: "canonical-persistent-queue-identity",
            queueId,
            queueName,
          },
          metadata: input.metadata,
          status: "registered",
          active: false,
          createdAt: stamp,
          updatedAt: stamp,
          ...STRUCTURAL_FLAGS,
        };
        this.store.setQueue(queue);
      }
      const messageId = input.messageId ?? createPersistentMessageId();
      const persistentMessage: CanonicalPersistentMessage = {
        kind: "canonical-persistent-message",
        messageId,
        queueId: queue.queueId,
        identity: {
          kind: "canonical-persistent-queue-identity",
          queueId: queue.queueId,
          queueName: queue.queueName,
          messageId,
        },
        metadata: input.metadata,
        status: "persisted",
        registeredAt: stamp,
        updatedAt: stamp,
        realPersistentBackend: false,
        rabbitMqImplemented: false,
        kafkaImplemented: false,
        deadLetterImplemented: false,
        messagePersistenceImplemented: false,
      };
      this.store.setMessage(persistentMessage);
      const envelope: CanonicalPersistentEnvelope = {
        kind: "canonical-persistent-envelope",
        envelopeId: createPersistentEnvelopeId(),
        queueId: queue.queueId,
        messageId,
        identity: {
          kind: "canonical-persistent-queue-identity",
          queueId: queue.queueId,
          messageId,
        },
        metadata: input.metadata,
        status: "persisted",
        createdAt: stamp,
        updatedAt: stamp,
        realPersistentBackend: false,
        rabbitMqImplemented: false,
        redisStreamsImplemented: false,
        deadLetterImplemented: false,
        messagePersistenceImplemented: false,
      };
      this.store.setEnvelope(envelope);
      const updated: CanonicalPersistentQueue = {
        ...queue,
        status: "persisted",
        active: true,
        updatedAt: stamp,
        ...STRUCTURAL_FLAGS,
      };
      this.store.setQueue(updated);
      const result = this.buildResult({
        operation: "persist",
        status: "persisted",
        queue: updated,
        message: persistentMessage,
        envelope,
        stamp,
        code: "PERSISTENT_QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Persistent Queue Runtime structural persist (INF-08 foundation — no RabbitMQ / no Kafka).",
      });
      return {
        ok: true,
        result,
        queue: updated,
        persistentMessage,
        envelope,
        code: "PERSISTENT_QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async release(input: ReleaseMessageInput): Promise<ReleaseMessageResult> {
    return this.runOperation("release", input, async () => {
      const existing = this.store.getQueue(input.queueId);
      if (!existing) {
        return {
          ok: false,
          code: "PERSISTENT_QUEUE_RUNTIME_QUEUE_NOT_FOUND",
          message: "Canonical persistent queue not found.",
        };
      }
      const stamp = this.now();
      const queue: CanonicalPersistentQueue = {
        ...existing,
        status: "released",
        active: false,
        updatedAt: stamp,
      };
      this.store.setQueue(queue);
      let persistentMessage: CanonicalPersistentMessage | undefined;
      if (input.messageId) {
        const existingMessage = this.store.getMessage(input.messageId);
        if (existingMessage) {
          persistentMessage = { ...existingMessage, status: "released", updatedAt: stamp };
          this.store.setMessage(persistentMessage);
        }
      }
      const result = this.buildResult({
        operation: "release",
        status: "released",
        queue,
        message: persistentMessage,
        stamp,
        code: "PERSISTENT_QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Persistent Queue Runtime structural release (INF-08 foundation — no real backend release).",
      });
      return {
        ok: true,
        result,
        queue,
        persistentMessage,
        code: "PERSISTENT_QUEUE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async list(input: ListPersistentQueuesInput = {}): Promise<ListPersistentQueuesResult> {
    return this.runOperation("list", input, async () => {
      let queues = this.store.listQueues();
      if (input.queueId) {
        queues = queues.filter((s) => s.queueId === input.queueId);
      }
      if (input.activeOnly) {
        queues = queues.filter((s) => s.active);
      }
      const messages = input.queueId
        ? this.store.listMessages(input.queueId)
        : this.store.listMessages();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "list",
        status: "listed",
        stamp,
        code: "PERSISTENT_QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Persistent Queue Runtime structural list.",
      });
      return {
        ok: true,
        queues,
        messages,
        result,
        code: "PERSISTENT_QUEUE_RUNTIME_OK",
        message: `Persistent Queue Runtime list: ${queues.length} queues, ${messages.length} messages.`,
      };
    });
  }

  async stats(input: PersistentQueueStatsInput = {}): Promise<PersistentQueueStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "PERSISTENT_QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Persistent Queue Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "PERSISTENT_QUEUE_RUNTIME_OK",
        message: `Persistent Queue Runtime stats: ${statistics.totalQueues} queues, ${statistics.totalMessages} messages.`,
      };
    });
  }

  private resolveQueue(
    queueId: string | undefined,
    queueName: string | undefined,
  ): CanonicalPersistentQueue | undefined {
    if (queueId) {
      const byId = this.store.getQueue(queueId);
      if (byId) return byId;
    }
    if (queueName) return this.store.getQueueByName(queueName);
    const all = this.store.listQueues();
    return all[0];
  }

  private buildResult(args: {
    operation: CanonicalPersistentQueueResult["operation"];
    status: CanonicalPersistentQueueResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    queue?: CanonicalPersistentQueue;
    message?: CanonicalPersistentMessage;
    envelope?: CanonicalPersistentEnvelope;
  }): CanonicalPersistentQueueResult {
    return {
      kind: "canonical-persistent-queue-result",
      ok: true,
      resultId: createPersistentQueueResultId(),
      operation: args.operation,
      queue: args.queue,
      message: args.message,
      envelope: args.envelope,
      provider: {
        kind: "canonical-persistent-queue-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      ...STRUCTURAL_FLAGS,
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
    input: PersistentQueueRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & PersistentQueueRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createPersistentQueueRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: PersistentQueueRuntimeStructuredLog[] = [];
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
            code: "PERSISTENT_QUEUE_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & PersistentQueueRuntimeOperationEnvelope;
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
            code: body.code ?? "PERSISTENT_QUEUE_RUNTIME_OK",
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
            code: "PERSISTENT_QUEUE_RUNTIME_RETRY",
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
        code: "PERSISTENT_QUEUE_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & PersistentQueueRuntimeOperationEnvelope;
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
          ? "PERSISTENT_QUEUE_RUNTIME_CANCELLED"
          : isTimeout
            ? "PERSISTENT_QUEUE_RUNTIME_TIMEOUT"
            : "PERSISTENT_QUEUE_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & PersistentQueueRuntimeOperationEnvelope;
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
              const err = new Error(
                `Persistent Queue Runtime operation timed out after ${timeoutMs}ms`,
              );
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Persistent Queue Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (INF-08). */
export const EnterprisePersistentQueueRuntimeAdapter = DefaultPersistentQueueRuntimeAdapter;
