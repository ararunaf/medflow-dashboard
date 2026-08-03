/**
 * XMLSerializerRuntimeProvider — factory pública do XMLSerializerRuntimePort (TISS-06).
 *
 * Application / TISS Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  XMLSerializerRuntimeFactory,
  createXMLSerializerRuntimeFactory,
} from "../factory/xml-serializer-runtime-factory";
import type { XMLSerializerRuntimePort } from "../ports/xml-serializer-runtime-port";
import type { XMLSerializerRuntimeOptions } from "../ports/types";

let sharedFactory: XMLSerializerRuntimeFactory | undefined;

function getSharedFactory(): XMLSerializerRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createXMLSerializerRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o XMLSerializerRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-06 oficial).
 */
export function createXMLSerializerRuntimePort(
  options: XMLSerializerRuntimeOptions = {},
): XMLSerializerRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getXMLSerializerRuntimeFactory(): XMLSerializerRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-06). */
export const XMLSerializerRuntimeProvider = {
  create: createXMLSerializerRuntimePort,
  getFactory: getXMLSerializerRuntimeFactory,
};
