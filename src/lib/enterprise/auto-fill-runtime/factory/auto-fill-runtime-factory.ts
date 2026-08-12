/**
 * AutoFillRuntimeFactory — instancia o adapter correto (F3-CAP-12).
 *
 * Sem lógica de negócio. Sem preenchimento automático. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → AutoFillRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultAutoFillRuntimeAdapter,
  MockAutoFillRuntimeAdapter,
  RealTissAutoFillRuntimeAdapter,
} from "../adapters";
import type { AutoFillRuntimePort } from "../ports/auto-fill-runtime-port";
import type {
  AutoFillRuntimeEnterpriseDeps,
  AutoFillRuntimeOptions,
  AutoFillRuntimeProviderId,
} from "../ports/types";
import {
  AutoFillRuntimeRegistry,
  createDefaultAutoFillRuntimeRegistry,
} from "../registry/auto-fill-runtime-registry";
import type { AutoFillRuntimeStore } from "../store";

export type AutoFillRuntimeFactoryOptions = {
  registry?: AutoFillRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: AutoFillRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: AutoFillRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o AutoFillRuntimePort pedido.
 */
export class AutoFillRuntimeFactory {
  private readonly registry: AutoFillRuntimeRegistry;
  private readonly store?: AutoFillRuntimeStore;
  private readonly enterpriseDeps?: AutoFillRuntimeEnterpriseDeps;

  constructor(options: AutoFillRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultAutoFillRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): AutoFillRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: AutoFillRuntimeOptions = {}): AutoFillRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Auto-Fill Runtime provider "${provider}" não está registrado no AutoFillRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: AutoFillRuntimeProviderId,
    enterpriseDeps?: AutoFillRuntimeEnterpriseDeps,
  ): AutoFillRuntimePort {
    switch (provider) {
      case "mock":
        return new MockAutoFillRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockAutoFillRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultAutoFillRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultAutoFillRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissAutoFillRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Auto-Fill Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createAutoFillRuntimeFactory(
  options: AutoFillRuntimeFactoryOptions = {},
): AutoFillRuntimeFactory {
  return new AutoFillRuntimeFactory(options);
}
