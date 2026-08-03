/**
 * SchedulerRuntimeFactory — instancia o adapter correto (INF-07).
 *
 * Sem lógica de negócio. Sem Scheduler real. Sem Cron. Sem Timer.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → SchedulerRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultSchedulerRuntimeAdapter, MockSchedulerRuntimeAdapter } from "../adapters";
import type { SchedulerRuntimePort } from "../ports/scheduler-runtime-port";
import type {
  SchedulerRuntimeEnterpriseDeps,
  SchedulerRuntimeOptions,
  SchedulerRuntimeProviderId,
} from "../ports/types";
import {
  SchedulerRuntimeRegistry,
  createDefaultSchedulerRuntimeRegistry,
} from "../registry/scheduler-runtime-registry";
import type { SchedulerRuntimeStore } from "../store";

export type SchedulerRuntimeFactoryOptions = {
  registry?: SchedulerRuntimeRegistry;
  store?: SchedulerRuntimeStore;
  enterpriseDeps?: SchedulerRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o SchedulerRuntimePort pedido.
 */
export class SchedulerRuntimeFactory {
  private readonly registry: SchedulerRuntimeRegistry;
  private readonly store?: SchedulerRuntimeStore;
  private readonly enterpriseDeps?: SchedulerRuntimeEnterpriseDeps;

  constructor(options: SchedulerRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultSchedulerRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): SchedulerRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: SchedulerRuntimeOptions = {}): SchedulerRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Scheduler Runtime provider "${provider}" não está registrado no SchedulerRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: SchedulerRuntimeProviderId,
    enterpriseDeps?: SchedulerRuntimeEnterpriseDeps,
  ): SchedulerRuntimePort {
    switch (provider) {
      case "mock":
        return new MockSchedulerRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockSchedulerRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultSchedulerRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultSchedulerRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Scheduler Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createSchedulerRuntimeFactory(
  options: SchedulerRuntimeFactoryOptions = {},
): SchedulerRuntimeFactory {
  return new SchedulerRuntimeFactory(options);
}
