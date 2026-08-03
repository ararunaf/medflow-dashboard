/**
 * XMLRuntimeFactory — instancia o adapter correto (TISS-04).
 *
 * Sem lógica de negócio. Sem XML real. Sem operadoras.
 * Posição na arquitetura:
 *   Application → TISS Runtime → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → Adapter ← Factory ← Registry
 */
import { createRulePackEnginePort } from "../../rule-pack-engine/providers/create-rule-pack-engine-port";
import { createTISSCatalogPort } from "../../tiss-catalog/providers/create-tiss-catalog-port";
import { DefaultXMLRuntimeAdapter, MockXMLRuntimeAdapter } from "../adapters";
import type { XMLRuntimePort } from "../ports/xml-runtime-port";
import type {
  XMLRuntimeEnterpriseDeps,
  XMLRuntimeOptions,
  XMLRuntimeProviderId,
} from "../ports/types";
import {
  XMLRuntimeRegistry,
  createDefaultXMLRuntimeRegistry,
} from "../registry/xml-runtime-registry";
import type { XMLRuntimeStore } from "../store";

export type XMLRuntimeFactoryOptions = {
  registry?: XMLRuntimeRegistry;
  store?: XMLRuntimeStore;
  enterpriseDeps?: XMLRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o XMLRuntimePort pedido.
 */
export class XMLRuntimeFactory {
  private readonly registry: XMLRuntimeRegistry;
  private readonly store?: XMLRuntimeStore;
  private readonly enterpriseDeps: XMLRuntimeEnterpriseDeps;

  constructor(options: XMLRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultXMLRuntimeRegistry();
    this.store = options.store;
    if (options.enterpriseDeps) {
      this.enterpriseDeps = options.enterpriseDeps;
    } else {
      const catalog = createTISSCatalogPort({ provider: "enterprise" });
      this.enterpriseDeps = {
        getTISSCatalogPort: () => catalog,
        getRulePackEnginePort: () =>
          createRulePackEnginePort({
            provider: "enterprise",
            enterpriseDeps: { getTISSCatalogPort: () => catalog },
          }),
      };
    }
  }

  getRegistry(): XMLRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: XMLRuntimeOptions = {}): XMLRuntimePort {
    const provider = options.provider ?? "enterprise";
    const enterpriseDeps = options.enterpriseDeps ?? this.enterpriseDeps;

    if (!this.registry.has(provider)) {
      throw new Error(
        `XML Runtime provider "${provider}" não está registrado no XMLRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, enterpriseDeps);
  }

  private instantiate(
    provider: XMLRuntimeProviderId,
    enterpriseDeps: XMLRuntimeEnterpriseDeps,
  ): XMLRuntimePort {
    switch (provider) {
      case "mock":
        return new MockXMLRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockXMLRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultXMLRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultXMLRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`XML Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createXMLRuntimeFactory(options: XMLRuntimeFactoryOptions = {}): XMLRuntimeFactory {
  return new XMLRuntimeFactory(options);
}
