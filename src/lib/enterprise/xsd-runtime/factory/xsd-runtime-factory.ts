/**
 * XSDRuntimeFactory — instancia o adapter correto (TISS-09).
 *
 * Sem lógica de negócio. Sem XSD oficial. Sem validação real. Sem XML TISS/ANS.
 * Posição na arquitetura:
 *   Application → TISS Runtime → XMLRuntimePort
 *     → XMLGenerationRuntimePort → XMLSerializerRuntimePort
 *     → XMLSchemaRuntimePort → XMLValidationRuntimePort
 *     → XSDRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultXSDRuntimeAdapter, MockXSDRuntimeAdapter } from "../adapters";
import type { XSDRuntimePort } from "../ports/xsd-runtime-port";
import type { XSDRuntimeOptions, XSDRuntimeProviderId } from "../ports/types";
import {
  XSDRuntimeRegistry,
  createDefaultXSDRuntimeRegistry,
} from "../registry/xsd-runtime-registry";
import type { XSDRuntimeStore } from "../store";

export type XSDRuntimeFactoryOptions = {
  registry?: XSDRuntimeRegistry;
  store?: XSDRuntimeStore;
};

/**
 * Factory responsável por materializar o XSDRuntimePort pedido.
 */
export class XSDRuntimeFactory {
  private readonly registry: XSDRuntimeRegistry;
  private readonly store?: XSDRuntimeStore;

  constructor(options: XSDRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultXSDRuntimeRegistry();
    this.store = options.store;
  }

  getRegistry(): XSDRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: XSDRuntimeOptions = {}): XSDRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `XSD Runtime provider "${provider}" não está registrado no XSDRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: XSDRuntimeProviderId): XSDRuntimePort {
    switch (provider) {
      case "mock":
        return new MockXSDRuntimeAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockXSDRuntimeAdapter({
          provider: "test",
          store: this.store,
        });
      case "default":
        return new DefaultXSDRuntimeAdapter({
          provider: "default",
          store: this.store,
        });
      case "enterprise":
        return new DefaultXSDRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`XSD Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createXSDRuntimeFactory(options: XSDRuntimeFactoryOptions = {}): XSDRuntimeFactory {
  return new XSDRuntimeFactory(options);
}
