/**
 * WorkerRuntimeFactory — instancia o adapter correto (INF-06).
 *
 * Sem lógica de negócio. Sem Workers reais. Sem Scheduler. Sem Thread Pool.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → WorkerRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultWorkerRuntimeAdapter, MockWorkerRuntimeAdapter } from "../adapters";
import type { WorkerRuntimePort } from "../ports/worker-runtime-port";
import type {
  WorkerRuntimeEnterpriseDeps,
  WorkerRuntimeOptions,
  WorkerRuntimeProviderId,
} from "../ports/types";
import {
  WorkerRuntimeRegistry,
  createDefaultWorkerRuntimeRegistry,
} from "../registry/worker-runtime-registry";
import type { WorkerRuntimeStore } from "../store";

export type WorkerRuntimeFactoryOptions = {
  registry?: WorkerRuntimeRegistry;
  store?: WorkerRuntimeStore;
  enterpriseDeps?: WorkerRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o WorkerRuntimePort pedido.
 */
export class WorkerRuntimeFactory {
  private readonly registry: WorkerRuntimeRegistry;
  private readonly store?: WorkerRuntimeStore;
  private readonly enterpriseDeps?: WorkerRuntimeEnterpriseDeps;

  constructor(options: WorkerRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultWorkerRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): WorkerRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: WorkerRuntimeOptions = {}): WorkerRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Worker Runtime provider "${provider}" não está registrado no WorkerRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: WorkerRuntimeProviderId,
    enterpriseDeps?: WorkerRuntimeEnterpriseDeps,
  ): WorkerRuntimePort {
    switch (provider) {
      case "mock":
        return new MockWorkerRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockWorkerRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultWorkerRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultWorkerRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Worker Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createWorkerRuntimeFactory(
  options: WorkerRuntimeFactoryOptions = {},
): WorkerRuntimeFactory {
  return new WorkerRuntimeFactory(options);
}
