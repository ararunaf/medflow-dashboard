/**
 * TISSProviderFactory — instancia o adapter correto (TISS-01).
 *
 * Sem lógica de negócio. Sem XML. Sem operadoras.
 * Posição na arquitetura:
 *   Application → TISS Runtime → TISSProviderPort → Adapter ← Factory ← Registry
 */
import { DefaultTISSProviderAdapter, MockTISSProviderAdapter } from "../adapters";
import type { TISSProviderPort } from "../ports/tiss-provider-port";
import type { TISSProviderId, TISSProviderOptions } from "../ports/types";
import {
  TISSProviderRegistry,
  createDefaultTISSProviderRegistry,
} from "../registry/tiss-provider-registry";

export type TISSProviderFactoryOptions = {
  registry?: TISSProviderRegistry;
};

/**
 * Factory responsável por materializar o TISSProviderPort pedido.
 */
export class TISSProviderFactory {
  private readonly registry: TISSProviderRegistry;

  constructor(options: TISSProviderFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultTISSProviderRegistry();
  }

  getRegistry(): TISSProviderRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: TISSProviderOptions = {}): TISSProviderPort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(`TISS provider "${provider}" não está registrado no TISSProviderRegistry.`);
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: TISSProviderId): TISSProviderPort {
    switch (provider) {
      case "mock":
        return new MockTISSProviderAdapter({ provider: "mock" });
      case "test":
        return new MockTISSProviderAdapter({ provider: "test" });
      case "default":
        return new DefaultTISSProviderAdapter({ provider: "default" });
      case "enterprise":
        return new DefaultTISSProviderAdapter({ provider: "enterprise" });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`TISS provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createTISSProviderFactory(
  options: TISSProviderFactoryOptions = {},
): TISSProviderFactory {
  return new TISSProviderFactory(options);
}
