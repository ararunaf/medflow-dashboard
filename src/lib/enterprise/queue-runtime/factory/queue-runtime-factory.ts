/**
 * QueueRuntimeFactory — instancia o adapter correto (INF-05).
 *
 * Sem lógica de negócio. Sem filas reais. Sem workers. Sem backends.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → QueueRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultQueueRuntimeAdapter, MockQueueRuntimeAdapter } from "../adapters";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type {
  QueueRuntimeEnterpriseDeps,
  QueueRuntimeOptions,
  QueueRuntimeProviderId,
} from "../ports/types";
import {
  QueueRuntimeRegistry,
  createDefaultQueueRuntimeRegistry,
} from "../registry/queue-runtime-registry";
import type { QueueRuntimeStore } from "../store";

export type QueueRuntimeFactoryOptions = {
  registry?: QueueRuntimeRegistry;
  store?: QueueRuntimeStore;
  enterpriseDeps?: QueueRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o QueueRuntimePort pedido.
 */
export class QueueRuntimeFactory {
  private readonly registry: QueueRuntimeRegistry;
  private readonly store?: QueueRuntimeStore;
  private readonly enterpriseDeps?: QueueRuntimeEnterpriseDeps;

  constructor(options: QueueRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultQueueRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): QueueRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: QueueRuntimeOptions = {}): QueueRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Queue Runtime provider "${provider}" não está registrado no QueueRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: QueueRuntimeProviderId,
    enterpriseDeps?: QueueRuntimeEnterpriseDeps,
  ): QueueRuntimePort {
    switch (provider) {
      case "mock":
        return new MockQueueRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockQueueRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultQueueRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultQueueRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Queue Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createQueueRuntimeFactory(
  options: QueueRuntimeFactoryOptions = {},
): QueueRuntimeFactory {
  return new QueueRuntimeFactory(options);
}
