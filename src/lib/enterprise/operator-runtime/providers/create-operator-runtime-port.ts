/**
 * OperatorRuntimeProvider — factory pública do OperatorRuntimePort (C-04).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  OperatorRuntimeFactory,
  createOperatorRuntimeFactory,
} from "../factory/operator-runtime-factory";
import type { OperatorRuntimePort } from "../ports/operator-runtime-port";
import type { OperatorRuntimeOptions } from "../ports/types";

let sharedFactory: OperatorRuntimeFactory | undefined;

function getSharedFactory(): OperatorRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createOperatorRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o OperatorRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-04 oficial).
 */
export function createOperatorRuntimePort(
  options: OperatorRuntimeOptions = {},
): OperatorRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getOperatorRuntimeFactory(): OperatorRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getOperatorRuntimePort().
 */
export function getOperatorRuntimePort(options: OperatorRuntimeOptions = {}): OperatorRuntimePort {
  return createOperatorRuntimePort(options);
}

/** Alias explícito do Provider (C-04). */
export const OperatorRuntimeProvider = {
  create: createOperatorRuntimePort,
  get: getOperatorRuntimePort,
  getFactory: getOperatorRuntimeFactory,
};
