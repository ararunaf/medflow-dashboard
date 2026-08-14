/**
 * GovernanceRuntimeFactory — instancia o adapter correto (S6-02).
 *
 * Sem lógica de negócio. Sem identidade real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → GovernanceRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultGovernanceRuntimeAdapter,
  MockGovernanceRuntimeAdapter,
  RealTissGovernanceRuntimeAdapter,
  TestGovernanceRuntimeAdapter,
} from "../adapters";
import type { GovernanceRuntimePort } from "../ports/governance-runtime-port";
import type {
  GovernanceRuntimeEnterpriseDeps,
  GovernanceRuntimeOptions,
  GovernanceRuntimeProviderId,
} from "../ports/types";
import {
  GovernanceRuntimeRegistry,
  createDefaultGovernanceRuntimeRegistry,
} from "../registry/governance-runtime-registry";
import type { GovernanceRuntimeStore } from "../store";

export type GovernanceRuntimeFactoryOptions = {
  registry?: GovernanceRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: GovernanceRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: GovernanceRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o GovernanceRuntimePort pedido.
 */
export class GovernanceRuntimeFactory {
  private readonly registry: GovernanceRuntimeRegistry;
  private readonly store?: GovernanceRuntimeStore;
  private readonly enterpriseDeps?: GovernanceRuntimeEnterpriseDeps;

  constructor(options: GovernanceRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultGovernanceRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): GovernanceRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: GovernanceRuntimeOptions = {}): GovernanceRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Governance Runtime provider "${provider}" não está registrado no GovernanceRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: GovernanceRuntimeProviderId,
    enterpriseDeps?: GovernanceRuntimeEnterpriseDeps,
  ): GovernanceRuntimePort {
    switch (provider) {
      case "mock":
        return new MockGovernanceRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new TestGovernanceRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultGovernanceRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultGovernanceRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissGovernanceRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Governance Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createGovernanceRuntimeFactory(
  options: GovernanceRuntimeFactoryOptions = {},
): GovernanceRuntimeFactory {
  return new GovernanceRuntimeFactory(options);
}
