/**
 * PersistentQueueRuntimeProvider — factory pública do PersistentQueueRuntimePort (INF-08).
 */
import {
  PersistentQueueRuntimeFactory,
  createPersistentQueueRuntimeFactory,
} from "../factory/persistent-queue-runtime-factory";
import type { PersistentQueueRuntimePort } from "../ports/persistent-queue-runtime-port";
import type { PersistentQueueRuntimeOptions } from "../ports/types";

let sharedFactory: PersistentQueueRuntimeFactory | undefined;

function getSharedFactory(): PersistentQueueRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createPersistentQueueRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o PersistentQueueRuntimePort para o provedor solicitado.
 * Default da fundação: `enterprise` (INF-08).
 */
export function createPersistentQueueRuntimePort(
  options: PersistentQueueRuntimeOptions = {},
): PersistentQueueRuntimePort {
  return getSharedFactory().create(options);
}

export function getPersistentQueueRuntimeFactory(): PersistentQueueRuntimeFactory {
  return getSharedFactory();
}

export const PersistentQueueRuntimeProvider = {
  create: createPersistentQueueRuntimePort,
  getFactory: getPersistentQueueRuntimeFactory,
};
