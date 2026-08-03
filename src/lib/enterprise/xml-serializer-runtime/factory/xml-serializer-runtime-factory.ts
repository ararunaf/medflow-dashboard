/**
 * XMLSerializerRuntimeFactory — instancia o adapter correto (TISS-06).
 *
 * Sem lógica de negócio. Sem XML TISS/ANS. Sem operadoras.
 * Posição na arquitetura:
 *   Application → TISS Runtime → XMLRuntimePort
 *     → XMLGenerationRuntimePort → XMLSerializerRuntimePort
 *     → Adapter ← Factory ← Registry
 */
import { DefaultXMLSerializerAdapter, MockXMLSerializerAdapter } from "../adapters";
import type { XMLSerializerRuntimePort } from "../ports/xml-serializer-runtime-port";
import type { XMLSerializerRuntimeOptions, XMLSerializerRuntimeProviderId } from "../ports/types";
import {
  XMLSerializerRuntimeRegistry,
  createDefaultXMLSerializerRuntimeRegistry,
} from "../registry/xml-serializer-runtime-registry";
import type { XMLSerializerRuntimeStore } from "../store";

export type XMLSerializerRuntimeFactoryOptions = {
  registry?: XMLSerializerRuntimeRegistry;
  store?: XMLSerializerRuntimeStore;
};

/**
 * Factory responsável por materializar o XMLSerializerRuntimePort pedido.
 */
export class XMLSerializerRuntimeFactory {
  private readonly registry: XMLSerializerRuntimeRegistry;
  private readonly store?: XMLSerializerRuntimeStore;

  constructor(options: XMLSerializerRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultXMLSerializerRuntimeRegistry();
    this.store = options.store;
  }

  getRegistry(): XMLSerializerRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: XMLSerializerRuntimeOptions = {}): XMLSerializerRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `XML Serializer Runtime provider "${provider}" não está registrado no XMLSerializerRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: XMLSerializerRuntimeProviderId): XMLSerializerRuntimePort {
    switch (provider) {
      case "mock":
        return new MockXMLSerializerAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockXMLSerializerAdapter({
          provider: "test",
          store: this.store,
        });
      case "default":
        return new DefaultXMLSerializerAdapter({
          provider: "default",
          store: this.store,
        });
      case "enterprise":
        return new DefaultXMLSerializerAdapter({
          provider: "enterprise",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`XML Serializer Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createXMLSerializerRuntimeFactory(
  options: XMLSerializerRuntimeFactoryOptions = {},
): XMLSerializerRuntimeFactory {
  return new XMLSerializerRuntimeFactory(options);
}
