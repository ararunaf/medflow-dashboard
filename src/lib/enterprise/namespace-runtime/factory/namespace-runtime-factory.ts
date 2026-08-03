/**
 * NamespaceRuntimeFactory — instancia o adapter correto (TISS-10).
 *
 * Sem lógica de negócio. Sem namespace oficial. Sem resolução real. Sem XML TISS/ANS.
 * Posição na arquitetura:
 *   Application → TISS Runtime → XMLRuntimePort
 *     → XMLGenerationRuntimePort → XMLSerializerRuntimePort
 *     → XMLSchemaRuntimePort → XMLValidationRuntimePort
 *     → NamespaceRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultNamespaceRuntimeAdapter, MockNamespaceRuntimeAdapter } from "../adapters";
import type { NamespaceRuntimePort } from "../ports/namespace-runtime-port";
import type { NamespaceRuntimeOptions, NamespaceRuntimeProviderId } from "../ports/types";
import {
  NamespaceRuntimeRegistry,
  createDefaultNamespaceRuntimeRegistry,
} from "../registry/namespace-runtime-registry";
import type { NamespaceRuntimeStore } from "../store";

export type NamespaceRuntimeFactoryOptions = {
  registry?: NamespaceRuntimeRegistry;
  store?: NamespaceRuntimeStore;
};

/**
 * Factory responsável por materializar o NamespaceRuntimePort pedido.
 */
export class NamespaceRuntimeFactory {
  private readonly registry: NamespaceRuntimeRegistry;
  private readonly store?: NamespaceRuntimeStore;

  constructor(options: NamespaceRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultNamespaceRuntimeRegistry();
    this.store = options.store;
  }

  getRegistry(): NamespaceRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: NamespaceRuntimeOptions = {}): NamespaceRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Namespace Runtime provider "${provider}" não está registrado no NamespaceRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: NamespaceRuntimeProviderId): NamespaceRuntimePort {
    switch (provider) {
      case "mock":
        return new MockNamespaceRuntimeAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockNamespaceRuntimeAdapter({
          provider: "test",
          store: this.store,
        });
      case "default":
        return new DefaultNamespaceRuntimeAdapter({
          provider: "default",
          store: this.store,
        });
      case "enterprise":
        return new DefaultNamespaceRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Namespace Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createNamespaceRuntimeFactory(
  options: NamespaceRuntimeFactoryOptions = {},
): NamespaceRuntimeFactory {
  return new NamespaceRuntimeFactory(options);
}
