/**
 * QualityRuntimeFactory — instancia o adapter correto (F3-CAP-13).
 *
 * Sem lógica de negócio. Sem avaliação automática. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → QualityRuntimePort → Adapter ← Factory ← Registry
 */
import { DefaultQualityRuntimeAdapter, MockQualityRuntimeAdapter } from "../adapters";
import type { QualityRuntimePort } from "../ports/quality-runtime-port";
import type {
  QualityRuntimeEnterpriseDeps,
  QualityRuntimeOptions,
  QualityRuntimeProviderId,
} from "../ports/types";
import {
  QualityRuntimeRegistry,
  createDefaultQualityRuntimeRegistry,
} from "../registry/quality-runtime-registry";
import type { QualityRuntimeStore } from "../store";

export type QualityRuntimeFactoryOptions = {
  registry?: QualityRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: QualityRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: QualityRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o QualityRuntimePort pedido.
 */
export class QualityRuntimeFactory {
  private readonly registry: QualityRuntimeRegistry;
  private readonly store?: QualityRuntimeStore;
  private readonly enterpriseDeps?: QualityRuntimeEnterpriseDeps;

  constructor(options: QualityRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultQualityRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): QualityRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: QualityRuntimeOptions = {}): QualityRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Quality Runtime provider "${provider}" não está registrado no QualityRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: QualityRuntimeProviderId,
    enterpriseDeps?: QualityRuntimeEnterpriseDeps,
  ): QualityRuntimePort {
    switch (provider) {
      case "mock":
        return new MockQualityRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockQualityRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultQualityRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultQualityRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Quality Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createQualityRuntimeFactory(
  options: QualityRuntimeFactoryOptions = {},
): QualityRuntimeFactory {
  return new QualityRuntimeFactory(options);
}
