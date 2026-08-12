/**
 * XMLTISSRuntimeFactory — instancia o adapter correto (C-01).
 *
 * Sem lógica de negócio. Sem geração de XML. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → XMLTISSRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultXMLTISSRuntimeAdapter,
  MockXMLTISSRuntimeAdapter,
  RealTissXMLTISSRuntimeAdapter,
} from "../adapters";
import type { XMLTISSRuntimePort } from "../ports/xml-tiss-runtime-port";
import type {
  XMLTISSRuntimeEnterpriseDeps,
  XMLTISSRuntimeOptions,
  XMLTISSRuntimeProviderId,
} from "../ports/types";
import {
  XMLTISSRuntimeRegistry,
  createDefaultXMLTISSRuntimeRegistry,
} from "../registry/xml-tiss-runtime-registry";
import type { XMLTISSRuntimeStore } from "../store";

export type XMLTISSRuntimeFactoryOptions = {
  registry?: XMLTISSRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: XMLTISSRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: XMLTISSRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o XMLTISSRuntimePort pedido.
 */
export class XMLTISSRuntimeFactory {
  private readonly registry: XMLTISSRuntimeRegistry;
  private readonly store?: XMLTISSRuntimeStore;
  private readonly enterpriseDeps?: XMLTISSRuntimeEnterpriseDeps;

  constructor(options: XMLTISSRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultXMLTISSRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): XMLTISSRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: XMLTISSRuntimeOptions = {}): XMLTISSRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `XML TISS Runtime provider "${provider}" não está registrado no XMLTISSRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: XMLTISSRuntimeProviderId,
    enterpriseDeps?: XMLTISSRuntimeEnterpriseDeps,
  ): XMLTISSRuntimePort {
    switch (provider) {
      case "mock":
        return new MockXMLTISSRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockXMLTISSRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultXMLTISSRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultXMLTISSRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissXMLTISSRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`XML TISS Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createXMLTISSRuntimeFactory(
  options: XMLTISSRuntimeFactoryOptions = {},
): XMLTISSRuntimeFactory {
  return new XMLTISSRuntimeFactory(options);
}
