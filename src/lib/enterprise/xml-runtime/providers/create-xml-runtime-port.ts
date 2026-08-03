/**
 * XMLRuntimeProvider — factory pública do XMLRuntimePort (TISS-04).
 *
 * Application / TISS Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { XMLRuntimeFactory, createXMLRuntimeFactory } from "../factory/xml-runtime-factory";
import type { XMLRuntimePort } from "../ports/xml-runtime-port";
import type { XMLRuntimeOptions } from "../ports/types";

let sharedFactory: XMLRuntimeFactory | undefined;

function getSharedFactory(): XMLRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createXMLRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o XMLRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-04 oficial).
 */
export function createXMLRuntimePort(options: XMLRuntimeOptions = {}): XMLRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getXMLRuntimeFactory(): XMLRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-04). */
export const XMLRuntimeProvider = {
  create: createXMLRuntimePort,
  getFactory: getXMLRuntimeFactory,
};
