/**
 * AuditRuntimeFactory — instancia o adapter correto (F3-CAP-10).
 *
 * Sem lógica de negócio. Sem auditoria real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → AuditRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultAuditRuntimeAdapter,
  MockAuditRuntimeAdapter,
  RealTissAuditRuntimeAdapter,
} from "../adapters";
import type { AuditRuntimePort } from "../ports/audit-runtime-port";
import type {
  AuditRuntimeEnterpriseDeps,
  AuditRuntimeOptions,
  AuditRuntimeProviderId,
} from "../ports/types";
import {
  AuditRuntimeRegistry,
  createDefaultAuditRuntimeRegistry,
} from "../registry/audit-runtime-registry";
import type { AuditRuntimeStore } from "../store";

export type AuditRuntimeFactoryOptions = {
  registry?: AuditRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: AuditRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: AuditRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o AuditRuntimePort pedido.
 */
export class AuditRuntimeFactory {
  private readonly registry: AuditRuntimeRegistry;
  private readonly store?: AuditRuntimeStore;
  private readonly enterpriseDeps?: AuditRuntimeEnterpriseDeps;

  constructor(options: AuditRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultAuditRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): AuditRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: AuditRuntimeOptions = {}): AuditRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Audit Runtime provider "${provider}" não está registrado no AuditRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: AuditRuntimeProviderId,
    enterpriseDeps?: AuditRuntimeEnterpriseDeps,
  ): AuditRuntimePort {
    switch (provider) {
      case "mock":
        return new MockAuditRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockAuditRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultAuditRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultAuditRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissAuditRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Audit Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createAuditRuntimeFactory(
  options: AuditRuntimeFactoryOptions = {},
): AuditRuntimeFactory {
  return new AuditRuntimeFactory(options);
}
