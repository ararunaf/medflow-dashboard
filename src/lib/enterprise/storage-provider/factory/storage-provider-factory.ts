/**
 * StorageProviderFactory — instancia o adapter correto (STORAGE-01).
 *
 * Sem lógica de negócio. Sem bypass de vendor no produto.
 * Posição na arquitetura:
 *   Application → StorageProviderPort → Adapter ← Factory ← Registry
 */
import {
  DefaultStorageProviderAdapter,
  MockStorageProviderAdapter,
  createInMemoryStorageBackend,
} from "../adapters";
import type { StorageProviderPort } from "../ports/storage-provider-port";
import type {
  StorageProviderBackend,
  StorageProviderId,
  StorageProviderOptions,
} from "../ports/types";
import {
  StorageProviderRegistry,
  createDefaultStorageProviderRegistry,
} from "../registry/storage-provider-registry";

export type StorageProviderFactoryOptions = {
  registry?: StorageProviderRegistry;
  /** Backend default injetado nos adapters default/supabase. */
  backend?: StorageProviderBackend;
};

/**
 * Factory responsável por materializar o StorageProviderPort pedido.
 */
export class StorageProviderFactory {
  private readonly registry: StorageProviderRegistry;
  private readonly backend?: StorageProviderBackend;

  constructor(options: StorageProviderFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultStorageProviderRegistry();
    this.backend = options.backend;
  }

  getRegistry(): StorageProviderRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: StorageProviderOptions = {}): StorageProviderPort {
    const provider = options.provider ?? "supabase";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Storage provider "${provider}" não está registrado no StorageProviderRegistry.`,
      );
    }

    return this.instantiate(provider, options.backend ?? this.backend);
  }

  private instantiate(
    provider: StorageProviderId,
    backend?: StorageProviderBackend,
  ): StorageProviderPort {
    switch (provider) {
      case "mock":
        return new MockStorageProviderAdapter({ provider: "mock" });
      case "test":
        return new MockStorageProviderAdapter({ provider: "test" });
      case "default":
        return new DefaultStorageProviderAdapter({
          provider: "default",
          backend: backend ?? createInMemoryStorageBackend(),
        });
      case "supabase":
        return new DefaultStorageProviderAdapter({
          provider: "supabase",
          backend: backend ?? createInMemoryStorageBackend(),
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Storage provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createStorageProviderFactory(
  options: StorageProviderFactoryOptions = {},
): StorageProviderFactory {
  return new StorageProviderFactory(options);
}
