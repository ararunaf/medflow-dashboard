/**
 * SecurityRuntimeProvider — factory pública do SecurityRuntimePort (S1-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  SecurityRuntimeFactory,
  createSecurityRuntimeFactory,
} from "../factory/security-runtime-factory";
import type { SecurityRuntimePort } from "../ports/security-runtime-port";
import type { SecurityRuntimeOptions } from "../ports/types";

let sharedFactory: SecurityRuntimeFactory | undefined;

function getSharedFactory(): SecurityRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createSecurityRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o SecurityRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (S1-02 oficial).
 */
export function createSecurityRuntimePort(
  options: SecurityRuntimeOptions = {},
): SecurityRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getSecurityRuntimeFactory(): SecurityRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getSecurityRuntimePort().
 */
export function getSecurityRuntimePort(options: SecurityRuntimeOptions = {}): SecurityRuntimePort {
  return createSecurityRuntimePort(options);
}

/** Alias explícito do Provider (S1-02). */
export const SecurityRuntimeProvider = {
  create: createSecurityRuntimePort,
  get: getSecurityRuntimePort,
  getFactory: getSecurityRuntimeFactory,
};
