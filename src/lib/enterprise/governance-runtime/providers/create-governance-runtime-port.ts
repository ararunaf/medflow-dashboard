/**
 * GovernanceRuntimeProvider — factory pública do GovernanceRuntimePort (S6-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  GovernanceRuntimeFactory,
  createGovernanceRuntimeFactory,
} from "../factory/governance-runtime-factory";
import type { GovernanceRuntimePort } from "../ports/governance-runtime-port";
import type { GovernanceRuntimeOptions } from "../ports/types";

let sharedFactory: GovernanceRuntimeFactory | undefined;

function getSharedFactory(): GovernanceRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createGovernanceRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o GovernanceRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (S6-02 oficial).
 */
export function createGovernanceRuntimePort(
  options: GovernanceRuntimeOptions = {},
): GovernanceRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getGovernanceRuntimeFactory(): GovernanceRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getGovernanceRuntimePort().
 */
export function getGovernanceRuntimePort(
  options: GovernanceRuntimeOptions = {},
): GovernanceRuntimePort {
  return createGovernanceRuntimePort(options);
}

/** Alias explícito do Provider (S6-02). */
export const GovernanceRuntimeProvider = {
  create: createGovernanceRuntimePort,
  get: getGovernanceRuntimePort,
  getFactory: getGovernanceRuntimeFactory,
};
