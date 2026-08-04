/**
 * XMLValidationRuntimeProvider — factory pública do XMLValidationRuntimePort (C-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
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
 * Default da factory: `enterprise` (C-02 oficial).
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

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getXMLValidationRuntimePort().
 */
export function getXMLValidationRuntimePort(
  options: XMLValidationRuntimeOptions = {},
): XMLValidationRuntimePort {
  return createXMLValidationRuntimePort(options);
}

/** Alias explícito do Provider (C-02). */
export const XMLValidationRuntimeProvider = {
  create: createXMLValidationRuntimePort,
  get: getXMLValidationRuntimePort,
  getFactory: getXMLValidationRuntimeFactory,
};
