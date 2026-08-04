/**
 * TISSMappingRuntimeFactory — instancia o adapter correto (F3-CAP-11).
 *
 * Sem lógica de negócio. Sem mapeamento funcional. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → TISSMappingRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultTISSMappingRuntimeAdapter, MockTISSMappingRuntimeAdapter } from "../adapters";
import type { TISSMappingRuntimePort } from "../ports/tiss-mapping-runtime-port";
import type {
  TISSMappingRuntimeEnterpriseDeps,
  TISSMappingRuntimeOptions,
  TISSMappingRuntimeProviderId,
} from "../ports/types";
import {
  TISSMappingRuntimeRegistry,
  createDefaultTISSMappingRuntimeRegistry,
} from "../registry/tiss-mapping-runtime-registry";
import type { TISSMappingRuntimeStore } from "../store";

export type TISSMappingRuntimeFactoryOptions = {
  registry?: TISSMappingRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: TISSMappingRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: TISSMappingRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o TISSMappingRuntimePort pedido.
 */
export class TISSMappingRuntimeFactory {
  private readonly registry: TISSMappingRuntimeRegistry;
  private readonly store?: TISSMappingRuntimeStore;
  private readonly enterpriseDeps?: TISSMappingRuntimeEnterpriseDeps;

  constructor(options: TISSMappingRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultTISSMappingRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): TISSMappingRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: TISSMappingRuntimeOptions = {}): TISSMappingRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `TISS Mapping Runtime provider "${provider}" não está registrado no TISSMappingRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: TISSMappingRuntimeProviderId,
    enterpriseDeps?: TISSMappingRuntimeEnterpriseDeps,
  ): TISSMappingRuntimePort {
    switch (provider) {
      case "mock":
        return new MockTISSMappingRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockTISSMappingRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultTISSMappingRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultTISSMappingRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`TISS Mapping Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createTISSMappingRuntimeFactory(
  options: TISSMappingRuntimeFactoryOptions = {},
): TISSMappingRuntimeFactory {
  return new TISSMappingRuntimeFactory(options);
}
