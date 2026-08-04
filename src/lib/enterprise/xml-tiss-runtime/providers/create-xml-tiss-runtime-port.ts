/**
 * XMLTISSRuntimeProvider — factory pública do XMLTISSRuntimePort (C-01).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  XMLTISSRuntimeFactory,
  createXMLTISSRuntimeFactory,
} from "../factory/xml-tiss-runtime-factory";
import type { XMLTISSRuntimePort } from "../ports/xml-tiss-runtime-port";
import type { XMLTISSRuntimeOptions } from "../ports/types";

let sharedFactory: XMLTISSRuntimeFactory | undefined;

function getSharedFactory(): XMLTISSRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createXMLTISSRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o XMLTISSRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-01 oficial).
 */
export function createXMLTISSRuntimePort(options: XMLTISSRuntimeOptions = {}): XMLTISSRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getXMLTISSRuntimeFactory(): XMLTISSRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getXMLTISSRuntimePort().
 */
export function getXMLTISSRuntimePort(options: XMLTISSRuntimeOptions = {}): XMLTISSRuntimePort {
  return createXMLTISSRuntimePort(options);
}

/** Alias explícito do Provider (C-01). */
export const XMLTISSRuntimeProvider = {
  create: createXMLTISSRuntimePort,
  get: getXMLTISSRuntimePort,
  getFactory: getXMLTISSRuntimeFactory,
};
