/**
 * DefaultDeadLetterRuntime — motor operacional interno (OPER-INF-D).
 *
 * Implementa DeadLetterRuntimePort reutilizando exclusivamente QueueRuntimePort
 * para isolamento da fila principal (enqueue/purge na fila enterprise-dead-letter).
 *
 * Sem retry. Sem reprocessamento. Sem scheduler. Sem worker. Sem DB direto.
 */
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { DeadLetterRuntimePort } from "./dead-letter-runtime-port";
import {
  ENTERPRISE_DEAD_LETTER_QUEUE_NAME,
  type DeadLetterGetByIdInput,
  type DeadLetterGetByIdResult,
  type DeadLetterParkInput,
  type DeadLetterParkResult,
  type DeadLetterPurgeInput,
  type DeadLetterPurgeResult,
  type DeadLetterRecord,
  type DeadLetterStatsResult,
} from "./dead-letter-types";
import { InMemoryDeadLetterStore } from "./in-memory-dead-letter-store";

export type DefaultDeadLetterRuntimeOptions = {
  getQueueRuntimePort: () => QueueRuntimePort;
  store?: InMemoryDeadLetterStore;
  now?: () => string;
};

let deadLetterSeq = 0;

export function createDeadLetterId(prefix = "dead-letter"): string {
  deadLetterSeq += 1;
  return `${prefix}-${deadLetterSeq.toString(36)}`;
}

export function resetDeadLetterIdSequences(): void {
  deadLetterSeq = 0;
}

/**
 * Runtime operacional da Dead Letter Queue — responsabilidade única: armazenamento definitivo.
 */
export class DefaultDeadLetterRuntime implements DeadLetterRuntimePort {
  private readonly getQueueRuntimePort: () => QueueRuntimePort;
  private readonly store: InMemoryDeadLetterStore;
  private readonly now: () => string;

  constructor(options: DefaultDeadLetterRuntimeOptions) {
    this.getQueueRuntimePort = options.getQueueRuntimePort;
    this.store = options.store ?? new InMemoryDeadLetterStore();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  /** Store isolado (testes / demo — não produto). */
  getStore(): InMemoryDeadLetterStore {
    return this.store;
  }

  async park(input: DeadLetterParkInput): Promise<DeadLetterParkResult> {
    if (!input.sourceMessageId || input.sourceMessageId.trim() === "") {
      return {
        ok: false,
        code: "DEAD_LETTER_RUNTIME_INVALID_INPUT",
        message: "sourceMessageId is required.",
      };
    }
    const failureReason =
      typeof input.failureReason === "string" && input.failureReason.trim() !== ""
        ? input.failureReason.trim()
        : "permanent-failure";
    const attemptCount =
      typeof input.attemptCount === "number" &&
      Number.isFinite(input.attemptCount) &&
      input.attemptCount >= 0
        ? Math.floor(input.attemptCount)
        : 1;

    const deadLetterId = input.deadLetterId ?? createDeadLetterId();
    const parkedAt = this.now();
    const record: DeadLetterRecord = {
      kind: "canonical-dead-letter-record",
      deadLetterId,
      sourceMessageId: input.sourceMessageId,
      sourceQueueId: input.sourceQueueId,
      sourceQueueName: input.sourceQueueName,
      failureReason,
      attemptCount,
      parkedAt,
      metadata: { ...(input.metadata ?? {}) },
      payloadRef: input.payloadRef,
      correlationId: input.correlationId ?? null,
    };

    // Armazenamento definitivo isolado da fila principal.
    this.store.set(record);

    // Isolamento via QueueRuntimePort — fila dedicada enterprise-dead-letter.
    const queue = this.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_DEAD_LETTER_QUEUE_NAME,
      messageId: deadLetterId,
      payloadRef: input.payloadRef,
      correlationId: input.correlationId,
      metadata: {
        kind: "canonical-queue-metadata",
        source: "dead-letter-runtime",
        channel: "dead-letter",
        customAttributes: {
          failureReason,
          attemptCount,
          sourceMessageId: input.sourceMessageId,
          sourceQueueName: input.sourceQueueName ?? null,
          permanentFailure: true,
        },
      },
      attributes: {
        deadLetterIsolation: true,
      },
    });

    if (!enqueued.ok) {
      this.store.remove(deadLetterId);
      return {
        ok: false,
        code: enqueued.code ?? "DEAD_LETTER_RUNTIME_ISOLATION_FAILED",
        message: enqueued.message ?? "Failed to isolate dead letter via QueueRuntimePort.",
      };
    }

    return {
      ok: true,
      record,
      code: "DEAD_LETTER_RUNTIME_OK",
      message: "Dead letter parked (OPER-INF-D — permanent failure storage only).",
    };
  }

  async getById(input: DeadLetterGetByIdInput): Promise<DeadLetterGetByIdResult> {
    const record = this.store.get(input.deadLetterId);
    if (!record) {
      return {
        ok: false,
        code: "DEAD_LETTER_RUNTIME_NOT_FOUND",
        message: "Dead letter record not found.",
      };
    }
    return {
      ok: true,
      record,
      code: "DEAD_LETTER_RUNTIME_OK",
      message: "Dead letter record found.",
    };
  }

  async purge(input: DeadLetterPurgeInput = {}): Promise<DeadLetterPurgeResult> {
    if (typeof input.deadLetterId === "string" && input.deadLetterId.trim() !== "") {
      const removed = this.store.remove(input.deadLetterId);
      return {
        ok: true,
        purgedCount: removed ? 1 : 0,
        code: "DEAD_LETTER_RUNTIME_OK",
        message: removed
          ? "Dead letter record purged."
          : "Dead letter record not found (noop purge).",
      };
    }

    const purgedCount = this.store.clear();

    // Purge da fila isolada via QueueRuntimePort (sem acesso direto a store/backend).
    const queue = this.getQueueRuntimePort();
    const existing = await queue.stats({ queueName: ENTERPRISE_DEAD_LETTER_QUEUE_NAME });
    if (existing.ok) {
      await queue.purge({ queueName: ENTERPRISE_DEAD_LETTER_QUEUE_NAME });
    }

    return {
      ok: true,
      purgedCount,
      code: "DEAD_LETTER_RUNTIME_OK",
      message: "Dead letter queue purged.",
    };
  }

  async stats(): Promise<DeadLetterStatsResult> {
    return {
      ok: true,
      totalDeadLetters: this.store.count(),
      code: "DEAD_LETTER_RUNTIME_OK",
      message: `Dead letter stats: ${this.store.count()} records.`,
    };
  }
}
