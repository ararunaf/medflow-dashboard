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
  private readonly store: InMemoryRetryStore;
  private readonly defaultPolicy: RetryPolicy;
  private readonly now: () => string;

  constructor(options: DefaultRetryInfrastructureOptions) {
    this.getQueueRuntimePort = options.getQueueRuntimePort;
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

    if (!portShapeOk(queuePort)) {
      return {
        ok: false,
        decision: "rejected",
        code: "RETRY_INFRASTRUCTURE_PORTS_UNAVAILABLE",
        message: "Retry requires QueueRuntimePort (shape).",
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

    // Agendamento de retry (não-exhausted) requer SchedulerRuntimePort + WorkerRuntimePort
    // para tempo/execução — removidos do Enterprise Runtime (F1-S1). Reintroduzido na
    // fila assíncrona real do F1-S4; até lá, apenas o destino Dead Letter acima funciona.
    return {
      ok: false,
      decision: "rejected",
      code: "RETRY_INFRASTRUCTURE_SCHEDULER_UNAVAILABLE",
      message:
        "Retry scheduling requires SchedulerRuntimePort + WorkerRuntimePort, not available until F1-S4 real queue.",
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
