/**
 * CompletedRuntimeProvider — factory pública do CompletedRuntimePort (A10-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  CompletedRuntimeFactory,
  createCompletedRuntimeFactory,
} from "../factory/completed-runtime-factory";
import type { CompletedRuntimePort } from "../ports/completed-runtime-port";
import type { CompletedRuntimeOptions } from "../ports/types";

let sharedFactory: CompletedRuntimeFactory | undefined;

function getSharedFactory(): CompletedRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createCompletedRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o CompletedRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (A10-02 oficial).
 */
export function createCompletedRuntimePort(
  options: CompletedRuntimeOptions = {},
): CompletedRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getCompletedRuntimeFactory(): CompletedRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getCompletedRuntimePort().
 */
export function getCompletedRuntimePort(
  options: CompletedRuntimeOptions = {},
): CompletedRuntimePort {
  return createCompletedRuntimePort(options);
}

/** Alias explícito do Provider (A10-02). */
export const CompletedRuntimeProvider = {
  create: createCompletedRuntimePort,
  get: getCompletedRuntimePort,
  getFactory: getCompletedRuntimeFactory,
};
