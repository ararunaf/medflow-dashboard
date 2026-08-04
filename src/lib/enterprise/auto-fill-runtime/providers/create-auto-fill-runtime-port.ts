/**
 * AutoFillRuntimeProvider — factory pública do AutoFillRuntimePort (F3-CAP-12).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  AutoFillRuntimeFactory,
  createAutoFillRuntimeFactory,
} from "../factory/auto-fill-runtime-factory";
import type { AutoFillRuntimePort } from "../ports/auto-fill-runtime-port";
import type { AutoFillRuntimeOptions } from "../ports/types";

let sharedFactory: AutoFillRuntimeFactory | undefined;

function getSharedFactory(): AutoFillRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createAutoFillRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o AutoFillRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-12 oficial).
 */
export function createAutoFillRuntimePort(
  options: AutoFillRuntimeOptions = {},
): AutoFillRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getAutoFillRuntimeFactory(): AutoFillRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getAutoFillRuntimePort().
 */
export function getAutoFillRuntimePort(options: AutoFillRuntimeOptions = {}): AutoFillRuntimePort {
  return createAutoFillRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-12). */
export const AutoFillRuntimeProvider = {
  create: createAutoFillRuntimePort,
  get: getAutoFillRuntimePort,
  getFactory: getAutoFillRuntimeFactory,
};
