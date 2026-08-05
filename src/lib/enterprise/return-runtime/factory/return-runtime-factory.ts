/**
 * ReturnRuntimeFactory — instancia o adapter correto (C-08).
 *
 * Sem lógica de negócio. Sem processamento de retorno. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → ReturnRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultReturnRuntimeAdapter, MockReturnRuntimeAdapter } from "../adapters";
import type { ReturnRuntimePort } from "../ports/return-runtime-port";
import type {
  ReturnRuntimeEnterpriseDeps,
  ReturnRuntimeOptions,
  ReturnRuntimeProviderId,
} from "../ports/types";
import {
  ReturnRuntimeRegistry,
  createDefaultReturnRuntimeRegistry,
} from "../registry/return-runtime-registry";
import type { ReturnRuntimeStore } from "../store";

export type ReturnRuntimeFactoryOptions = {
  registry?: ReturnRuntimeRegistry;
  store?: ReturnRuntimeStore;
  enterpriseDeps?: ReturnRuntimeEnterpriseDeps;
};

export class ReturnRuntimeFactory {
  private readonly registry: ReturnRuntimeRegistry;
  private readonly store?: ReturnRuntimeStore;
  private readonly enterpriseDeps?: ReturnRuntimeEnterpriseDeps;

  constructor(options: ReturnRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultReturnRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): ReturnRuntimeRegistry {
    return this.registry;
  }

  create(options: ReturnRuntimeOptions = {}): ReturnRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Return Runtime provider "${provider}" não está registrado no ReturnRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: ReturnRuntimeProviderId,
    enterpriseDeps?: ReturnRuntimeEnterpriseDeps,
  ): ReturnRuntimePort {
    switch (provider) {
      case "mock":
        return new MockReturnRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockReturnRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultReturnRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultReturnRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Return Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createReturnRuntimeFactory(
  options: ReturnRuntimeFactoryOptions = {},
): ReturnRuntimeFactory {
  return new ReturnRuntimeFactory(options);
}
