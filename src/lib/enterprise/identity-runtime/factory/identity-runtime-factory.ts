/**
 * IdentityRuntimeFactory — instancia o adapter correto (S2-02).
 *
 * Sem lógica de negócio. Sem identidade real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → IdentityRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultIdentityRuntimeAdapter,
  MockIdentityRuntimeAdapter,
  RealTissIdentityRuntimeAdapter,
  TestIdentityRuntimeAdapter,
} from "../adapters";
import type { IdentityRuntimePort } from "../ports/identity-runtime-port";
import type {
  IdentityRuntimeEnterpriseDeps,
  IdentityRuntimeOptions,
  IdentityRuntimeProviderId,
} from "../ports/types";
import {
  IdentityRuntimeRegistry,
  createDefaultIdentityRuntimeRegistry,
} from "../registry/identity-runtime-registry";
import type { IdentityRuntimeStore } from "../store";

export type IdentityRuntimeFactoryOptions = {
  registry?: IdentityRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: IdentityRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: IdentityRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o IdentityRuntimePort pedido.
 */
export class IdentityRuntimeFactory {
  private readonly registry: IdentityRuntimeRegistry;
  private readonly store?: IdentityRuntimeStore;
  private readonly enterpriseDeps?: IdentityRuntimeEnterpriseDeps;

  constructor(options: IdentityRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultIdentityRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): IdentityRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: IdentityRuntimeOptions = {}): IdentityRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Identity Runtime provider "${provider}" não está registrado no IdentityRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: IdentityRuntimeProviderId,
    enterpriseDeps?: IdentityRuntimeEnterpriseDeps,
  ): IdentityRuntimePort {
    switch (provider) {
      case "mock":
        return new MockIdentityRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new TestIdentityRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultIdentityRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultIdentityRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissIdentityRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Identity Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createIdentityRuntimeFactory(
  options: IdentityRuntimeFactoryOptions = {},
): IdentityRuntimeFactory {
  return new IdentityRuntimeFactory(options);
}
