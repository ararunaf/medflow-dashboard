/**
 * AuthorizationRuntimeFactory — instancia o adapter correto (S3-02).
 *
 * Sem lógica de negócio. Sem identidade real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → AuthorizationRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultAuthorizationRuntimeAdapter,
  MockAuthorizationRuntimeAdapter,
  RealTissAuthorizationRuntimeAdapter,
  TestAuthorizationRuntimeAdapter,
} from "../adapters";
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type {
  AuthorizationRuntimeEnterpriseDeps,
  AuthorizationRuntimeOptions,
  AuthorizationRuntimeProviderId,
} from "../ports/types";
import {
  AuthorizationRuntimeRegistry,
  createDefaultAuthorizationRuntimeRegistry,
} from "../registry/authorization-runtime-registry";
import type { AuthorizationRuntimeStore } from "../store";

export type AuthorizationRuntimeFactoryOptions = {
  registry?: AuthorizationRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: AuthorizationRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o AuthorizationRuntimePort pedido.
 */
export class AuthorizationRuntimeFactory {
  private readonly registry: AuthorizationRuntimeRegistry;
  private readonly store?: AuthorizationRuntimeStore;
  private readonly enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;

  constructor(options: AuthorizationRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultAuthorizationRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): AuthorizationRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: AuthorizationRuntimeOptions = {}): AuthorizationRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Authorization Runtime provider "${provider}" não está registrado no AuthorizationRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: AuthorizationRuntimeProviderId,
    enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps,
  ): AuthorizationRuntimePort {
    switch (provider) {
      case "mock":
        return new MockAuthorizationRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new TestAuthorizationRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultAuthorizationRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultAuthorizationRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissAuthorizationRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Authorization Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createAuthorizationRuntimeFactory(
  options: AuthorizationRuntimeFactoryOptions = {},
): AuthorizationRuntimeFactory {
  return new AuthorizationRuntimeFactory(options);
}
