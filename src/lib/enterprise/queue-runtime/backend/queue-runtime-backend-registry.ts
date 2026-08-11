/**
 * Registry opcional do backend Queue Runtime (OPER-INF-Q).
 *
 * Permite o composition root server injetar Supabase sem alterar
 * Enterprise Runtime, Ports ou consumidores.
 */
import type { QueueRuntimePersistenceBackend } from "./queue-runtime-persistence-backend";

let injectedBackend: QueueRuntimePersistenceBackend | null = null;

export function injectQueueRuntimeBackend(backend: QueueRuntimePersistenceBackend | null): void {
  injectedBackend = backend;
}

export function getInjectedQueueRuntimeBackend(): QueueRuntimePersistenceBackend | null {
  return injectedBackend;
}
