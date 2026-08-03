/**
 * XMLSchemaRuntimeProvider — factory pública do XMLSchemaRuntimePort (TISS-07).
 *
 * Application / TISS Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  XMLSchemaRuntimeFactory,
  createXMLSchemaRuntimeFactory,
} from "../factory/xml-schema-runtime-factory";
import type { XMLSchemaRuntimePort } from "../ports/xml-schema-runtime-port";
import type { XMLSchemaRuntimeOptions } from "../ports/types";

let sharedFactory: XMLSchemaRuntimeFactory | undefined;

function getSharedFactory(): XMLSchemaRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createXMLSchemaRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o XMLSchemaRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-07 oficial).
 */
export function createXMLSchemaRuntimePort(
  options: XMLSchemaRuntimeOptions = {},
): XMLSchemaRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getXMLSchemaRuntimeFactory(): XMLSchemaRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-07). */
export const XMLSchemaRuntimeProvider = {
  create: createXMLSchemaRuntimePort,
  getFactory: getXMLSchemaRuntimeFactory,
};
