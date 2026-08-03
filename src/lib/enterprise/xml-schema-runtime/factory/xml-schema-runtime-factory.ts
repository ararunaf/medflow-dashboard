/**
 * XMLSchemaRuntimeFactory — instancia o adapter correto (TISS-07).
 *
 * Sem lógica de negócio. Sem XSD oficial. Sem validação. Sem XML TISS/ANS.
 * Posição na arquitetura:
 *   Application → TISS Runtime → XMLRuntimePort
 *     → XMLGenerationRuntimePort → XMLSerializerRuntimePort
 *     → XMLSchemaRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultXMLSchemaAdapter, MockXMLSchemaAdapter } from "../adapters";
import type { XMLSchemaRuntimePort } from "../ports/xml-schema-runtime-port";
import type { XMLSchemaRuntimeOptions, XMLSchemaRuntimeProviderId } from "../ports/types";
import {
  XMLSchemaRuntimeRegistry,
  createDefaultXMLSchemaRuntimeRegistry,
} from "../registry/xml-schema-runtime-registry";
import type { XMLSchemaRuntimeStore } from "../store";

export type XMLSchemaRuntimeFactoryOptions = {
  registry?: XMLSchemaRuntimeRegistry;
  store?: XMLSchemaRuntimeStore;
};

/**
 * Factory responsável por materializar o XMLSchemaRuntimePort pedido.
 */
export class XMLSchemaRuntimeFactory {
  private readonly registry: XMLSchemaRuntimeRegistry;
  private readonly store?: XMLSchemaRuntimeStore;

  constructor(options: XMLSchemaRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultXMLSchemaRuntimeRegistry();
    this.store = options.store;
  }

  getRegistry(): XMLSchemaRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: XMLSchemaRuntimeOptions = {}): XMLSchemaRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `XML Schema Runtime provider "${provider}" não está registrado no XMLSchemaRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: XMLSchemaRuntimeProviderId): XMLSchemaRuntimePort {
    switch (provider) {
      case "mock":
        return new MockXMLSchemaAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockXMLSchemaAdapter({
          provider: "test",
          store: this.store,
        });
      case "default":
        return new DefaultXMLSchemaAdapter({
          provider: "default",
          store: this.store,
        });
      case "enterprise":
        return new DefaultXMLSchemaAdapter({
          provider: "enterprise",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`XML Schema Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createXMLSchemaRuntimeFactory(
  options: XMLSchemaRuntimeFactoryOptions = {},
): XMLSchemaRuntimeFactory {
  return new XMLSchemaRuntimeFactory(options);
}
