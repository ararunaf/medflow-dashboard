/**
 * ValidationRuntimeProvider — factory pública do ValidationRuntimePort (F3-CAP-08).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  ValidationRuntimeFactory,
  createValidationRuntimeFactory,
} from "../factory/validation-runtime-factory";
import type { ValidationRuntimePort } from "../ports/validation-runtime-port";
import type { ValidationRuntimeOptions } from "../ports/types";

let sharedFactory: ValidationRuntimeFactory | undefined;

function getSharedFactory(): ValidationRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createValidationRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o ValidationRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-08 oficial).
 */
export function createValidationRuntimePort(
  options: ValidationRuntimeOptions = {},
): ValidationRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getValidationRuntimeFactory(): ValidationRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getValidationRuntimePort().
 */
export function getValidationRuntimePort(
  options: ValidationRuntimeOptions = {},
): ValidationRuntimePort {
  return createValidationRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-08). */
export const ValidationRuntimeProvider = {
  create: createValidationRuntimePort,
  get: getValidationRuntimePort,
  getFactory: getValidationRuntimeFactory,
};
