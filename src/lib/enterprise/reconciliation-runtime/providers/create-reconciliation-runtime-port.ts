/**
 * ReconciliationRuntimeProvider — factory pública do ReconciliationRuntimePort (C-09).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  ReconciliationRuntimeFactory,
  createReconciliationRuntimeFactory,
} from "../factory/reconciliation-runtime-factory";
import type { ReconciliationRuntimePort } from "../ports/reconciliation-runtime-port";
import type { ReconciliationRuntimeOptions } from "../ports/types";

let sharedFactory: ReconciliationRuntimeFactory | undefined;

function getSharedFactory(): ReconciliationRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createReconciliationRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o ReconciliationRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-09 oficial).
 */
export function createReconciliationRuntimePort(
  options: ReconciliationRuntimeOptions = {},
): ReconciliationRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getReconciliationRuntimeFactory(): ReconciliationRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getReconciliationRuntimePort().
 */
export function getReconciliationRuntimePort(
  options: ReconciliationRuntimeOptions = {},
): ReconciliationRuntimePort {
  return createReconciliationRuntimePort(options);
}

/** Alias explícito do Provider (C-09). */
export const ReconciliationRuntimeProvider = {
  create: createReconciliationRuntimePort,
  get: getReconciliationRuntimePort,
  getFactory: getReconciliationRuntimeFactory,
};
