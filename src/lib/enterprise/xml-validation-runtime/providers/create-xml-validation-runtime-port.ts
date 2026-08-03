/**
 * XMLValidationRuntimeProvider — factory pública do XMLValidationRuntimePort (TISS-08).
 *
 * Application / TISS Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  XMLValidationRuntimeFactory,
  createXMLValidationRuntimeFactory,
} from "../factory/xml-validation-runtime-factory";
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type { XMLValidationRuntimeOptions } from "../ports/types";

let sharedFactory: XMLValidationRuntimeFactory | undefined;

function getSharedFactory(): XMLValidationRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createXMLValidationRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o XMLValidationRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-08 oficial).
 */
export function createXMLValidationRuntimePort(
  options: XMLValidationRuntimeOptions = {},
): XMLValidationRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getXMLValidationRuntimeFactory(): XMLValidationRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-08). */
export const XMLValidationRuntimeProvider = {
  create: createXMLValidationRuntimePort,
  getFactory: getXMLValidationRuntimeFactory,
};
