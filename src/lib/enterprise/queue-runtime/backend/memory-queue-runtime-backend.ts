/**
 * MemoryQueueRuntimeBackend — backend durável in-process (OPER-INF-Q).
 *
 * Usado quando Supabase não está configurado (testes / bootstrap local).
 * Mantém espelho persistente das filas/mensagens para o adapter operacional.
 * Não é RabbitMQ/Kafka/Redis. Não cria Port.
 */
import type { CanonicalQueue, CanonicalQueueMessage } from "../ports/canonical";
import type {
  QueueRuntimePersistenceBackend,
  QueueRuntimePersistenceBackendHealth,
} from "./queue-runtime-persistence-backend";

export const MEMORY_QUEUE_RUNTIME_BACKEND_ID = "memory-durable-queue-runtime";

export type MemoryQueueRuntimeBackendOptions = {
  queues?: readonly CanonicalQueue[];
  messages?: readonly CanonicalQueueMessage[];
};

export class MemoryQueueRuntimeBackend implements QueueRuntimePersistenceBackend {
  readonly backendId = MEMORY_QUEUE_RUNTIME_BACKEND_ID;

  private readonly queues = new Map<string, CanonicalQueue>();
  private readonly messages = new Map<string, CanonicalQueueMessage>();

  constructor(options: MemoryQueueRuntimeBackendOptions = {}) {
    for (const queue of options.queues ?? []) {
      this.queues.set(queue.queueId, {
        ...queue,
        messageIds: [...queue.messageIds],
      });
    }
    for (const message of options.messages ?? []) {
      this.messages.set(message.messageId, { ...message });
    }
  }

  isReady(): boolean {
    return true;
  }

  async health(): Promise<QueueRuntimePersistenceBackendHealth> {
    return {
      ok: true,
      durable: true,
      message: `Memory durable Queue Runtime backend ready (${this.queues.size} queues, ${this.messages.size} messages).`,
    };
  }

  async persistQueue(queue: CanonicalQueue): Promise<void> {
    this.queues.set(queue.queueId, {
      ...queue,
      messageIds: [...queue.messageIds],
    });
  }

  async persistMessage(message: CanonicalQueueMessage): Promise<void> {
    this.messages.set(message.messageId, { ...message });
  }

  async removeMessage(messageId: string): Promise<void> {
    this.messages.delete(messageId);
  }

  async removeMessagesByQueue(queueId: string): Promise<number> {
    let removed = 0;
    for (const [messageId, message] of this.messages.entries()) {
      if (message.queueId === queueId) {
        this.messages.delete(messageId);
        removed += 1;
      }
    }
    return removed;
  }

  async loadQueues(): Promise<readonly CanonicalQueue[]> {
    return Array.from(this.queues.values()).map((queue) => ({
      ...queue,
      messageIds: [...queue.messageIds],
    }));
  }

  async loadMessages(queueId?: string): Promise<readonly CanonicalQueueMessage[]> {
    const all = Array.from(this.messages.values()).map((message) => ({ ...message }));
    if (!queueId) return all;
    return all.filter((message) => message.queueId === queueId);
  }
}
