/**
 * DefaultMessageQueueAdapter — adapter default in-memory (INF-01).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem RabbitMQ / Redis / Azure Queue / SQS / Pub/Sub / Cloudflare Queues.
 *
 * Representa estruturalmente a infraestrutura de filas.
 * Nenhuma mensagem é publicada. Nenhum consumidor processa. Nenhuma Engine é invocada.
 */
import { createCanonicalQueueMessageId, createExecutionMessageQueueId } from "../ports/identity";
import type { ExecutionQueuePort } from "../ports/execution-queue-port";
import type {
  AcknowledgeInput,
  AcknowledgeResult,
  DequeueInput,
  DequeueResult,
  EnqueueInput,
  EnqueueResult,
  ExecutionQueuePortCapabilities,
  ExecutionQueuePortHealth,
  GetQueueInput,
  GetQueueResult,
  GetStatisticsResult,
  PeekInput,
  PeekResult,
  RejectInput,
  RejectResult,
  RetryInput,
  RetryResult,
} from "../ports/types";
import { InMemoryMessageQueueStore, type MessageQueueStore } from "../store";
import {
  STRUCTURAL_QUEUE_NEGATION_FLAGS,
  appendMessageToQueue,
  buildMessage,
  buildStatistics,
  buildStructuralHealth,
  ensureQueue,
  foundationCapabilitiesBase,
  persistMessage,
  updateMessageStatus,
} from "./queue-helpers";

export const DEFAULT_MESSAGE_QUEUE_ADAPTER_ID = "default-in-process";
export const DEFAULT_MESSAGE_QUEUE_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultMessageQueueRuntime = {
  store?: MessageQueueStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionMessageQueueId?: () => string;
  createMessageId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultMessageQueueRuntime {
  return {
    store: new InMemoryMessageQueueStore(),
  };
}

function nowIso(runtime: DefaultMessageQueueRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultMessageQueueAdapter implements ExecutionQueuePort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultMessageQueueRuntime;
  private readonly store: MessageQueueStore;

  constructor(runtime: DefaultMessageQueueRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new InMemoryMessageQueueStore();
  }

  getStore(): MessageQueueStore {
    return this.store;
  }

  capabilities(): ExecutionQueuePortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_MESSAGE_QUEUE_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionQueuePortHealth> {
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
          (probe.ok ? "Default message-queue probe ok." : "Default message-queue probe falhou."),
        storedQueueCount: this.store.queueCount(),
        storedMessageCount: this.store.messageCount(),
        storedReferenceCount: this.store.referenceCount(),
        structuralHealth: buildStructuralHealth(this.store, stamp, probe.message),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "InMemoryMessageQueueStore pronto (sem I/O externo — INF-01).",
      storedQueueCount: this.store.queueCount(),
      storedMessageCount: this.store.messageCount(),
      storedReferenceCount: this.store.referenceCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async getStatistics(): Promise<GetStatisticsResult> {
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
      createQueueId: this.runtime.createExecutionMessageQueueId ?? createExecutionMessageQueueId,
      createMessageId: this.runtime.createMessageId ?? createCanonicalQueueMessageId,
    };
  }

  async getQueue(input: GetQueueInput = {}): Promise<GetQueueResult> {
    const stamp = nowIso(this.runtime);
    const createIfMissing = input.createIfMissing ?? true;

    if (input.executionMessageQueueId) {
      const existing = this.store.getQueue(input.executionMessageQueueId);
      if (existing) {
        return {
          ok: true,
          queue: existing.queue,
          code: "found",
          message: "queue retrieved structurally",
          ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
        };
      }
      if (!createIfMissing) {
        return {
          ok: false,
          code: "not_found",
          message: "queue not found",
          ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
        };
      }
    }

    if (input.executionId) {
      const byExec = this.store.getQueueByExecution(input.executionId);
      if (byExec) {
        return {
          ok: true,
          queue: byExec.queue,
          code: "found",
          message: "queue retrieved structurally by execution",
          ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
        };
      }
    }

    if (!createIfMissing) {
      return {
        ok: false,
        code: "not_found",
        message: "queue not found and createIfMissing=false",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const queue = ensureQueue(this.store, input, stamp, this.factories());
    return {
      ok: true,
      queue,
      code: "created",
      message:
        "queue created structurally — no publishing, no consumers, no workers, no engines invoked",
      ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
    };
  }

  async enqueue(input: EnqueueInput): Promise<EnqueueResult> {
    if (!input.executionMessageQueueId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionMessageQueueId required",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
    const existing = this.store.getQueue(input.executionMessageQueueId);
    if (!existing) {
      return {
        ok: false,
        code: "not_found",
        message: "queue not found — getQueue first (structural)",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    if (input.messageId && this.store.getMessage(input.messageId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "message already exists",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const queueMessage = buildMessage(input, existing.queue, stamp, this.factories());
    persistMessage(this.store, queueMessage);
    const updatedQueue = appendMessageToQueue(this.store, existing.queue, queueMessage, stamp);

    return {
      ok: true,
      queue: updatedQueue,
      queueMessage,
      code: "enqueued-structural",
      message:
        "message recorded structurally — NOT published, NOT consumed, NO workers, NO engines",
      ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
    };
  }

  async dequeue(input: DequeueInput): Promise<DequeueResult> {
    if (!input.executionMessageQueueId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionMessageQueueId required",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
    const queue = this.store.getQueue(input.executionMessageQueueId)?.queue;
    if (!queue) {
      return {
        ok: false,
        code: "not_found",
        message: "queue not found",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const messages = this.store.listMessages(input.executionMessageQueueId);
    const target =
      (input.messageId
        ? messages.find((m) => m.queueMessage.messageId === input.messageId)
        : messages.find((m) => m.queueMessage.status === "enqueued-structural")) ?? messages[0];

    if (!target) {
      return {
        ok: false,
        code: "empty",
        message: "no structural messages available",
        queue,
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const queueMessage = updateMessageStatus(
      this.store,
      target.queueMessage.messageId,
      "dequeued-structural",
      stamp,
    );

    return {
      ok: true,
      queue,
      queueMessage,
      code: "dequeued-structural",
      message: "message dequeued structurally — NOT consumed, NO processing performed",
      ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
    };
  }

  async peek(input: PeekInput): Promise<PeekResult> {
    if (!input.executionMessageQueueId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionMessageQueueId required",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const queue = this.store.getQueue(input.executionMessageQueueId)?.queue;
    if (!queue) {
      return {
        ok: false,
        code: "not_found",
        message: "queue not found",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const messages = this.store.listMessages(input.executionMessageQueueId);
    const target =
      (input.messageId
        ? messages.find((m) => m.queueMessage.messageId === input.messageId)
        : messages[0]) ?? undefined;

    if (!target) {
      return {
        ok: false,
        code: "empty",
        message: "no structural messages to peek",
        queue,
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    return {
      ok: true,
      queue,
      queueMessage: target.queueMessage,
      code: "peeked-structural",
      message: "message peeked structurally — no side-effects, no processing",
      ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
    };
  }

  async acknowledge(input: AcknowledgeInput): Promise<AcknowledgeResult> {
    return this.transitionMessage(
      input.executionMessageQueueId,
      input.messageId,
      "acknowledged-structural",
    );
  }

  async reject(input: RejectInput): Promise<RejectResult> {
    return this.transitionMessage(
      input.executionMessageQueueId,
      input.messageId,
      "rejected-structural",
    );
  }

  async retry(input: RetryInput): Promise<RetryResult> {
    return this.transitionMessage(
      input.executionMessageQueueId,
      input.messageId,
      "retry-structural",
    );
  }

  private async transitionMessage(
    executionMessageQueueId: string,
    messageId: string,
    status: "acknowledged-structural" | "rejected-structural" | "retry-structural",
  ): Promise<AcknowledgeResult> {
    if (!executionMessageQueueId || !messageId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionMessageQueueId and messageId required",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
    const queue = this.store.getQueue(executionMessageQueueId)?.queue;
    if (!queue) {
      return {
        ok: false,
        code: "not_found",
        message: "queue not found",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const existing = this.store.getMessage(messageId);
    if (!existing || existing.queueId !== executionMessageQueueId) {
      return {
        ok: false,
        code: "not_found",
        message: "message not found in queue",
        queue,
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const queueMessage = updateMessageStatus(this.store, messageId, status, stamp);
    return {
      ok: true,
      queue,
      queueMessage,
      code: status,
      message: `message transitioned structurally to ${status} — NO processing, NO workers, NO engines`,
      ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
    };
  }
}
