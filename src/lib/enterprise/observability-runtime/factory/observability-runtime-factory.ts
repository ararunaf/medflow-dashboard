/**
 * ObservabilityRuntimeFactory — instancia o adapter correto (INF-09).
 *
 * Sem lógica de negócio. Sem OpenTelemetry. Sem Application Insights. Sem Prometheus.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → ObservabilityRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultObservabilityRuntimeAdapter, MockObservabilityRuntimeAdapter } from "../adapters";
import type { ObservabilityRuntimePort } from "../ports/observability-runtime-port";
import type {
  ObservabilityRuntimeEnterpriseDeps,
  ObservabilityRuntimeOptions,
  ObservabilityRuntimeProviderId,
} from "../ports/types";
import {
  ObservabilityRuntimeRegistry,
  createDefaultObservabilityRuntimeRegistry,
} from "../registry/observability-runtime-registry";
import type { ObservabilityRuntimeStore } from "../store";

export type ObservabilityRuntimeFactoryOptions = {
  registry?: ObservabilityRuntimeRegistry;
  store?: ObservabilityRuntimeStore;
  enterpriseDeps?: ObservabilityRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o ObservabilityRuntimePort pedido.
 */
export class ObservabilityRuntimeFactory {
  private readonly registry: ObservabilityRuntimeRegistry;
  private readonly store?: ObservabilityRuntimeStore;
  private readonly enterpriseDeps?: ObservabilityRuntimeEnterpriseDeps;

  constructor(options: ObservabilityRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultObservabilityRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): ObservabilityRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: ObservabilityRuntimeOptions = {}): ObservabilityRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Observability Runtime provider "${provider}" não está registrado no ObservabilityRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: ObservabilityRuntimeProviderId,
    enterpriseDeps?: ObservabilityRuntimeEnterpriseDeps,
  ): ObservabilityRuntimePort {
    switch (provider) {
      case "mock":
        return new MockObservabilityRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockObservabilityRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultObservabilityRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultObservabilityRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Observability Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createObservabilityRuntimeFactory(
  options: ObservabilityRuntimeFactoryOptions = {},
): ObservabilityRuntimeFactory {
  return new ObservabilityRuntimeFactory(options);
}
