/**
 * WorkerRuntimeProvider — factory pública do WorkerRuntimePort (INF-06).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  WorkerRuntimeFactory,
  createWorkerRuntimeFactory,
} from "../factory/worker-runtime-factory";
import type { WorkerRuntimePort } from "../ports/worker-runtime-port";
import type { WorkerRuntimeOptions } from "../ports/types";

let sharedFactory: WorkerRuntimeFactory | undefined;

function getSharedFactory(): WorkerRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createWorkerRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o WorkerRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (INF-06 oficial).
 */
export function createWorkerRuntimePort(options: WorkerRuntimeOptions = {}): WorkerRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getWorkerRuntimeFactory(): WorkerRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (INF-06). */
export const WorkerRuntimeProvider = {
  create: createWorkerRuntimePort,
  getFactory: getWorkerRuntimeFactory,
};
