/**
 * XMLGenerationRuntimeFactory — instancia o adapter correto (TISS-05).
 *
 * Sem lógica de negócio. Sem XML real. Sem operadoras.
 * Posição na arquitetura:
 *   Application → TISS Runtime → XMLRuntimePort
 *     → XMLGenerationRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultXMLGenerationAdapter, MockXMLGenerationAdapter } from "../adapters";
import type { XMLGenerationRuntimePort } from "../ports/xml-generation-runtime-port";
import type { XMLGenerationRuntimeOptions, XMLGenerationRuntimeProviderId } from "../ports/types";
import {
  XMLGenerationRuntimeRegistry,
  createDefaultXMLGenerationRuntimeRegistry,
} from "../registry/xml-generation-runtime-registry";
import type { XMLGenerationRuntimeStore } from "../store";

export type XMLGenerationRuntimeFactoryOptions = {
  registry?: XMLGenerationRuntimeRegistry;
  store?: XMLGenerationRuntimeStore;
};

/**
 * Factory responsável por materializar o XMLGenerationRuntimePort pedido.
 */
export class XMLGenerationRuntimeFactory {
  private readonly registry: XMLGenerationRuntimeRegistry;
  private readonly store?: XMLGenerationRuntimeStore;

  constructor(options: XMLGenerationRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultXMLGenerationRuntimeRegistry();
    this.store = options.store;
  }

  getRegistry(): XMLGenerationRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: XMLGenerationRuntimeOptions = {}): XMLGenerationRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `XML Generation Runtime provider "${provider}" não está registrado no XMLGenerationRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: XMLGenerationRuntimeProviderId): XMLGenerationRuntimePort {
    switch (provider) {
      case "mock":
        return new MockXMLGenerationAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockXMLGenerationAdapter({
          provider: "test",
          store: this.store,
        });
      case "default":
        return new DefaultXMLGenerationAdapter({
          provider: "default",
          store: this.store,
        });
      case "enterprise":
        return new DefaultXMLGenerationAdapter({
          provider: "enterprise",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`XML Generation Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createXMLGenerationRuntimeFactory(
  options: XMLGenerationRuntimeFactoryOptions = {},
): XMLGenerationRuntimeFactory {
  return new XMLGenerationRuntimeFactory(options);
}
