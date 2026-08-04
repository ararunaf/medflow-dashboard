/**
 * AuthorizationRuntimeProvider — factory pública do AuthorizationRuntimePort (C-05).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  AuthorizationRuntimeFactory,
  createAuthorizationRuntimeFactory,
} from "../factory/authorization-runtime-factory";
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type { AuthorizationRuntimeOptions } from "../ports/types";

let sharedFactory: AuthorizationRuntimeFactory | undefined;

function getSharedFactory(): AuthorizationRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createAuthorizationRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o AuthorizationRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-05 oficial).
 */
export function createAuthorizationRuntimePort(
  options: AuthorizationRuntimeOptions = {},
): AuthorizationRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getAuthorizationRuntimeFactory(): AuthorizationRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getAuthorizationRuntimePort().
 */
export function getAuthorizationRuntimePort(
  options: AuthorizationRuntimeOptions = {},
): AuthorizationRuntimePort {
  return createAuthorizationRuntimePort(options);
}

/** Alias explícito do Provider (C-05). */
export const AuthorizationRuntimeProvider = {
  create: createAuthorizationRuntimePort,
  get: getAuthorizationRuntimePort,
  getFactory: getAuthorizationRuntimeFactory,
};
