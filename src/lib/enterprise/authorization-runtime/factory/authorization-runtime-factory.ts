/**
 * AuthorizationRuntimeFactory — instancia o adapter correto (C-05).
 *
 * Sem lógica de negócio. Sem autorização funcional. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → AuthorizationRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultAuthorizationRuntimeAdapter, MockAuthorizationRuntimeAdapter } from "../adapters";
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
  store?: AuthorizationRuntimeStore;
  enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;
};

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
        return new MockAuthorizationRuntimeAdapter({
          provider: "test",
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
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Authorization Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createAuthorizationRuntimeFactory(
  options: AuthorizationRuntimeFactoryOptions = {},
): AuthorizationRuntimeFactory {
  return new AuthorizationRuntimeFactory(options);
}
