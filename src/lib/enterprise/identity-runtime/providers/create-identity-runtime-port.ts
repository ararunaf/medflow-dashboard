/**
 * IdentityRuntimeProvider — factory pública do IdentityRuntimePort (S2-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  IdentityRuntimeFactory,
  createIdentityRuntimeFactory,
} from "../factory/identity-runtime-factory";
import type { IdentityRuntimePort } from "../ports/identity-runtime-port";
import type { IdentityRuntimeOptions } from "../ports/types";

let sharedFactory: IdentityRuntimeFactory | undefined;

function getSharedFactory(): IdentityRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createIdentityRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o IdentityRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (S2-02 oficial).
 */
export function createIdentityRuntimePort(
  options: IdentityRuntimeOptions = {},
): IdentityRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getIdentityRuntimeFactory(): IdentityRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getIdentityRuntimePort().
 */
export function getIdentityRuntimePort(options: IdentityRuntimeOptions = {}): IdentityRuntimePort {
  return createIdentityRuntimePort(options);
}

/** Alias explícito do Provider (S2-02). */
export const IdentityRuntimeProvider = {
  create: createIdentityRuntimePort,
  get: getIdentityRuntimePort,
  getFactory: getIdentityRuntimeFactory,
};
