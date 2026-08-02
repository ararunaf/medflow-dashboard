/**
 * Provider / factory pública do TISSProviderPort (TISS-01).
 *
 * Application / TISS Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { TISSProviderFactory, createTISSProviderFactory } from "../factory/tiss-provider-factory";
import type { TISSProviderPort } from "../ports/tiss-provider-port";
import type { TISSProviderOptions } from "../ports/types";

let sharedFactory: TISSProviderFactory | undefined;

function getSharedFactory(): TISSProviderFactory {
  if (!sharedFactory) {
    sharedFactory = createTISSProviderFactory();
  }
  return sharedFactory;
}

/**
 * Cria o TISSProviderPort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-01 oficial).
 */
export function createTISSProviderPort(options: TISSProviderOptions = {}): TISSProviderPort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getTISSProviderFactory(): TISSProviderFactory {
  return getSharedFactory();
}
