/**
 * TISSCatalogProvider — factory pública do TISSCatalogPort (TISS-02).
 *
 * Application / TISS Runtime / TISS Catalog Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { TISSCatalogFactory, createTISSCatalogFactory } from "../factory/tiss-catalog-factory";
import type { TISSCatalogPort } from "../ports/tiss-catalog-port";
import type { TISSCatalogOptions } from "../ports/types";

let sharedFactory: TISSCatalogFactory | undefined;

function getSharedFactory(): TISSCatalogFactory {
  if (!sharedFactory) {
    sharedFactory = createTISSCatalogFactory();
  }
  return sharedFactory;
}

/**
 * Cria o TISSCatalogPort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-02 oficial).
 */
export function createTISSCatalogPort(options: TISSCatalogOptions = {}): TISSCatalogPort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getTISSCatalogFactory(): TISSCatalogFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-02). */
export const TISSCatalogProvider = {
  create: createTISSCatalogPort,
  getFactory: getTISSCatalogFactory,
};
