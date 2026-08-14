/**
 * ComplianceRuntimeFactory — instancia o adapter correto (S3-02).
 *
 * Sem lógica de negócio. Sem identidade real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → ComplianceRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultComplianceRuntimeAdapter,
  MockComplianceRuntimeAdapter,
  RealTissComplianceRuntimeAdapter,
  TestComplianceRuntimeAdapter,
} from "../adapters";
import type { ComplianceRuntimePort } from "../ports/compliance-runtime-port";
import type {
  ComplianceRuntimeEnterpriseDeps,
  ComplianceRuntimeOptions,
  ComplianceRuntimeProviderId,
} from "../ports/types";
import {
  ComplianceRuntimeRegistry,
  createDefaultComplianceRuntimeRegistry,
} from "../registry/compliance-runtime-registry";
import type { ComplianceRuntimeStore } from "../store";

export type ComplianceRuntimeFactoryOptions = {
  registry?: ComplianceRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: ComplianceRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: ComplianceRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o ComplianceRuntimePort pedido.
 */
export class ComplianceRuntimeFactory {
  private readonly registry: ComplianceRuntimeRegistry;
  private readonly store?: ComplianceRuntimeStore;
  private readonly enterpriseDeps?: ComplianceRuntimeEnterpriseDeps;

  constructor(options: ComplianceRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultComplianceRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): ComplianceRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: ComplianceRuntimeOptions = {}): ComplianceRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Compliance Runtime provider "${provider}" não está registrado no ComplianceRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: ComplianceRuntimeProviderId,
    enterpriseDeps?: ComplianceRuntimeEnterpriseDeps,
  ): ComplianceRuntimePort {
    switch (provider) {
      case "mock":
        return new MockComplianceRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new TestComplianceRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultComplianceRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultComplianceRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissComplianceRuntimeAdapter({
          provider: "real-tiss",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Compliance Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createComplianceRuntimeFactory(
  options: ComplianceRuntimeFactoryOptions = {},
): ComplianceRuntimeFactory {
  return new ComplianceRuntimeFactory(options);
}
