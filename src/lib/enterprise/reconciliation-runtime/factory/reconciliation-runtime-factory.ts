/**
 * ReconciliationRuntimeFactory — instancia o adapter correto (C-09).
 *
 * Sem lógica de negócio. Sem reconciliação funcional. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → ReconciliationRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultReconciliationRuntimeAdapter, MockReconciliationRuntimeAdapter } from "../adapters";
import type { ReconciliationRuntimePort } from "../ports/reconciliation-runtime-port";
import type {
  ReconciliationRuntimeEnterpriseDeps,
  ReconciliationRuntimeOptions,
  ReconciliationRuntimeProviderId,
} from "../ports/types";
import {
  ReconciliationRuntimeRegistry,
  createDefaultReconciliationRuntimeRegistry,
} from "../registry/reconciliation-runtime-registry";
import type { ReconciliationRuntimeStore } from "../store";

export type ReconciliationRuntimeFactoryOptions = {
  registry?: ReconciliationRuntimeRegistry;
  store?: ReconciliationRuntimeStore;
  enterpriseDeps?: ReconciliationRuntimeEnterpriseDeps;
};

export class ReconciliationRuntimeFactory {
  private readonly registry: ReconciliationRuntimeRegistry;
  private readonly store?: ReconciliationRuntimeStore;
  private readonly enterpriseDeps?: ReconciliationRuntimeEnterpriseDeps;

  constructor(options: ReconciliationRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultReconciliationRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): ReconciliationRuntimeRegistry {
    return this.registry;
  }

  create(options: ReconciliationRuntimeOptions = {}): ReconciliationRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Reconciliation Runtime provider "${provider}" não está registrado no ReconciliationRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: ReconciliationRuntimeProviderId,
    enterpriseDeps?: ReconciliationRuntimeEnterpriseDeps,
  ): ReconciliationRuntimePort {
    switch (provider) {
      case "mock":
        return new MockReconciliationRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockReconciliationRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultReconciliationRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultReconciliationRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Reconciliation Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createReconciliationRuntimeFactory(
  options: ReconciliationRuntimeFactoryOptions = {},
): ReconciliationRuntimeFactory {
  return new ReconciliationRuntimeFactory(options);
}
