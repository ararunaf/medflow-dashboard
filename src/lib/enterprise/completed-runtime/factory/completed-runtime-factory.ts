/**
 * CompletedRuntimeFactory — instancia o adapter correto (A10-02).
 *
 * Sem lógica de negócio. Sem completedoria real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → CompletedRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultCompletedRuntimeAdapter,
  MockCompletedRuntimeAdapter,
  RealTissCompletedRuntimeAdapter,
  TestCompletedRuntimeAdapter,
} from "../adapters";
import type { CompletedRuntimePort } from "../ports/completed-runtime-port";
import type {
  CompletedRuntimeEnterpriseDeps,
  CompletedRuntimeOptions,
  CompletedRuntimeProviderId,
} from "../ports/types";
import {
  CompletedRuntimeRegistry,
  createDefaultCompletedRuntimeRegistry,
} from "../registry/completed-runtime-registry";
import type { CompletedRuntimeStore } from "../store";

export type CompletedRuntimeFactoryOptions = {
  registry?: CompletedRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: CompletedRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: CompletedRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o CompletedRuntimePort pedido.
 */
export class CompletedRuntimeFactory {
  private readonly registry: CompletedRuntimeRegistry;
  private readonly store?: CompletedRuntimeStore;
  private readonly enterpriseDeps?: CompletedRuntimeEnterpriseDeps;

  constructor(options: CompletedRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultCompletedRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): CompletedRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: CompletedRuntimeOptions = {}): CompletedRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Completed Runtime provider "${provider}" não está registrado no CompletedRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: CompletedRuntimeProviderId,
    enterpriseDeps?: CompletedRuntimeEnterpriseDeps,
  ): CompletedRuntimePort {
    switch (provider) {
      case "mock":
        return new MockCompletedRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new TestCompletedRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultCompletedRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultCompletedRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissCompletedRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Completed Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createCompletedRuntimeFactory(
  options: CompletedRuntimeFactoryOptions = {},
): CompletedRuntimeFactory {
  return new CompletedRuntimeFactory(options);
}
