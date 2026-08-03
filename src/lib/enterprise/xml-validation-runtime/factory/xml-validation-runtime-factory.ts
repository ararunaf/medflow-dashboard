/**
 * XMLValidationRuntimeFactory — instancia o adapter correto (TISS-08).
 *
 * Sem lógica de negócio. Sem XSD oficial. Sem validação real. Sem XML TISS/ANS.
 * Posição na arquitetura:
 *   Application → TISS Runtime → XMLRuntimePort
 *     → XMLGenerationRuntimePort → XMLSerializerRuntimePort
 *     → XMLSchemaRuntimePort → XMLValidationRuntimePort
 *     → Adapter ← Factory ← Registry
 */
import { DefaultXMLValidationAdapter, MockXMLValidationAdapter } from "../adapters";
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type { XMLValidationRuntimeOptions, XMLValidationRuntimeProviderId } from "../ports/types";
import {
  XMLValidationRuntimeRegistry,
  createDefaultXMLValidationRuntimeRegistry,
} from "../registry/xml-validation-runtime-registry";
import type { XMLValidationRuntimeStore } from "../store";

export type XMLValidationRuntimeFactoryOptions = {
  registry?: XMLValidationRuntimeRegistry;
  store?: XMLValidationRuntimeStore;
};

/**
 * Factory responsável por materializar o XMLValidationRuntimePort pedido.
 */
export class XMLValidationRuntimeFactory {
  private readonly registry: XMLValidationRuntimeRegistry;
  private readonly store?: XMLValidationRuntimeStore;

  constructor(options: XMLValidationRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultXMLValidationRuntimeRegistry();
    this.store = options.store;
  }

  getRegistry(): XMLValidationRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: XMLValidationRuntimeOptions = {}): XMLValidationRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `XML Validation Runtime provider "${provider}" não está registrado no XMLValidationRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: XMLValidationRuntimeProviderId): XMLValidationRuntimePort {
    switch (provider) {
      case "mock":
        return new MockXMLValidationAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockXMLValidationAdapter({
          provider: "test",
          store: this.store,
        });
      case "default":
        return new DefaultXMLValidationAdapter({
          provider: "default",
          store: this.store,
        });
      case "enterprise":
        return new DefaultXMLValidationAdapter({
          provider: "enterprise",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`XML Validation Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createXMLValidationRuntimeFactory(
  options: XMLValidationRuntimeFactoryOptions = {},
): XMLValidationRuntimeFactory {
  return new XMLValidationRuntimeFactory(options);
}
