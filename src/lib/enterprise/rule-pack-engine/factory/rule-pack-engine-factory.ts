/**
 * RulePackEngineFactory — instancia o adapter correto (TISS-03).
 *
 * Sem lógica de negócio. Sem XML. Sem operadoras.
 * Posição na arquitetura:
 *   Application → TISS Runtime → TISSCatalogPort
 *     → RulePackEnginePort → Adapter ← Factory ← Registry
 */
import { createTISSCatalogPort } from "../../tiss-catalog/providers/create-tiss-catalog-port";
import { DefaultRulePackEngineAdapter, MockRulePackEngineAdapter } from "../adapters";
import type { RulePackEnginePort } from "../ports/rule-pack-engine-port";
import type {
  RulePackEngineEnterpriseDeps,
  RulePackEngineOptions,
  RulePackEngineProviderId,
} from "../ports/types";
import {
  RulePackEngineRegistry,
  createDefaultRulePackEngineRegistry,
} from "../registry/rule-pack-engine-registry";
import type { RulePackEngineStore } from "../store";

export type RulePackEngineFactoryOptions = {
  registry?: RulePackEngineRegistry;
  store?: RulePackEngineStore;
  enterpriseDeps?: RulePackEngineEnterpriseDeps;
};

/**
 * Factory responsável por materializar o RulePackEnginePort pedido.
 */
export class RulePackEngineFactory {
  private readonly registry: RulePackEngineRegistry;
  private readonly store?: RulePackEngineStore;
  private readonly enterpriseDeps: RulePackEngineEnterpriseDeps;

  constructor(options: RulePackEngineFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultRulePackEngineRegistry();
    this.store = options.store;
    this.enterpriseDeps =
      options.enterpriseDeps ??
      ({
        getTISSCatalogPort: () => createTISSCatalogPort({ provider: "enterprise" }),
      } satisfies RulePackEngineEnterpriseDeps);
  }

  getRegistry(): RulePackEngineRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: RulePackEngineOptions = {}): RulePackEnginePort {
    const provider = options.provider ?? "enterprise";
    const enterpriseDeps = options.enterpriseDeps ?? this.enterpriseDeps;

    if (!this.registry.has(provider)) {
      throw new Error(
        `Rule Pack Engine provider "${provider}" não está registrado no RulePackEngineRegistry.`,
      );
    }

    return this.instantiate(provider, enterpriseDeps);
  }

  private instantiate(
    provider: RulePackEngineProviderId,
    enterpriseDeps: RulePackEngineEnterpriseDeps,
  ): RulePackEnginePort {
    switch (provider) {
      case "mock":
        return new MockRulePackEngineAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockRulePackEngineAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultRulePackEngineAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultRulePackEngineAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Rule Pack Engine provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createRulePackEngineFactory(
  options: RulePackEngineFactoryOptions = {},
): RulePackEngineFactory {
  return new RulePackEngineFactory(options);
}
