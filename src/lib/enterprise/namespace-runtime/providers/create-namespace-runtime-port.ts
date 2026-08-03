/**
 * NamespaceRuntimeProvider — factory pública do NamespaceRuntimePort (TISS-10).
 *
 * Application / TISS Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  NamespaceRuntimeFactory,
  createNamespaceRuntimeFactory,
} from "../factory/namespace-runtime-factory";
import type { NamespaceRuntimePort } from "../ports/namespace-runtime-port";
import type { NamespaceRuntimeOptions } from "../ports/types";

let sharedFactory: NamespaceRuntimeFactory | undefined;

function getSharedFactory(): NamespaceRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createNamespaceRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o NamespaceRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-10 oficial).
 */
export function createNamespaceRuntimePort(
  options: NamespaceRuntimeOptions = {},
): NamespaceRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getNamespaceRuntimeFactory(): NamespaceRuntimeFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-10). */
export const NamespaceRuntimeProvider = {
  create: createNamespaceRuntimePort,
  getFactory: getNamespaceRuntimeFactory,
};
