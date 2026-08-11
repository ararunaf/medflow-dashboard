/**
 * QueueRuntimePersistenceBackend — contrato INTERNO do adapter (OPER-INF-Q).
 *
 * NÃO é Port. NÃO é Gateway. NÃO é Runtime paralelo.
 * Persistência operacional atrás do QueueRuntimePort existente.
 */
import type { CanonicalQueue, CanonicalQueueMessage } from "../ports/canonical";

export type QueueRuntimePersistenceBackendHealth = {
  ok: boolean;
  message?: string;
  /** True quando o backend escreve fora do isolate (ex.: Supabase). */
  durable: boolean;
};

/**
 * Backend de persistência da fila canônica.
 * Consumido exclusivamente por DefaultQueueRuntimeAdapter.
 */
export interface QueueRuntimePersistenceBackend {
  readonly backendId: string;

  isReady(): boolean;
  health(): Promise<QueueRuntimePersistenceBackendHealth>;

  persistQueue(queue: CanonicalQueue): Promise<void>;
  persistMessage(message: CanonicalQueueMessage): Promise<void>;
  removeMessage(messageId: string): Promise<void>;
  removeMessagesByQueue(queueId: string): Promise<number>;

  loadQueues(): Promise<readonly CanonicalQueue[]>;
  loadMessages(queueId?: string): Promise<readonly CanonicalQueueMessage[]>;
}
