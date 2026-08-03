/**
 * XMLGenerationRuntimeProvider — factory pública do XMLGenerationRuntimePort (TISS-05).
 *
 * Application / XML Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  XMLGenerationRuntimeFactory,
  createXMLGenerationRuntimeFactory,
} from "../factory/xml-generation-runtime-factory";
import type { XMLGenerationRuntimePort } from "../ports/xml-generation-runtime-port";
import type { XMLGenerationRuntimeOptions } from "../ports/types";

let sharedFactory: XMLGenerationRuntimeFactory | undefined;

function getSharedFactory(): XMLGenerationRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createXMLGenerationRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o XMLGenerationRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-05 oficial).
 */
export function createXMLGenerationRuntimePort(
  options: XMLGenerationRuntimeOptions = {},
): XMLGenerationRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getXMLGenerationRuntimeFactory(): XMLGenerationRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-05). */
export const XMLGenerationRuntimeProvider = {
  create: createXMLGenerationRuntimePort,
  getFactory: getXMLGenerationRuntimeFactory,
};
