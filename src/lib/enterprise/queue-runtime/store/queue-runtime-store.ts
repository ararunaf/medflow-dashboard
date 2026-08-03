/**
 * QueueRuntimeStore — contrato interno do store (INF-05).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO conecta RabbitMQ/Kafka/Azure/Redis; NÃO invoca workers.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalQueue,
  CanonicalQueueMessage,
  CanonicalQueueStatistics,
} from "../ports/canonical";

export type StoredCanonicalQueue = CanonicalQueue;
export type StoredCanonicalQueueMessage = CanonicalQueueMessage;

export interface QueueRuntimeStore {
  readonly storeId: string;

  getQueue(queueId: string): StoredCanonicalQueue | undefined;
  getQueueByName(queueName: string): StoredCanonicalQueue | undefined;
  setQueue(queue: StoredCanonicalQueue): void;
  listQueues(): readonly StoredCanonicalQueue[];

  getMessage(messageId: string): StoredCanonicalQueueMessage | undefined;
  setMessage(message: StoredCanonicalQueueMessage): void;
  listMessages(queueId?: string): readonly StoredCanonicalQueueMessage[];
  removeMessage(messageId: string): void;
  removeMessagesByQueue(queueId: string): number;

  queueCount(): number;
  messageCount(): number;
  statistics(): CanonicalQueueStatistics;
  health(): { ok: boolean; message?: string };
}
