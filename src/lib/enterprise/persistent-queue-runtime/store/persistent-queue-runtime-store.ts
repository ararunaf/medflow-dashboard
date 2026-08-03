/**
 * PersistentQueueRuntimeStore — contrato interno do store (INF-08).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO cria timers; NÃO agenda Cron; NÃO despacha Messages.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalPersistentQueue,
  CanonicalPersistentEnvelope,
  CanonicalPersistentMessage,
  CanonicalPersistentQueueStatistics,
} from "../ports/canonical";

export type StoredCanonicalPersistentQueue = CanonicalPersistentQueue;
export type StoredCanonicalPersistentMessage = CanonicalPersistentMessage;
export type StoredCanonicalPersistentEnvelope = CanonicalPersistentEnvelope;

export interface PersistentQueueRuntimeStore {
  readonly storeId: string;

  getQueue(queueId: string): StoredCanonicalPersistentQueue | undefined;
  getQueueByName(queueName: string): StoredCanonicalPersistentQueue | undefined;
  setQueue(queue: StoredCanonicalPersistentQueue): void;
  removeQueue(queueId: string): void;
  listQueues(): readonly StoredCanonicalPersistentQueue[];

  getMessage(messageId: string): StoredCanonicalPersistentMessage | undefined;
  setMessage(message: StoredCanonicalPersistentMessage): void;
  listMessages(queueId?: string): readonly StoredCanonicalPersistentMessage[];

  getEnvelope(envelopeId: string): StoredCanonicalPersistentEnvelope | undefined;
  setEnvelope(envelope: StoredCanonicalPersistentEnvelope): void;
  listEnvelopes(queueId?: string): readonly StoredCanonicalPersistentEnvelope[];

  queueCount(): number;
  messageCount(): number;
  envelopeCount(): number;
  statistics(): CanonicalPersistentQueueStatistics;
  health(): { ok: boolean; message?: string };
}
