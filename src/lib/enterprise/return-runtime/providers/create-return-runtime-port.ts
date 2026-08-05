/**
 * ReturnRuntimeProvider — factory pública do ReturnRuntimePort (C-08).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  ReturnRuntimeFactory,
  createReturnRuntimeFactory,
} from "../factory/return-runtime-factory";
import type { ReturnRuntimePort } from "../ports/return-runtime-port";
import type { ReturnRuntimeOptions } from "../ports/types";

let sharedFactory: ReturnRuntimeFactory | undefined;

function getSharedFactory(): ReturnRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createReturnRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o ReturnRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-08 oficial).
 */
export function createReturnRuntimePort(options: ReturnRuntimeOptions = {}): ReturnRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getReturnRuntimeFactory(): ReturnRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getReturnRuntimePort().
 */
export function getReturnRuntimePort(options: ReturnRuntimeOptions = {}): ReturnRuntimePort {
  return createReturnRuntimePort(options);
}

/** Alias explícito do Provider (C-08). */
export const ReturnRuntimeProvider = {
  create: createReturnRuntimePort,
  get: getReturnRuntimePort,
  getFactory: getReturnRuntimeFactory,
};
