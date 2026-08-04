/**
 * SOAPRuntimeProvider — factory pública do SOAPRuntimePort (C-03).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { SOAPRuntimeFactory, createSOAPRuntimeFactory } from "../factory/soap-runtime-factory";
import type { SOAPRuntimePort } from "../ports/soap-runtime-port";
import type { SOAPRuntimeOptions } from "../ports/types";

let sharedFactory: SOAPRuntimeFactory | undefined;

function getSharedFactory(): SOAPRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createSOAPRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o SOAPRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-03 oficial).
 */
export function createSOAPRuntimePort(options: SOAPRuntimeOptions = {}): SOAPRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getSOAPRuntimeFactory(): SOAPRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getSOAPRuntimePort().
 */
export function getSOAPRuntimePort(options: SOAPRuntimeOptions = {}): SOAPRuntimePort {
  return createSOAPRuntimePort(options);
}

/** Alias explícito do Provider (C-03). */
export const SOAPRuntimeProvider = {
  create: createSOAPRuntimePort,
  get: getSOAPRuntimePort,
  getFactory: getSOAPRuntimeFactory,
};
