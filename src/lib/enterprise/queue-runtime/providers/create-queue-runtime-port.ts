/**
 * QueueRuntimeProvider — factory pública do QueueRuntimePort (INF-05).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { QueueRuntimeFactory, createQueueRuntimeFactory } from "../factory/queue-runtime-factory";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { QueueRuntimeOptions } from "../ports/types";

let sharedFactory: QueueRuntimeFactory | undefined;

function getSharedFactory(): QueueRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createQueueRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o QueueRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (INF-05 oficial).
 */
export function createQueueRuntimePort(options: QueueRuntimeOptions = {}): QueueRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getQueueRuntimeFactory(): QueueRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (INF-05). */
export const QueueRuntimeProvider = {
  create: createQueueRuntimePort,
  getFactory: getQueueRuntimeFactory,
};
