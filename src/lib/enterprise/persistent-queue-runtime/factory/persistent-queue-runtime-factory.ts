/**
 * PersistentQueueRuntimeFactory — instancia o adapter correto (INF-08).
 *
 * Sem lógica de negócio. Sem Scheduler real. Sem Cron. Sem Timer.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → PersistentQueueRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultPersistentQueueRuntimeAdapter,
  MockPersistentQueueRuntimeAdapter,
  RealTissPersistenceRuntimeAdapter,
} from "../adapters";
import type { PersistentQueueRuntimePort } from "../ports/persistent-queue-runtime-port";
import type {
  PersistentQueueRuntimeEnterpriseDeps,
  PersistentQueueRuntimeOptions,
  PersistentQueueRuntimeProviderId,
} from "../ports/types";
import {
  PersistentQueueRuntimeRegistry,
  createDefaultPersistentQueueRuntimeRegistry,
} from "../registry/persistent-queue-runtime-registry";
import type { PersistentQueueRuntimeStore } from "../store";

export type PersistentQueueRuntimeFactoryOptions = {
  registry?: PersistentQueueRuntimeRegistry;
  store?: PersistentQueueRuntimeStore;
  enterpriseDeps?: PersistentQueueRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o PersistentQueueRuntimePort pedido.
 */
export class PersistentQueueRuntimeFactory {
  private readonly registry: PersistentQueueRuntimeRegistry;
  private readonly store?: PersistentQueueRuntimeStore;
  private readonly enterpriseDeps?: PersistentQueueRuntimeEnterpriseDeps;

  constructor(options: PersistentQueueRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultPersistentQueueRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): PersistentQueueRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: PersistentQueueRuntimeOptions = {}): PersistentQueueRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Persistent Queue Runtime provider "${provider}" não está registrado no PersistentQueueRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: PersistentQueueRuntimeProviderId,
    enterpriseDeps?: PersistentQueueRuntimeEnterpriseDeps,
  ): PersistentQueueRuntimePort {
    switch (provider) {
      case "mock":
        return new MockPersistentQueueRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockPersistentQueueRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultPersistentQueueRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultPersistentQueueRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissPersistenceRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Persistent Queue Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createPersistentQueueRuntimeFactory(
  options: PersistentQueueRuntimeFactoryOptions = {},
): PersistentQueueRuntimeFactory {
  return new PersistentQueueRuntimeFactory(options);
}
