/**
 * BatchRuntimeFactory — instancia o adapter correto (C-06).
 *
 * Sem lógica de negócio. Sem processamento em lote. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → BatchRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultBatchRuntimeAdapter,
  MockBatchRuntimeAdapter,
  RealTissBatchRuntimeAdapter,
} from "../adapters";
import type { BatchRuntimePort } from "../ports/batch-runtime-port";
import type {
  BatchRuntimeEnterpriseDeps,
  BatchRuntimeOptions,
  BatchRuntimeProviderId,
} from "../ports/types";
import {
  BatchRuntimeRegistry,
  createDefaultBatchRuntimeRegistry,
} from "../registry/batch-runtime-registry";
import type { BatchRuntimeStore } from "../store";

export type BatchRuntimeFactoryOptions = {
  registry?: BatchRuntimeRegistry;
  store?: BatchRuntimeStore;
  enterpriseDeps?: BatchRuntimeEnterpriseDeps;
};

export class BatchRuntimeFactory {
  private readonly registry: BatchRuntimeRegistry;
  private readonly store?: BatchRuntimeStore;
  private readonly enterpriseDeps?: BatchRuntimeEnterpriseDeps;

  constructor(options: BatchRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultBatchRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): BatchRuntimeRegistry {
    return this.registry;
  }

  create(options: BatchRuntimeOptions = {}): BatchRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Batch Runtime provider "${provider}" não está registrado no BatchRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: BatchRuntimeProviderId,
    enterpriseDeps?: BatchRuntimeEnterpriseDeps,
  ): BatchRuntimePort {
    switch (provider) {
      case "mock":
        return new MockBatchRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockBatchRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultBatchRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultBatchRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissBatchRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Batch Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createBatchRuntimeFactory(
  options: BatchRuntimeFactoryOptions = {},
): BatchRuntimeFactory {
  return new BatchRuntimeFactory(options);
}
