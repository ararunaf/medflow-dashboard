/**
 * ScalabilityRuntimeFactory — instancia o adapter correto (INF-10).
 *
 * Sem lógica de negócio. Sem OpenTelemetry. Sem Application Insights. Sem Prometheus.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → ScalabilityRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultScalabilityRuntimeAdapter, MockScalabilityRuntimeAdapter } from "../adapters";
import type { ScalabilityRuntimePort } from "../ports/scalability-runtime-port";
import type {
  ScalabilityRuntimeEnterpriseDeps,
  ScalabilityRuntimeOptions,
  ScalabilityRuntimeProviderId,
} from "../ports/types";
import {
  ScalabilityRuntimeRegistry,
  createDefaultScalabilityRuntimeRegistry,
} from "../registry/scalability-runtime-registry";
import type { ScalabilityRuntimeStore } from "../store";

export type ScalabilityRuntimeFactoryOptions = {
  registry?: ScalabilityRuntimeRegistry;
  store?: ScalabilityRuntimeStore;
  enterpriseDeps?: ScalabilityRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o ScalabilityRuntimePort pedido.
 */
export class ScalabilityRuntimeFactory {
  private readonly registry: ScalabilityRuntimeRegistry;
  private readonly store?: ScalabilityRuntimeStore;
  private readonly enterpriseDeps?: ScalabilityRuntimeEnterpriseDeps;

  constructor(options: ScalabilityRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultScalabilityRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): ScalabilityRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: ScalabilityRuntimeOptions = {}): ScalabilityRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Scalability Runtime provider "${provider}" não está registrado no ScalabilityRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: ScalabilityRuntimeProviderId,
    enterpriseDeps?: ScalabilityRuntimeEnterpriseDeps,
  ): ScalabilityRuntimePort {
    switch (provider) {
      case "mock":
        return new MockScalabilityRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockScalabilityRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultScalabilityRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultScalabilityRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Scalability Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createScalabilityRuntimeFactory(
  options: ScalabilityRuntimeFactoryOptions = {},
): ScalabilityRuntimeFactory {
  return new ScalabilityRuntimeFactory(options);
}
