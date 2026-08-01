/**
 * MockMessageQueueAdapter — INF-01 Message Queue Foundation.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem RabbitMQ / Redis / Azure Queue / SQS / Pub/Sub / Cloudflare Queues.
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
  MessageQueueProviderId,
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

export const MOCK_MESSAGE_QUEUE_ADAPTER_ID = "mock-in-memory";
export const MOCK_MESSAGE_QUEUE_VERSION = "1.0.0";

export type MockMessageQueueAdapterOptions = {
  provider?: Extract<MessageQueueProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: MessageQueueStore;
  createExecutionMessageQueueId?: () => string;
  createMessageId?: () => string;
  now?: () => string;
};

export class MockMessageQueueAdapter implements ExecutionQueuePort {
  readonly providerId: Extract<MessageQueueProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: MessageQueueStore;
  private readonly createQueueIdFn: () => string;
  private readonly createMessageIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockMessageQueueAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} message-queue ready.`;
    this.store = options.store ?? new InMemoryMessageQueueStore();
    this.createQueueIdFn = options.createExecutionMessageQueueId ?? createExecutionMessageQueueId;
    this.createMessageIdFn = options.createMessageId ?? createCanonicalQueueMessageId;
    this.now = options.now;
  }

  getStore(): MessageQueueStore {
    return this.store;
  }

  capabilities(): ExecutionQueuePortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionQueuePortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedQueueCount: this.store.queueCount(),
      storedMessageCount: this.store.messageCount(),
      storedReferenceCount: this.store.referenceCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private factories() {
    return {
      createQueueId: this.createQueueIdFn,
      createMessageId: this.createMessageIdFn,
    };
  }

  private unhealthyResult<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async getStatistics(): Promise<GetStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<GetStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async getQueue(input: GetQueueInput = {}): Promise<GetQueueResult> {
    if (!this.healthy) {
      return this.unhealthyResult<GetQueueResult>({
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      });
    }

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return this.unhealthyResult<EnqueueResult>({
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      });
    }

    if (!input.executionMessageQueueId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionMessageQueueId required",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return this.unhealthyResult<DequeueResult>({
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      });
    }

    if (!input.executionMessageQueueId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionMessageQueueId required",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return this.unhealthyResult<PeekResult>({
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      });
    }

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
    if (!this.healthy) {
      return this.unhealthyResult<AcknowledgeResult>({
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      });
    }

    if (!executionMessageQueueId || !messageId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionMessageQueueId and messageId required",
        ...STRUCTURAL_QUEUE_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
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
