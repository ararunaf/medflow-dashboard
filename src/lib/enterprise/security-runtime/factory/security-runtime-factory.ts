/**
 * SecurityRuntimeFactory — instancia o adapter correto (S1-02).
 *
 * Sem lógica de negócio. Sem segurança real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → SecurityRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultSecurityRuntimeAdapter,
  MockSecurityRuntimeAdapter,
  RealTissSecurityRuntimeAdapter,
  TestSecurityRuntimeAdapter,
} from "../adapters";
import type { SecurityRuntimePort } from "../ports/security-runtime-port";
import type {
  SecurityRuntimeEnterpriseDeps,
  SecurityRuntimeOptions,
  SecurityRuntimeProviderId,
} from "../ports/types";
import {
  SecurityRuntimeRegistry,
  createDefaultSecurityRuntimeRegistry,
} from "../registry/security-runtime-registry";
import type { SecurityRuntimeStore } from "../store";

export type SecurityRuntimeFactoryOptions = {
  registry?: SecurityRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: SecurityRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: SecurityRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o SecurityRuntimePort pedido.
 */
export class SecurityRuntimeFactory {
  private readonly registry: SecurityRuntimeRegistry;
  private readonly store?: SecurityRuntimeStore;
  private readonly enterpriseDeps?: SecurityRuntimeEnterpriseDeps;

  constructor(options: SecurityRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultSecurityRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): SecurityRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: SecurityRuntimeOptions = {}): SecurityRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Security Runtime provider "${provider}" não está registrado no SecurityRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: SecurityRuntimeProviderId,
    enterpriseDeps?: SecurityRuntimeEnterpriseDeps,
  ): SecurityRuntimePort {
    switch (provider) {
      case "mock":
        return new MockSecurityRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new TestSecurityRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultSecurityRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultSecurityRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissSecurityRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Security Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createSecurityRuntimeFactory(
  options: SecurityRuntimeFactoryOptions = {},
): SecurityRuntimeFactory {
  return new SecurityRuntimeFactory(options);
}
