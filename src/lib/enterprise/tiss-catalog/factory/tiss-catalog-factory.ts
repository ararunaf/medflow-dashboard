/**
 * TISSCatalogFactory — instancia o adapter correto (TISS-02).
 *
 * Sem lógica de negócio. Sem XML. Sem operadoras.
 * Posição na arquitetura:
 *   Application → TISS Runtime → TISS Catalog Runtime
 *     → TISSCatalogPort → Adapter ← Factory ← Registry
 */
import { DefaultTISSCatalogAdapter, MockTISSCatalogAdapter } from "../adapters";
import type { TISSCatalogPort } from "../ports/tiss-catalog-port";
import type { TISSCatalogOptions, TISSCatalogProviderId } from "../ports/types";
import {
  TISSCatalogRegistry,
  createDefaultTISSCatalogRegistry,
} from "../registry/tiss-catalog-registry";
import { getSharedEnterpriseTISSCatalogStore } from "../store";
import type { TISSCatalogStore } from "../store";

export type TISSCatalogFactoryOptions = {
  registry?: TISSCatalogRegistry;
  store?: TISSCatalogStore;
};

/**
 * Factory responsável por materializar o TISSCatalogPort pedido.
 */
export class TISSCatalogFactory {
  private readonly registry: TISSCatalogRegistry;
  private readonly store?: TISSCatalogStore;

  constructor(options: TISSCatalogFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultTISSCatalogRegistry();
    this.store = options.store;
  }

  getRegistry(): TISSCatalogRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: TISSCatalogOptions = {}): TISSCatalogPort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `TISS catalog provider "${provider}" não está registrado no TISSCatalogRegistry.`,
      );
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: TISSCatalogProviderId): TISSCatalogPort {
    switch (provider) {
      case "mock":
        return new MockTISSCatalogAdapter({ provider: "mock", store: this.store });
      case "test":
        return new MockTISSCatalogAdapter({ provider: "test", store: this.store });
      case "default":
        return new DefaultTISSCatalogAdapter({
          provider: "default",
          store: this.store ?? getSharedEnterpriseTISSCatalogStore(),
        });
      case "enterprise":
        return new DefaultTISSCatalogAdapter({
          provider: "enterprise",
          store: this.store ?? getSharedEnterpriseTISSCatalogStore(),
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`TISS catalog provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createTISSCatalogFactory(
  options: TISSCatalogFactoryOptions = {},
): TISSCatalogFactory {
  return new TISSCatalogFactory(options);
}
