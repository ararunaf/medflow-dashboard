/**
 * BatchRuntimeProvider — factory pública do BatchRuntimePort (C-06).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { BatchRuntimeFactory, createBatchRuntimeFactory } from "../factory/batch-runtime-factory";
import type { BatchRuntimePort } from "../ports/batch-runtime-port";
import type { BatchRuntimeOptions } from "../ports/types";

let sharedFactory: BatchRuntimeFactory | undefined;

function getSharedFactory(): BatchRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createBatchRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o BatchRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-06 oficial).
 */
export function createBatchRuntimePort(options: BatchRuntimeOptions = {}): BatchRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getBatchRuntimeFactory(): BatchRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getBatchRuntimePort().
 */
export function getBatchRuntimePort(options: BatchRuntimeOptions = {}): BatchRuntimePort {
  return createBatchRuntimePort(options);
}

/** Alias explícito do Provider (C-06). */
export const BatchRuntimeProvider = {
  create: createBatchRuntimePort,
  get: getBatchRuntimePort,
  getFactory: getBatchRuntimeFactory,
};
