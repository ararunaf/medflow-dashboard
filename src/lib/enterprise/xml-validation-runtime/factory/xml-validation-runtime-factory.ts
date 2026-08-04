/**
 * XMLValidationRuntimeFactory — instancia o adapter correto (C-02).
 *
 * Sem lógica de negócio. Sem validação XML. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → XMLValidationRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultXMLValidationRuntimeAdapter, MockXMLValidationRuntimeAdapter } from "../adapters";
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type {
  XMLValidationRuntimeEnterpriseDeps,
  XMLValidationRuntimeOptions,
  XMLValidationRuntimeProviderId,
} from "../ports/types";
import {
  XMLValidationRuntimeRegistry,
  createDefaultXMLValidationRuntimeRegistry,
} from "../registry/xml-validation-runtime-registry";
import type { XMLValidationRuntimeStore } from "../store";

export type XMLValidationRuntimeFactoryOptions = {
  registry?: XMLValidationRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: XMLValidationRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: XMLValidationRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o XMLValidationRuntimePort pedido.
 */
export class XMLValidationRuntimeFactory {
  private readonly registry: XMLValidationRuntimeRegistry;
  private readonly store?: XMLValidationRuntimeStore;
  private readonly enterpriseDeps?: XMLValidationRuntimeEnterpriseDeps;

  constructor(options: XMLValidationRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultXMLValidationRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
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

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: XMLValidationRuntimeProviderId,
    enterpriseDeps?: XMLValidationRuntimeEnterpriseDeps,
  ): XMLValidationRuntimePort {
    switch (provider) {
      case "mock":
        return new MockXMLValidationRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockXMLValidationRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultXMLValidationRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultXMLValidationRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
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
