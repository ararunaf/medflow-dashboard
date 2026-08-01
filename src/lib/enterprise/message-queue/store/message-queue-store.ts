/**
 * MessageQueueStore — contrato interno do store (INF-01).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem publicação. Sem consumo. Sem processamento.
 */
import type { CanonicalQueue, CanonicalQueueMessage } from "../ports/models";

export type StoredCanonicalQueue = {
  queue: CanonicalQueue;
};

export type StoredCanonicalQueueMessage = {
  queueMessage: CanonicalQueueMessage;
  queueId: string;
};

export interface MessageQueueStore {
  readonly storeId: string;
  getQueue(executionMessageQueueId: string): StoredCanonicalQueue | undefined;
  getQueueByExecution(executionId: string): StoredCanonicalQueue | undefined;
  setQueue(stored: StoredCanonicalQueue): void;
  listQueues(): readonly StoredCanonicalQueue[];
  getMessage(messageId: string): StoredCanonicalQueueMessage | undefined;
  setMessage(stored: StoredCanonicalQueueMessage): void;
  listMessages(executionMessageQueueId?: string): readonly StoredCanonicalQueueMessage[];
  queueCount(): number;
  messageCount(): number;
  referenceCount(): number;
  health(): { ok: boolean; message?: string };
}
