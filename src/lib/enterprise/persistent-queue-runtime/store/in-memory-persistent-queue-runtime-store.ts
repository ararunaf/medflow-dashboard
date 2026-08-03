/**
 * InMemoryPersistentQueueRuntimeStore — store in-process (INF-08).
 *
 * Implementação oficial do Persistent Queue Runtime Store.
 * Sem banco. Sem Redis. Sem RabbitMQ/Kafka/Azure/BullMQ. Sem persistência real.
 */
import type { CanonicalPersistentQueueStatistics } from "../ports/canonical";
import type {
  PersistentQueueRuntimeStore,
  StoredCanonicalPersistentEnvelope,
  StoredCanonicalPersistentMessage,
  StoredCanonicalPersistentQueue,
} from "./persistent-queue-runtime-store";

export const IN_MEMORY_PERSISTENT_QUEUE_RUNTIME_STORE_ID = "in-memory-persistent-queue-runtime";

export type InMemoryPersistentQueueRuntimeStoreOptions = {
  queues?: readonly StoredCanonicalPersistentQueue[];
  messages?: readonly StoredCanonicalPersistentMessage[];
  envelopes?: readonly StoredCanonicalPersistentEnvelope[];
};

/**
 * Store de PersistentQueues/Messages/Envelopes canônicos in-memory — exclusivo do Adapter (INF-08).
 */
export class InMemoryPersistentQueueRuntimeStore implements PersistentQueueRuntimeStore {
  readonly storeId = IN_MEMORY_PERSISTENT_QUEUE_RUNTIME_STORE_ID;

  private readonly queues = new Map<string, StoredCanonicalPersistentQueue>();
  private readonly byName = new Map<string, string>();
  private readonly messages = new Map<string, StoredCanonicalPersistentMessage>();
  private readonly envelopes = new Map<string, StoredCanonicalPersistentEnvelope>();

  constructor(options: InMemoryPersistentQueueRuntimeStoreOptions = {}) {
    for (const queue of options.queues ?? []) {
      this.setQueue(queue);
    }
    for (const message of options.messages ?? []) {
      this.setMessage(message);
    }
    for (const envelope of options.envelopes ?? []) {
      this.setEnvelope(envelope);
    }
  }

  getQueue(queueId: string): StoredCanonicalPersistentQueue | undefined {
    const queue = this.queues.get(queueId);
    return queue ? { ...queue } : undefined;
  }

  getQueueByName(queueName: string): StoredCanonicalPersistentQueue | undefined {
    const queueId = this.byName.get(queueName);
    if (!queueId) return undefined;
    return this.getQueue(queueId);
  }

  setQueue(queue: StoredCanonicalPersistentQueue): void {
    this.queues.set(queue.queueId, { ...queue });
    this.byName.set(queue.queueName, queue.queueId);
  }

  removeQueue(queueId: string): void {
    const existing = this.queues.get(queueId);
    if (existing) {
      this.byName.delete(existing.queueName);
      this.queues.delete(queueId);
    }
  }

  listQueues(): readonly StoredCanonicalPersistentQueue[] {
    return Array.from(this.queues.values()).map((queue) => ({ ...queue }));
  }

  getMessage(messageId: string): StoredCanonicalPersistentMessage | undefined {
    const message = this.messages.get(messageId);
    return message ? { ...message } : undefined;
  }

  setMessage(message: StoredCanonicalPersistentMessage): void {
    this.messages.set(message.messageId, { ...message });
  }

  listMessages(queueId?: string): readonly StoredCanonicalPersistentMessage[] {
    const all = Array.from(this.messages.values()).map((message) => ({ ...message }));
    if (!queueId) return all;
    return all.filter((message) => message.queueId === queueId);
  }

  getEnvelope(envelopeId: string): StoredCanonicalPersistentEnvelope | undefined {
    const envelope = this.envelopes.get(envelopeId);
    return envelope ? { ...envelope } : undefined;
  }

  setEnvelope(envelope: StoredCanonicalPersistentEnvelope): void {
    this.envelopes.set(envelope.envelopeId, { ...envelope });
  }

  listEnvelopes(queueId?: string): readonly StoredCanonicalPersistentEnvelope[] {
    const all = Array.from(this.envelopes.values()).map((envelope) => ({ ...envelope }));
    if (!queueId) return all;
    return all.filter((envelope) => envelope.queueId === queueId);
  }

  queueCount(): number {
    return this.queues.size;
  }

  messageCount(): number {
    return this.messages.size;
  }

  envelopeCount(): number {
    return this.envelopes.size;
  }

  statistics(): CanonicalPersistentQueueStatistics {
    const all = this.listQueues();
    let registered = 0;
    let active = 0;
    let released = 0;
    for (const queue of all) {
      if (queue.status === "registered" || queue.status === "idle") registered += 1;
      if (queue.active || queue.status === "persisted") active += 1;
      if (queue.status === "released") released += 1;
    }
    return {
      kind: "canonical-persistent-queue-statistics",
      totalQueues: all.length,
      registeredQueues: registered,
      activeQueues: active,
      releasedQueues: released,
      totalMessages: this.messageCount(),
      totalEnvelopes: this.envelopeCount(),
      realPersistentBackendCount: 0,
      rabbitMqImplementedCount: 0,
      kafkaImplementedCount: 0,
      azureServiceBusImplementedCount: 0,
      azureQueueImplementedCount: 0,
      redisStreamsImplementedCount: 0,
      bullMqImplementedCount: 0,
      deadLetterImplementedCount: 0,
      retryQueueImplementedCount: 0,
      delayQueueImplementedCount: 0,
      messagePersistenceImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Persistent Queue Runtime store ready (${this.queueCount()} queues, ${this.messageCount()} messages, ${this.envelopeCount()} envelopes).`,
    };
  }
}
