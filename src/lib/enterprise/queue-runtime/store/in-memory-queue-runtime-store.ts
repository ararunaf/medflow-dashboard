/**
 * InMemoryQueueRuntimeStore — store in-process (INF-05).
 *
 * Implementação oficial do Queue Runtime Store.
 * Sem banco. Sem Redis. Sem RabbitMQ. Sem Azure. Sem Kafka.
 * Sem workers. Sem scheduler. Sem persistência real.
 */
import type { CanonicalQueueStatistics } from "../ports/canonical";
import type {
  StoredCanonicalQueue,
  StoredCanonicalQueueMessage,
  QueueRuntimeStore,
} from "./queue-runtime-store";

export const IN_MEMORY_QUEUE_RUNTIME_STORE_ID = "in-memory-queue-runtime";

export type InMemoryQueueRuntimeStoreOptions = {
  queues?: readonly StoredCanonicalQueue[];
  messages?: readonly StoredCanonicalQueueMessage[];
};

/**
 * Store de filas/mensagens canônicas in-memory — exclusivo do Adapter (INF-05).
 */
export class InMemoryQueueRuntimeStore implements QueueRuntimeStore {
  readonly storeId = IN_MEMORY_QUEUE_RUNTIME_STORE_ID;

  private readonly queues = new Map<string, StoredCanonicalQueue>();
  private readonly byName = new Map<string, string>();
  private readonly messages = new Map<string, StoredCanonicalQueueMessage>();

  constructor(options: InMemoryQueueRuntimeStoreOptions = {}) {
    for (const queue of options.queues ?? []) {
      this.setQueue(queue);
    }
    for (const message of options.messages ?? []) {
      this.setMessage(message);
    }
  }

  getQueue(queueId: string): StoredCanonicalQueue | undefined {
    const queue = this.queues.get(queueId);
    return queue ? { ...queue, messageIds: [...queue.messageIds] } : undefined;
  }

  getQueueByName(queueName: string): StoredCanonicalQueue | undefined {
    const queueId = this.byName.get(queueName);
    if (!queueId) return undefined;
    return this.getQueue(queueId);
  }

  setQueue(queue: StoredCanonicalQueue): void {
    this.queues.set(queue.queueId, {
      ...queue,
      messageIds: [...queue.messageIds],
    });
    this.byName.set(queue.queueName, queue.queueId);
  }

  listQueues(): readonly StoredCanonicalQueue[] {
    return Array.from(this.queues.values()).map((queue) => ({
      ...queue,
      messageIds: [...queue.messageIds],
    }));
  }

  getMessage(messageId: string): StoredCanonicalQueueMessage | undefined {
    const message = this.messages.get(messageId);
    return message ? { ...message } : undefined;
  }

  setMessage(message: StoredCanonicalQueueMessage): void {
    this.messages.set(message.messageId, { ...message });
  }

  listMessages(queueId?: string): readonly StoredCanonicalQueueMessage[] {
    const all = Array.from(this.messages.values()).map((message) => ({ ...message }));
    if (!queueId) return all;
    return all.filter((message) => message.queueId === queueId);
  }

  removeMessage(messageId: string): void {
    this.messages.delete(messageId);
  }

  removeMessagesByQueue(queueId: string): number {
    let removed = 0;
    for (const [messageId, message] of this.messages.entries()) {
      if (message.queueId === queueId) {
        this.messages.delete(messageId);
        removed += 1;
      }
    }
    return removed;
  }

  queueCount(): number {
    return this.queues.size;
  }

  messageCount(): number {
    return this.messages.size;
  }

  statistics(): CanonicalQueueStatistics {
    const all = this.listMessages();
    let enqueued = 0;
    let dequeued = 0;
    let acked = 0;
    let nacked = 0;
    let purged = 0;
    for (const message of all) {
      if (message.status === "enqueued") enqueued += 1;
      if (message.status === "dequeued") dequeued += 1;
      if (message.status === "acked") acked += 1;
      if (message.status === "nacked") nacked += 1;
      if (message.status === "purged") purged += 1;
    }
    return {
      kind: "canonical-queue-statistics",
      totalQueues: this.queueCount(),
      totalMessages: all.length,
      enqueuedMessages: enqueued,
      dequeuedMessages: dequeued,
      ackedMessages: acked,
      nackedMessages: nacked,
      purgedMessages: purged,
      realQueueBackendCount: 0,
      messagesPublishedCount: 0,
      messagesConsumedCount: 0,
      workersInvokedCount: 0,
      processingPerformedCount: 0,
      persistenceImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Queue Runtime store ready (${this.queueCount()} queues, ${this.messageCount()} messages).`,
    };
  }
}
