/**
 * Provider / factory pública do SearchProviderPort (SEARCH-01).
 *
 * Application / Document Search Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  SearchProviderFactory,
  createSearchProviderFactory,
} from "../factory/search-provider-factory";
import type { SearchProviderPort } from "../ports/search-provider-port";
import type { SearchProviderOptions } from "../ports/types";

let sharedFactory: SearchProviderFactory | undefined;

function getSharedFactory(): SearchProviderFactory {
  if (!sharedFactory) {
    sharedFactory = createSearchProviderFactory();
  }
  return sharedFactory;
}

/**
 * Cria o SearchProviderPort para o provedor solicitado.
 *
 * Default da factory: `storage-backed` (SEARCH-01 oficial).
 */
export function createSearchProviderPort(options: SearchProviderOptions = {}): SearchProviderPort {
  if (options.storageProviderPort || options.seedDocuments) {
    return createSearchProviderFactory({
      storageProviderPort: options.storageProviderPort,
    }).create(options);
  }
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getSearchProviderFactory(): SearchProviderFactory {
  return getSharedFactory();
}
