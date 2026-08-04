/**
 * OperatorRuntimeFactory — instancia o adapter correto (C-04).
 *
 * Sem lógica de negócio. Sem operadoras reais. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → OperatorRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultOperatorRuntimeAdapter, MockOperatorRuntimeAdapter } from "../adapters";
import type { OperatorRuntimePort } from "../ports/operator-runtime-port";
import type {
  OperatorRuntimeEnterpriseDeps,
  OperatorRuntimeOptions,
  OperatorRuntimeProviderId,
} from "../ports/types";
import {
  OperatorRuntimeRegistry,
  createDefaultOperatorRuntimeRegistry,
} from "../registry/operator-runtime-registry";
import type { OperatorRuntimeStore } from "../store";

export type OperatorRuntimeFactoryOptions = {
  registry?: OperatorRuntimeRegistry;
  store?: OperatorRuntimeStore;
  enterpriseDeps?: OperatorRuntimeEnterpriseDeps;
};

export class OperatorRuntimeFactory {
  private readonly registry: OperatorRuntimeRegistry;
  private readonly store?: OperatorRuntimeStore;
  private readonly enterpriseDeps?: OperatorRuntimeEnterpriseDeps;

  constructor(options: OperatorRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultOperatorRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): OperatorRuntimeRegistry {
    return this.registry;
  }

  create(options: OperatorRuntimeOptions = {}): OperatorRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Operator Runtime provider "${provider}" não está registrado no OperatorRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: OperatorRuntimeProviderId,
    enterpriseDeps?: OperatorRuntimeEnterpriseDeps,
  ): OperatorRuntimePort {
    switch (provider) {
      case "mock":
        return new MockOperatorRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockOperatorRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultOperatorRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultOperatorRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Operator Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createOperatorRuntimeFactory(
  options: OperatorRuntimeFactoryOptions = {},
): OperatorRuntimeFactory {
  return new OperatorRuntimeFactory(options);
}
