/**
 * XSDRuntimeProvider — factory pública do XSDRuntimePort (TISS-09).
 *
 * Application / TISS Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { XSDRuntimeFactory, createXSDRuntimeFactory } from "../factory/xsd-runtime-factory";
import type { XSDRuntimePort } from "../ports/xsd-runtime-port";
import type { XSDRuntimeOptions } from "../ports/types";

let sharedFactory: XSDRuntimeFactory | undefined;

function getSharedFactory(): XSDRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createXSDRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o XSDRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-09 oficial).
 */
export function createXSDRuntimePort(options: XSDRuntimeOptions = {}): XSDRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getXSDRuntimeFactory(): XSDRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-09). */
export const XSDRuntimeProvider = {
  create: createXSDRuntimePort,
  getFactory: getXSDRuntimeFactory,
};
