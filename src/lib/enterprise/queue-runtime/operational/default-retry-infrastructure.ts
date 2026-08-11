/**
 * DefaultRetryInfrastructure — motor operacional interno (OPER-INF-R).
 *
 * NÃO é Port Enterprise. NÃO é Gateway. NÃO é Runtime paralelo.
 *
 * Responsabilidade única: decidir reenvio e AGENDAR nova tentativa.
 * Nunca executa processamento.
 *
 * Reutiliza exclusivamente:
 *   - QueueRuntimePort     → transporte (re-enqueue)
 *   - SchedulerRuntimePort → tempo (schedule com delay / backoff)
 *   - WorkerRuntimePort    → executor (somente via Scheduler; shape-check local)
 *
 * Dead Letter permanece destino definitivo após exceder maxAttempts
 * (decisão exhausted — park fica a cargo do Queue adapter via DeadLetterRuntimePort).
 */
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { SchedulerRuntimePort } from "../../scheduler-runtime/ports/scheduler-runtime-port";
import type { WorkerRuntimePort } from "../../worker-runtime/ports/worker-runtime-port";
import { InMemoryRetryStore } from "./in-memory-retry-store";
import {
  computeExponentialBackoffDelayMs,
  resolveRetryPolicy,
  type RetryDecideInput,
  type RetryDecideResult,
  type RetryGetByIdInput,
  type RetryGetByIdResult,
  type RetryPolicy,
  type RetryRecord,
  type RetryStatsResult,
} from "./retry-types";

export type DefaultRetryInfrastructureOptions = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getWorkerRuntimePort: () => WorkerRuntimePort;
  getSchedulerRuntimePort: () => SchedulerRuntimePort;
  store?: InMemoryRetryStore;
  defaultPolicy?: Partial<RetryPolicy>;
  now?: () => string;
};

let retrySeq = 0;

export function createRetryId(prefix = "retry"): string {
  retrySeq += 1;
  return `${prefix}-${retrySeq.toString(36)}`;
}

export function resetRetryIdSequences(): void {
  retrySeq = 0;
}

function portShapeOk(port: unknown): boolean {
  if (!port || typeof port !== "object") return false;
  const p = port as { health?: unknown; capabilities?: unknown };
  return typeof p.health === "function" && typeof p.capabilities === "function";
}

/**
 * Infraestrutura operacional de Retry — decide + agenda; nunca processa.
 */
export class DefaultRetryInfrastructure {
  private readonly getQueueRuntimePort: () => QueueRuntimePort;
  private readonly getWorkerRuntimePort: () => WorkerRuntimePort;
  private readonly getSchedulerRuntimePort: () => SchedulerRuntimePort;
  private readonly store: InMemoryRetryStore;
  private readonly defaultPolicy: RetryPolicy;
  private readonly now: () => string;

  constructor(options: DefaultRetryInfrastructureOptions) {
    this.getQueueRuntimePort = options.getQueueRuntimePort;
    this.getWorkerRuntimePort = options.getWorkerRuntimePort;
    this.getSchedulerRuntimePort = options.getSchedulerRuntimePort;
    this.store = options.store ?? new InMemoryRetryStore();
    this.defaultPolicy = resolveRetryPolicy(options.defaultPolicy);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  /** Store isolado (testes / demo — não produto). */
  getStore(): InMemoryRetryStore {
    return this.store;
  }

  getDefaultPolicy(): RetryPolicy {
    return { ...this.defaultPolicy };
  }

  /**
   * Decide se agenda retry ou esgota para Dead Letter.
   * Retry NUNCA executa — apenas enqueue (transporte) + schedule (tempo).
   * Worker é validado (shape) e referenciado no schedule; execução só via Scheduler → Worker.
   */
  async decideAndSchedule(input: RetryDecideInput): Promise<RetryDecideResult> {
    if (!input.sourceMessageId || input.sourceMessageId.trim() === "") {
      return {
        ok: false,
        decision: "rejected",
        code: "RETRY_INFRASTRUCTURE_INVALID_INPUT",
        message: "sourceMessageId is required.",
      };
    }

    const queuePort = this.getQueueRuntimePort();
    const workerPort = this.getWorkerRuntimePort();
    const schedulerPort = this.getSchedulerRuntimePort();

    if (!portShapeOk(queuePort) || !portShapeOk(workerPort) || !portShapeOk(schedulerPort)) {
      return {
        ok: false,
        decision: "rejected",
        code: "RETRY_INFRASTRUCTURE_PORTS_UNAVAILABLE",
        message:
          "Retry requires QueueRuntimePort + WorkerRuntimePort + SchedulerRuntimePort (shape).",
      };
    }

    // Worker nunca é alocado aqui — somente shape/capabilities (sem execução).
    const workerCaps = workerPort.capabilities();
    if (!workerCaps?.runtimeReady) {
      return {
        ok: false,
        decision: "rejected",
        code: "RETRY_INFRASTRUCTURE_WORKER_NOT_READY",
        message: "WorkerRuntimePort is not ready for scheduled retry execution.",
      };
    }

    const policy = resolveRetryPolicy({
      ...this.defaultPolicy,
      ...(input.policy ?? {}),
    });

    const attemptCount =
      typeof input.attemptCount === "number" &&
      Number.isFinite(input.attemptCount) &&
      input.attemptCount >= 1
        ? Math.floor(input.attemptCount)
        : 1;

    const failureReason =
      typeof input.failureReason === "string" && input.failureReason.trim() !== ""
        ? input.failureReason.trim()
        : "transient-failure";

    const retryId = input.retryId ?? createRetryId();
    const stamp = this.now();

    // maxAttempts esgotado → Dead Letter (destino definitivo; park no adapter).
    if (attemptCount >= policy.maxAttempts) {
      const exhausted: RetryRecord = {
        kind: "canonical-retry-record",
        retryId,
        sourceMessageId: input.sourceMessageId,
        sourceQueueId: input.sourceQueueId,
        sourceQueueName: input.sourceQueueName,
        attemptCount,
        maxAttempts: policy.maxAttempts,
        delayMs: 0,
        status: "exhausted",
        failureReason,
        scheduledAt: stamp,
        nextAttemptAt: stamp,
        metadata: {
          ...(input.metadata ?? {}),
          exhausted: true,
          maxAttempts: policy.maxAttempts,
        },
        payloadRef: input.payloadRef,
        correlationId: input.correlationId ?? null,
      };
      this.store.set(exhausted);
      return {
        ok: true,
        decision: "dead-letter",
        record: exhausted,
        code: "RETRY_INFRASTRUCTURE_EXHAUSTED",
        message: "Retry exhausted (OPER-INF-R) — Dead Letter is the definitive destination.",
      };
    }

    const delayMs = computeExponentialBackoffDelayMs(attemptCount, policy);
    const nextAttemptAt = new Date(Date.parse(stamp) + delayMs).toISOString();
    const queueName = input.sourceQueueName ?? "enterprise-retry-queue";

    // Transporte exclusivo via QueueRuntimePort — requeue da próxima tentativa.
    const enqueued = await queuePort.enqueue({
      queueName,
      payloadRef: input.payloadRef,
      correlationId: input.correlationId,
      metadata: {
        kind: "canonical-queue-metadata",
        source: "retry-infrastructure",
        channel: "retry",
        customAttributes: {
          retryId,
          attemptCount,
          maxAttempts: policy.maxAttempts,
          delayMs,
          failureReason,
          sourceMessageId: input.sourceMessageId,
          nextAttemptAt,
          ...(input.metadata ?? {}),
        },
      },
      attributes: {
        retryScheduled: true,
        attemptCount,
        maxAttempts: policy.maxAttempts,
      },
    });

    if (!enqueued.ok || !enqueued.queueMessage) {
      return {
        ok: false,
        decision: "rejected",
        code: enqueued.code ?? "RETRY_INFRASTRUCTURE_ENQUEUE_FAILED",
        message: enqueued.message ?? "Failed to requeue via QueueRuntimePort.",
      };
    }

    const requeuedMessageId = enqueued.queueMessage.messageId;
    const scheduleName = input.scheduleName ?? `retry-${retryId}`;
    const workerName = input.workerName ?? `retry-worker-${retryId}`;

    // Tempo exclusivo via SchedulerRuntimePort — Worker é acionado só quando due.
    const scheduled = await schedulerPort.schedule({
      scheduleName,
      metadata: {
        kind: "canonical-scheduler-metadata",
        source: "retry-infrastructure",
        channel: "retry",
        customAttributes: {
          retryId,
          attemptCount,
          maxAttempts: policy.maxAttempts,
          delayMs,
          sourceMessageId: input.sourceMessageId,
          requeuedMessageId,
          queueName,
        },
      },
      attributes: {
        delayMs,
        queueName,
        workerName,
        pollIntervalMs: 20,
        repeat: false,
      },
    });

    if (!scheduled.ok) {
      return {
        ok: false,
        decision: "rejected",
        code: scheduled.code ?? "RETRY_INFRASTRUCTURE_SCHEDULE_FAILED",
        message: scheduled.message ?? "Failed to schedule retry via SchedulerRuntimePort.",
      };
    }

    const record: RetryRecord = {
      kind: "canonical-retry-record",
      retryId,
      sourceMessageId: input.sourceMessageId,
      requeuedMessageId,
      sourceQueueId: input.sourceQueueId,
      sourceQueueName: queueName,
      attemptCount,
      maxAttempts: policy.maxAttempts,
      delayMs,
      status: "scheduled",
      failureReason,
      scheduledAt: stamp,
      nextAttemptAt,
      scheduleId: scheduled.schedule?.scheduleId,
      jobId: scheduled.job?.jobId,
      metadata: {
        ...(input.metadata ?? {}),
        workerName,
        scheduleName,
        exponentialBackoff: true,
      },
      payloadRef: input.payloadRef,
      correlationId: input.correlationId ?? null,
    };
    this.store.set(record);

    return {
      ok: true,
      decision: "retry-scheduled",
      record,
      code: "RETRY_INFRASTRUCTURE_SCHEDULED",
      message:
        "Retry scheduled (OPER-INF-R) — Scheduler owns time; Worker executes later; Queue transports.",
    };
  }

  async getById(input: RetryGetByIdInput): Promise<RetryGetByIdResult> {
    const record = this.store.get(input.retryId);
    if (!record) {
      return {
        ok: false,
        code: "RETRY_INFRASTRUCTURE_NOT_FOUND",
        message: "Retry record not found.",
      };
    }
    return {
      ok: true,
      record,
      code: "RETRY_INFRASTRUCTURE_OK",
      message: "Retry record found.",
    };
  }

  async stats(): Promise<RetryStatsResult> {
    return {
      ok: true,
      totalRetries: this.store.count(),
      scheduledRetries: this.store.countByStatus("scheduled"),
      exhaustedRetries: this.store.countByStatus("exhausted"),
      code: "RETRY_INFRASTRUCTURE_OK",
      message: `Retry stats: ${this.store.count()} records.`,
    };
  }
}
