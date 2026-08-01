/**
 * InMemoryMessageQueueStore — store in-process padrão (INF-01).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem concorrência. Sem processamento.
 */
import type {
  MessageQueueStore,
  StoredCanonicalQueue,
  StoredCanonicalQueueMessage,
} from "./message-queue-store";

export const IN_MEMORY_MESSAGE_QUEUE_STORE_ID = "in-memory-message-queue";

export type InMemoryMessageQueueStoreOptions = {
  queues?: readonly StoredCanonicalQueue[];
  messages?: readonly StoredCanonicalQueueMessage[];
};

export class InMemoryMessageQueueStore implements MessageQueueStore {
  readonly storeId = IN_MEMORY_MESSAGE_QUEUE_STORE_ID;
  private readonly queues = new Map<string, StoredCanonicalQueue>();
  private readonly byExecution = new Map<string, string>();
  private readonly messages = new Map<string, StoredCanonicalQueueMessage>();

  constructor(options: InMemoryMessageQueueStoreOptions = {}) {
    for (const stored of options.queues ?? []) {
      this.setQueue(stored);
    }
    for (const stored of options.messages ?? []) {
      this.setMessage(stored);
    }
  }

  getQueue(executionMessageQueueId: string): StoredCanonicalQueue | undefined {
    return this.queues.get(executionMessageQueueId);
  }

  getQueueByExecution(executionId: string): StoredCanonicalQueue | undefined {
    const queueId = this.byExecution.get(executionId);
    if (!queueId) return undefined;
    return this.queues.get(queueId);
  }

  setQueue(stored: StoredCanonicalQueue): void {
    this.queues.set(stored.queue.executionMessageQueueId, stored);
    if (stored.queue.executionId) {
      this.byExecution.set(stored.queue.executionId, stored.queue.executionMessageQueueId);
    }
  }

  listQueues(): readonly StoredCanonicalQueue[] {
    return [...this.queues.values()];
  }

  getMessage(messageId: string): StoredCanonicalQueueMessage | undefined {
    return this.messages.get(messageId);
  }

  setMessage(stored: StoredCanonicalQueueMessage): void {
    this.messages.set(stored.queueMessage.messageId, stored);
  }

  listMessages(executionMessageQueueId?: string): readonly StoredCanonicalQueueMessage[] {
    const all = [...this.messages.values()];
    if (!executionMessageQueueId) return all;
    return all.filter((s) => s.queueId === executionMessageQueueId);
  }

  queueCount(): number {
    return this.queues.size;
  }

  messageCount(): number {
    return this.messages.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.queues.values()) {
      total += stored.queue.references.length;
    }
    for (const stored of this.messages.values()) {
      total += stored.queueMessage.references.length;
    }
    return total;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `InMemoryMessageQueueStore ready (${this.queues.size} queues, ${this.messages.size} messages).`,
    };
  }
}
