/**
 * DefaultQueueRuntimeAdapter — INF-05 / OPER-INF-Q / OPER-INF-D / OPER-INF-R.
 *
 * Adapter oficial do Enterprise Queue Runtime.
 * OPER-INF-Q: backend persistente (Supabase preferencial; memory durable fallback).
 * OPER-INF-D: Dead Letter operacional (contrato interno).
 * OPER-INF-R: Retry operacional via SchedulerRuntimePort + WorkerRuntimePort + QueueRuntimePort.
 * Sem RabbitMQ. Sem Azure. Sem Kafka. Sem Redis. Sem processamento por workers neste Port.
 */
import {
  DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES,
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
import { createQueueRuntimeBackend, type QueueRuntimePersistenceBackend } from "../backend";
import {
  DefaultDeadLetterRuntime,
  DefaultRetryInfrastructure,
  ENTERPRISE_DEAD_LETTER_QUEUE_NAME,
  type DeadLetterRuntimePort,
} from "../operational";
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
  /**
   * OPER-INF-Q — backend persistente.
   * Default operacional: createQueueRuntimeBackend().
   * `null` força modo estrutural (mock/test).
   */
  backend?: QueueRuntimePersistenceBackend | null;
  /**
   * OPER-INF-Q — quando true (default), ativa flags/backend operacionais.
   * Mock força false.
   */
  operational?: boolean;
  /**
   * OPER-INF-D — Dead Letter operacional (contrato interno DeadLetterRuntimePort).
   * Default: ativo quando operational=true. `null` desativa.
   */
  deadLetter?: DeadLetterRuntimePort | null;
  /**
   * OPER-INF-R — Retry Infrastructure operacional (NÃO é Port).
   * Default: ativo quando operational=true e enterpriseDeps expõe Scheduler+Worker.
   * `null` desativa.
   */
  retry?: DefaultRetryInfrastructure | null;
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

function isTruthyAttr(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

/** OPER-INF-D — falha permanente explícita (sem decisão de retry). */
function isPermanentFailureNack(input: NackInput): boolean {
  if (isTruthyAttr(input.attributes?.deadLetterIsolation)) {
    return false;
  }
  return (
    isTruthyAttr(input.attributes?.permanentFailure) ||
    isTruthyAttr(input.attributes?.deadLetter) ||
    isTruthyAttr(input.attributes?.permanent)
  );
}

/** OPER-INF-R — nack elegível a retry (não permanente). */
function isRetryCandidateNack(input: NackInput): boolean {
  if (isPermanentFailureNack(input)) return false;
  if (isTruthyAttr(input.attributes?.skipRetry)) return false;
  // Default operacional: todo nack não-permanente é candidato a retry.
  // Opt-out: skipRetry=true. Opt-in explícito também aceito.
  return true;
}

function readFailureReason(input: NackInput, fallback: string): string {
  const fromAttrs =
    input.attributes?.failureReason ?? input.attributes?.reason ?? input.attributes?.error;
  if (typeof fromAttrs === "string" && fromAttrs.trim() !== "") {
    return fromAttrs.trim();
  }
  return fallback;
}

/**
 * Adapter oficial INF-05 / OPER-INF-Q — Queue Runtime default / enterprise.
 */
export class DefaultQueueRuntimeAdapter implements QueueRuntimePort {
  readonly providerId: Extract<QueueRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: QueueRuntimeProviderMetadata;
  private readonly store: QueueRuntimeStore;
  private readonly backend: QueueRuntimePersistenceBackend | null;
  private readonly operational: boolean;
  private readonly deadLetter: DeadLetterRuntimePort | null;
  private readonly retry: DefaultRetryInfrastructure | null;
  private readonly enterpriseDeps?: QueueRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;
  private hydrated = false;

  constructor(options: DefaultQueueRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.operational = options.operational ?? true;
    this.healthy = options.healthy ?? true;
    this.backend =
      options.backend === null
        ? null
        : (options.backend ?? (this.operational ? createQueueRuntimeBackend() : null));
    this.message =
      options.message ??
      (this.operational
        ? `${this.providerId} Queue Runtime ready (OPER-INF-Q/D/R — persistent backend + DeadLetter + Retry active).`
        : `${this.providerId} Queue Runtime ready (structural only — no persistent backend).`);
    this.metadata = {
      name: this.providerId === "default" ? "Default Queue Runtime" : "Enterprise Queue Runtime",
      version: DEFAULT_QUEUE_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official INF-05 Enterprise Queue Runtime — OPER-INF-Q backend + OPER-INF-D DeadLetter + OPER-INF-R Retry via existing Ports.",
    };
    this.store = options.store ?? new InMemoryQueueRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;

    // OPER-INF-D — DeadLetterRuntimePort interno (não é Port Enterprise novo).
    this.deadLetter =
      options.deadLetter === null
        ? null
        : (options.deadLetter ??
          (this.operational
            ? new DefaultDeadLetterRuntime({
                getQueueRuntimePort: () => this,
                now: this.now,
              })
            : null));

    // OPER-INF-R — Retry Infrastructure (NÃO é Port; reutiliza Scheduler + Worker + Queue).
    if (options.retry === null) {
      this.retry = null;
    } else if (options.retry) {
      this.retry = options.retry;
    } else if (this.operational && this.enterpriseDeps) {
      this.retry = new DefaultRetryInfrastructure({
        getQueueRuntimePort: () => this,
        now: this.now,
      });
    } else {
      this.retry = null;
    }
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): QueueRuntimeStore {
    return this.store;
  }

  /** Backend persistente ativo (OPER-INF-Q) — null em modo estrutural. */
  getBackend(): QueueRuntimePersistenceBackend | null {
    return this.backend;
  }

  /**
   * DeadLetterRuntimePort interno (OPER-INF-D) — null em modo estrutural/mock.
   * Não exposto em EnterpriseRuntime (sem Port novo).
   */
  getDeadLetterRuntimePort(): DeadLetterRuntimePort | null {
    return this.deadLetter;
  }

  /**
   * Retry Infrastructure operacional (OPER-INF-R) — null sem Scheduler/Worker deps.
   * NÃO é Port Enterprise. Não exposto em EnterpriseRuntime.
   */
  getRetryInfrastructure(): DefaultRetryInfrastructure | null {
    return this.retry;
  }

  capabilities(): QueueRuntimePortCapabilities {
    const engine = {
      ...(this.operational
        ? DEFAULT_QUEUE_RUNTIME_CAPABILITIES
        : DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES),
      implementsDeadLetter: this.operational && this.deadLetter !== null,
      implementsRetryReal: this.operational && this.retry !== null,
    };
    return {
      provider: this.providerId,
      adapterId: DEFAULT_QUEUE_RUNTIME_ADAPTER_ID,
      engine: { ...engine },
      canonical: toCanonicalQueueCapabilities(engine),
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
      realQueueBackend: this.operational,
      messagesPublished: this.operational,
      messagesConsumed: this.operational,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: this.operational,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsAzureQueue: false,
      implementsRedis: false,
      implementsBullMq: false,
      implementsWorkers: false,
      implementsScheduler: false,
      implementsDeadLetter: this.operational && this.deadLetter !== null,
      implementsRetryReal: this.operational && this.retry !== null,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): QueueRuntimeInfo {
    const caps = this.operational
      ? DEFAULT_QUEUE_RUNTIME_CAPABILITIES
      : DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES;
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "QUEUE_RUNTIME",
      capabilities: { ...caps },
    };
  }

  async health(): Promise<QueueRuntimeHealth> {
    await this.ensureHydrated();
    const storeHealth = this.store.health();
    let backendOk = true;
    let backendMessage: string | undefined;
    if (this.backend) {
      const backendHealth = await this.backend.health();
      backendOk = backendHealth.ok;
      backendMessage = backendHealth.message;
    }
    let workerRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let observabilityRuntimeOk = true;
    let scalabilityRuntimeOk = true;
    if (this.enterpriseDeps) {
      // INF-06 / INF-07 / INF-08 / INF-09 / INF-10: deps preparadas — valida Port sem chamar health()
      // (evita ciclo Queue.health ↔ Worker/Scheduler/PersistentQueue/Observability/Scalability.health).
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort === "function") {
        const persistentQueuePort = this.enterpriseDeps.getPersistentQueueRuntimePort();
        persistentQueueRuntimeOk =
          !!persistentQueuePort &&
          typeof persistentQueuePort.health === "function" &&
          typeof persistentQueuePort.capabilities === "function";
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
      backendOk &&
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
      realQueueBackend: this.operational,
      messagesPublished: this.operational,
      messagesConsumed: this.operational,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: this.operational,
      message: this.healthy
        ? (backendMessage ?? storeHealth.message ?? this.message)
        : "Queue Runtime unhealthy.",
    };
  }

  async enqueue(input: EnqueueInput): Promise<EnqueueResult> {
    return this.runOperation("enqueue", input, async () => {
      await this.ensureHydrated();
      const stamp = this.now();
      const queue = await this.ensureQueue(input.queueId, input.queueName, stamp);
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
        messagesPublished: this.operational,
        messagesConsumed: false,
        workersInvoked: false,
        processingPerformed: false,
        persistenceImplemented: this.operational,
        realQueueBackend: this.operational,
      };
      this.store.setMessage(message);
      await this.backend?.persistMessage(message);
      const updatedQueue = await this.attachMessage(queue, messageId, stamp);
      const result = this.buildResult({
        operation: "enqueue",
        status: "enqueued",
        queue: updatedQueue,
        message,
        stamp,
        code: this.operational ? "QUEUE_RUNTIME_OK" : "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Queue Runtime operational enqueue (OPER-INF-Q — persisted)."
          : "Canonical Queue Runtime structural enqueue (INF-05 foundation — no real publish).",
        messagesPublished: this.operational,
        messagesConsumed: false,
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
      await this.ensureHydrated();
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
        messagesConsumed: this.operational,
        processingPerformed: false,
        realQueueBackend: this.operational,
        persistenceImplemented: this.operational,
      };
      this.store.setMessage(message);
      await this.backend?.persistMessage(message);
      const result = this.buildResult({
        operation: "dequeue",
        status: "dequeued",
        queue,
        message,
        stamp,
        code: this.operational ? "QUEUE_RUNTIME_OK" : "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Queue Runtime operational dequeue (OPER-INF-Q — persisted)."
          : "Canonical Queue Runtime structural dequeue (INF-05 foundation — no real consume).",
        messagesPublished: this.operational,
        messagesConsumed: this.operational,
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
      await this.ensureHydrated();
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
        code: this.operational ? "QUEUE_RUNTIME_OK" : "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Queue Runtime operational peek (OPER-INF-Q)."
          : "Canonical Queue Runtime structural peek (INF-05 foundation — no side-effects).",
        messagesPublished: this.operational,
        messagesConsumed: false,
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
      await this.ensureHydrated();
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
        realQueueBackend: this.operational,
        persistenceImplemented: this.operational,
        messagesConsumed: this.operational,
      };
      this.store.setMessage(message);
      await this.backend?.persistMessage(message);
      const result = this.buildResult({
        operation: "ack",
        status: "acked",
        message,
        stamp,
        code: this.operational ? "QUEUE_RUNTIME_OK" : "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Queue Runtime operational ack (OPER-INF-Q — persisted)."
          : "Canonical Queue Runtime structural ack (INF-05 foundation — no real ack).",
        messagesPublished: this.operational,
        messagesConsumed: this.operational,
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
      await this.ensureHydrated();
      const existing = this.store.getMessage(input.messageId);
      if (!existing) {
        return {
          ok: false,
          code: "QUEUE_RUNTIME_MESSAGE_NOT_FOUND",
          message: "Canonical queue message not found.",
        };
      }

      const stamp = this.now();
      const queue =
        this.resolveQueue(input.queueId, input.queueName) ?? this.store.getQueue(existing.queueId);

      const attemptCount = readPositiveInt(
        input.attributes?.attemptCount ??
          input.attributes?.attempts ??
          existing.metadata?.customAttributes?.attemptCount,
        1,
      );

      // OPER-INF-D — falha permanente explícita → Dead Letter (sem retry).
      const permanentFailure = isPermanentFailureNack(input);
      if (this.operational && this.deadLetter && permanentFailure) {
        return this.parkToDeadLetter({
          existing,
          queue,
          stamp,
          attemptCount,
          failureReason: readFailureReason(input, "permanent-failure"),
          nackQueueName: input.queueName ?? null,
          permanentFailure: true,
        });
      }

      // OPER-INF-R — decisão de reenvio via Retry Infrastructure (Ports existentes).
      if (this.operational && this.retry && isRetryCandidateNack(input)) {
        const failureReason = readFailureReason(input, "transient-failure");
        const maxAttempts = readPositiveInt(
          input.attributes?.maxAttempts ?? existing.metadata?.customAttributes?.maxAttempts,
          this.retry.getDefaultPolicy().maxAttempts,
        );
        const baseDelayMs = readPositiveInt(
          input.attributes?.baseDelayMs ?? input.attributes?.retryDelayMs,
          this.retry.getDefaultPolicy().baseDelayMs,
        );

        const decided = await this.retry.decideAndSchedule({
          sourceMessageId: existing.messageId,
          sourceQueueId: existing.queueId,
          sourceQueueName: queue?.queueName ?? input.queueName,
          attemptCount,
          failureReason,
          policy: { maxAttempts, baseDelayMs },
          payloadRef: existing.payloadRef,
          correlationId: existing.identity?.correlationId ?? null,
          metadata: {
            ...(existing.metadata?.customAttributes ?? {}),
            nackQueueName: input.queueName ?? null,
          },
        });

        if (!decided.ok) {
          return {
            ok: false,
            code: decided.code ?? "QUEUE_RUNTIME_RETRY_FAILED",
            message: decided.message ?? "Retry Infrastructure decision failed.",
          };
        }

        if (decided.decision === "dead-letter") {
          if (!this.deadLetter) {
            return {
              ok: false,
              code: "QUEUE_RUNTIME_DEAD_LETTER_UNAVAILABLE",
              message: "Retry exhausted but DeadLetterRuntimePort is unavailable.",
            };
          }
          return this.parkToDeadLetter({
            existing,
            queue,
            stamp,
            attemptCount,
            failureReason,
            nackQueueName: input.queueName ?? null,
            permanentFailure: false,
            retryExhausted: true,
            retryId: decided.record?.retryId,
          });
        }

        if (decided.decision === "retry-scheduled" && decided.record) {
          // Remove da fila principal — próxima tentativa já foi transportada via enqueue.
          this.store.removeMessage(existing.messageId);
          await this.backend?.removeMessage(existing.messageId);
          if (queue) {
            await this.detachMessage(queue, existing.messageId, stamp);
          }

          const retried: CanonicalQueueMessage = {
            ...existing,
            status: "nacked",
            updatedAt: stamp,
            realQueueBackend: this.operational,
            persistenceImplemented: this.operational,
            metadata: {
              kind: "canonical-queue-metadata",
              ...(existing.metadata ?? {}),
              source: "retry-infrastructure",
              channel: "retry",
              customAttributes: {
                ...(existing.metadata?.customAttributes ?? {}),
                retryId: decided.record.retryId,
                attemptCount: decided.record.attemptCount,
                maxAttempts: decided.record.maxAttempts,
                delayMs: decided.record.delayMs,
                nextAttemptAt: decided.record.nextAttemptAt,
                requeuedMessageId: decided.record.requeuedMessageId ?? null,
                scheduleId: decided.record.scheduleId ?? null,
                retryStatus: decided.record.status,
                failureReason: decided.record.failureReason,
              },
            },
          };

          const result = this.buildResult({
            operation: "nack",
            status: "nacked",
            message: retried,
            stamp,
            code: "QUEUE_RUNTIME_RETRY_SCHEDULED",
            messageText:
              "Canonical Queue Runtime operational retry scheduled (OPER-INF-R — via Scheduler/Worker/Queue Ports).",
            messagesPublished: this.operational,
            messagesConsumed: false,
          });
          return {
            ok: true,
            result,
            queueMessage: retried,
            code: "QUEUE_RUNTIME_RETRY_SCHEDULED",
            message: result.messageText,
          };
        }
      }

      const message: CanonicalQueueMessage = {
        ...existing,
        status: "nacked",
        updatedAt: stamp,
        realQueueBackend: this.operational,
        persistenceImplemented: this.operational,
      };
      this.store.setMessage(message);
      await this.backend?.persistMessage(message);
      const result = this.buildResult({
        operation: "nack",
        status: "nacked",
        message,
        stamp,
        code: this.operational ? "QUEUE_RUNTIME_OK" : "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Queue Runtime operational nack (OPER-INF-Q — persisted)."
          : "Canonical Queue Runtime structural nack (INF-05 foundation — no real nack).",
        messagesPublished: this.operational,
        messagesConsumed: false,
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
      await this.ensureHydrated();
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
      await this.backend?.removeMessagesByQueue(queue.queueId);
      const cleared: CanonicalQueue = {
        ...queue,
        messageIds: [],
        messageCount: 0,
        updatedAt: stamp,
        realQueueBackend: this.operational,
        persistenceImplemented: this.operational,
      };
      this.store.setQueue(cleared);
      await this.backend?.persistQueue(cleared);
      const batch: CanonicalQueueBatch = {
        kind: "canonical-queue-batch",
        batchId: createQueueBatchId(),
        queueId: queue.queueId,
        messageIds: before.map((m) => m.messageId),
        messageCount: purgedCount,
        createdAt: stamp,
        realQueueBackend: this.operational,
        processingPerformed: false,
      };
      const result = this.buildResult({
        operation: "purge",
        status: "purged",
        queue: cleared,
        batch,
        stamp,
        code: this.operational ? "QUEUE_RUNTIME_OK" : "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Queue Runtime operational purge (OPER-INF-Q — persisted)."
          : "Canonical Queue Runtime structural purge (INF-05 foundation — no real purge).",
        messagesPublished: this.operational,
        messagesConsumed: false,
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
      await this.ensureHydrated();
      const base = this.store.statistics();
      const statistics = this.operational
        ? {
            ...base,
            realQueueBackendCount: 1,
            messagesPublishedCount:
              base.enqueuedMessages +
                base.dequeuedMessages +
                base.ackedMessages +
                base.nackedMessages +
                base.purgedMessages >
              0
                ? base.totalMessages
                : 0,
            messagesConsumedCount: base.dequeuedMessages + base.ackedMessages,
            workersInvokedCount: 0,
            processingPerformedCount: 0,
            persistenceImplementedCount: 1,
          }
        : base;
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: this.operational ? "QUEUE_RUNTIME_OK" : "QUEUE_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Queue Runtime operational statistics (OPER-INF-Q)."
          : "Canonical Queue Runtime structural statistics.",
        messagesPublished: this.operational,
        messagesConsumed: this.operational,
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

  private async ensureHydrated(): Promise<void> {
    if (this.hydrated || !this.backend || !this.operational) {
      this.hydrated = true;
      return;
    }
    const queues = await this.backend.loadQueues();
    for (const queue of queues) {
      this.store.setQueue(queue);
    }
    const messages = await this.backend.loadMessages();
    for (const message of messages) {
      this.store.setMessage(message);
    }
    this.hydrated = true;
  }

  private async ensureQueue(
    queueId: string | undefined,
    queueName: string | undefined,
    stamp: string,
  ): Promise<CanonicalQueue> {
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
      realQueueBackend: this.operational,
      messagesPublished: this.operational,
      messagesConsumed: this.operational,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: this.operational,
    };
    created.identity = {
      kind: "canonical-queue-identity",
      queueId: created.queueId,
      queueName: created.queueName,
    };
    this.store.setQueue(created);
    await this.backend?.persistQueue(created);
    return created;
  }

  /**
   * OPER-INF-D — park definitivo via DeadLetterRuntimePort + isolamento da fila principal.
   * Usado por falha permanente explícita e por Retry exhausted (OPER-INF-R).
   */
  private async parkToDeadLetter(args: {
    existing: CanonicalQueueMessage;
    queue: CanonicalQueue | undefined;
    stamp: string;
    attemptCount: number;
    failureReason: string;
    nackQueueName: string | null;
    permanentFailure: boolean;
    retryExhausted?: boolean;
    retryId?: string;
  }): Promise<{
    ok: boolean;
    result?: CanonicalQueueResult;
    queueMessage?: CanonicalQueueMessage;
    code?: string;
    message?: string;
  }> {
    if (!this.deadLetter) {
      return {
        ok: false,
        code: "QUEUE_RUNTIME_DEAD_LETTER_UNAVAILABLE",
        message: "DeadLetterRuntimePort is unavailable.",
      };
    }

    const parked = await this.deadLetter.park({
      sourceMessageId: args.existing.messageId,
      sourceQueueId: args.existing.queueId,
      sourceQueueName: args.queue?.queueName,
      failureReason: args.failureReason,
      attemptCount: args.attemptCount,
      payloadRef: args.existing.payloadRef,
      correlationId: args.existing.identity?.correlationId ?? null,
      metadata: {
        ...(args.existing.metadata?.customAttributes ?? {}),
        nackQueueName: args.nackQueueName,
        retryExhausted: args.retryExhausted === true,
        retryId: args.retryId ?? null,
      },
    });

    if (!parked.ok || !parked.record) {
      return {
        ok: false,
        code: parked.code ?? "QUEUE_RUNTIME_DEAD_LETTER_FAILED",
        message: parked.message ?? "Failed to park message in DeadLetterRuntimePort.",
      };
    }

    this.store.removeMessage(args.existing.messageId);
    await this.backend?.removeMessage(args.existing.messageId);
    if (args.queue) {
      await this.detachMessage(args.queue, args.existing.messageId, args.stamp);
    }

    const deadLettered: CanonicalQueueMessage = {
      ...args.existing,
      status: "dead-lettered",
      updatedAt: args.stamp,
      realQueueBackend: this.operational,
      persistenceImplemented: this.operational,
      identity: {
        kind: "canonical-queue-identity",
        ...(args.existing.identity ?? {}),
        queueId: args.existing.queueId,
        queueName: args.queue?.queueName ?? ENTERPRISE_DEAD_LETTER_QUEUE_NAME,
        messageId: args.existing.messageId,
        correlationId: args.existing.identity?.correlationId ?? null,
      },
      metadata: {
        kind: "canonical-queue-metadata",
        ...(args.existing.metadata ?? {}),
        source: args.retryExhausted ? "retry-infrastructure" : "dead-letter-runtime",
        channel: "dead-letter",
        customAttributes: {
          ...(args.existing.metadata?.customAttributes ?? {}),
          deadLetterId: parked.record.deadLetterId,
          failureReason: parked.record.failureReason,
          attemptCount: parked.record.attemptCount,
          permanentFailure: args.permanentFailure,
          retryExhausted: args.retryExhausted === true,
          retryId: args.retryId ?? null,
        },
      },
    };

    const result = this.buildResult({
      operation: "nack",
      status: "dead-lettered",
      message: deadLettered,
      stamp: args.stamp,
      code: "QUEUE_RUNTIME_DEAD_LETTERED",
      messageText: args.retryExhausted
        ? "Canonical Queue Runtime operational dead-letter after retry exhaustion (OPER-INF-R → OPER-INF-D)."
        : "Canonical Queue Runtime operational dead-letter (OPER-INF-D — via DeadLetterRuntimePort).",
      messagesPublished: this.operational,
      messagesConsumed: false,
    });
    return {
      ok: true,
      result,
      queueMessage: deadLettered,
      code: "QUEUE_RUNTIME_DEAD_LETTERED",
      message: result.messageText,
    };
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

  private async attachMessage(
    queue: CanonicalQueue,
    messageId: string,
    stamp: string,
  ): Promise<CanonicalQueue> {
    const messageIds = queue.messageIds.includes(messageId)
      ? queue.messageIds
      : [...queue.messageIds, messageId];
    const updated: CanonicalQueue = {
      ...queue,
      messageIds,
      messageCount: messageIds.length,
      updatedAt: stamp,
      realQueueBackend: this.operational,
      persistenceImplemented: this.operational,
      messagesPublished: this.operational,
    };
    this.store.setQueue(updated);
    await this.backend?.persistQueue(updated);
    return updated;
  }

  /** OPER-INF-D — remove mensagem da fila principal (isolamento). */
  private async detachMessage(
    queue: CanonicalQueue,
    messageId: string,
    stamp: string,
  ): Promise<CanonicalQueue> {
    const messageIds = queue.messageIds.filter((id) => id !== messageId);
    const updated: CanonicalQueue = {
      ...queue,
      messageIds,
      messageCount: messageIds.length,
      updatedAt: stamp,
      realQueueBackend: this.operational,
      persistenceImplemented: this.operational,
      messagesPublished: this.operational,
    };
    this.store.setQueue(updated);
    await this.backend?.persistQueue(updated);
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
    messagesPublished?: boolean;
    messagesConsumed?: boolean;
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
      realQueueBackend: this.operational,
      messagesPublished: args.messagesPublished ?? this.operational,
      messagesConsumed: args.messagesConsumed ?? false,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: this.operational,
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
