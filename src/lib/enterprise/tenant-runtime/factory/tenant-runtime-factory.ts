/**
 * TenantRuntimeFactory — instancia o adapter correto (S3-02).
 *
 * Sem lógica de negócio. Sem identidade real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → TenantRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultTenantRuntimeAdapter,
  MockTenantRuntimeAdapter,
  RealTissTenantRuntimeAdapter,
  TestTenantRuntimeAdapter,
} from "../adapters";
import type { TenantRuntimePort } from "../ports/tenant-runtime-port";
import type {
  TenantRuntimeEnterpriseDeps,
  TenantRuntimeOptions,
  TenantRuntimeProviderId,
} from "../ports/types";
import {
  TenantRuntimeRegistry,
  createDefaultTenantRuntimeRegistry,
} from "../registry/tenant-runtime-registry";
import type { TenantRuntimeStore } from "../store";

export type TenantRuntimeFactoryOptions = {
  registry?: TenantRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: TenantRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: TenantRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o TenantRuntimePort pedido.
 */
export class TenantRuntimeFactory {
  private readonly registry: TenantRuntimeRegistry;
  private readonly store?: TenantRuntimeStore;
  private readonly enterpriseDeps?: TenantRuntimeEnterpriseDeps;

  constructor(options: TenantRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultTenantRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): TenantRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: TenantRuntimeOptions = {}): TenantRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Tenant Runtime provider "${provider}" não está registrado no TenantRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: TenantRuntimeProviderId,
    enterpriseDeps?: TenantRuntimeEnterpriseDeps,
  ): TenantRuntimePort {
    switch (provider) {
      case "mock":
        return new MockTenantRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new TestTenantRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultTenantRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultTenantRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissTenantRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Tenant Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createTenantRuntimeFactory(
  options: TenantRuntimeFactoryOptions = {},
): TenantRuntimeFactory {
  return new TenantRuntimeFactory(options);
}
