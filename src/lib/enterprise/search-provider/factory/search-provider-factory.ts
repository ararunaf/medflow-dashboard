/**
 * SearchProviderFactory — instancia o adapter correto (SEARCH-01).
 *
 * Sem lógica de negócio. Sem motores de busca externos.
 * Posição na arquitetura:
 *   Application → SearchProviderPort → Adapter ← Factory ← Registry
 *     → StorageProviderPort → Backend oficial
 */
import type { StorageProviderPort } from "../../storage-provider/ports/storage-provider-port";
import { createStorageProviderPort } from "../../storage-provider/providers/create-storage-provider-port";
import { DefaultSearchProviderAdapter, MockSearchProviderAdapter } from "../adapters";
import type { SearchProviderPort } from "../ports/search-provider-port";
import type { SearchProviderId, SearchProviderOptions } from "../ports/types";
import {
  SearchProviderRegistry,
  createDefaultSearchProviderRegistry,
} from "../registry/search-provider-registry";

export type SearchProviderFactoryOptions = {
  registry?: SearchProviderRegistry;
  storageProviderPort?: StorageProviderPort;
};

/**
 * Factory responsável por materializar o SearchProviderPort pedido.
 */
export class SearchProviderFactory {
  private readonly registry: SearchProviderRegistry;
  private readonly storageProviderPort?: StorageProviderPort;

  constructor(options: SearchProviderFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultSearchProviderRegistry();
    this.storageProviderPort = options.storageProviderPort;
  }

  getRegistry(): SearchProviderRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: SearchProviderOptions = {}): SearchProviderPort {
    const provider = options.provider ?? "storage-backed";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Search provider "${provider}" não está registrado no SearchProviderRegistry.`,
      );
    }

    return this.instantiate(provider, options);
  }

  private instantiate(
    provider: SearchProviderId,
    options: SearchProviderOptions,
  ): SearchProviderPort {
    const storage =
      options.storageProviderPort ??
      this.storageProviderPort ??
      createStorageProviderPort({ provider: "mock" });

    switch (provider) {
      case "mock":
        return new MockSearchProviderAdapter({
          provider: "mock",
          seedDocuments: options.seedDocuments,
        });
      case "test":
        return new MockSearchProviderAdapter({
          provider: "test",
          seedDocuments: options.seedDocuments,
        });
      case "default":
        return new DefaultSearchProviderAdapter({
          provider: "default",
          storageProviderPort: storage,
          seedDocuments: options.seedDocuments,
        });
      case "storage-backed":
        return new DefaultSearchProviderAdapter({
          provider: "storage-backed",
          storageProviderPort: storage,
          seedDocuments: options.seedDocuments,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Search provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createSearchProviderFactory(
  options: SearchProviderFactoryOptions = {},
): SearchProviderFactory {
  return new SearchProviderFactory(options);
}
