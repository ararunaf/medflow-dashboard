/**
 * ValidationRuntimeFactory — instancia o adapter correto (F3-CAP-08).
 *
 * Sem lógica de negócio. Sem validação real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → ValidationRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultValidationRuntimeAdapter,
  MockValidationRuntimeAdapter,
  RealTissValidationRuntimeAdapter,
} from "../adapters";
import type { ValidationRuntimePort } from "../ports/validation-runtime-port";
import type {
  ValidationRuntimeEnterpriseDeps,
  ValidationRuntimeOptions,
  ValidationRuntimeProviderId,
} from "../ports/types";
import {
  ValidationRuntimeRegistry,
  createDefaultValidationRuntimeRegistry,
} from "../registry/validation-runtime-registry";
import type { ValidationRuntimeStore } from "../store";

export type ValidationRuntimeFactoryOptions = {
  registry?: ValidationRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: ValidationRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: ValidationRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o ValidationRuntimePort pedido.
 */
export class ValidationRuntimeFactory {
  private readonly registry: ValidationRuntimeRegistry;
  private readonly store?: ValidationRuntimeStore;
  private readonly enterpriseDeps?: ValidationRuntimeEnterpriseDeps;

  constructor(options: ValidationRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultValidationRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): ValidationRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: ValidationRuntimeOptions = {}): ValidationRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `Validation Runtime provider "${provider}" não está registrado no ValidationRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: ValidationRuntimeProviderId,
    enterpriseDeps?: ValidationRuntimeEnterpriseDeps,
  ): ValidationRuntimePort {
    switch (provider) {
      case "mock":
        return new MockValidationRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockValidationRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultValidationRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultValidationRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      case "real-tiss":
        return new RealTissValidationRuntimeAdapter({
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Validation Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createValidationRuntimeFactory(
  options: ValidationRuntimeFactoryOptions = {},
): ValidationRuntimeFactory {
  return new ValidationRuntimeFactory(options);
}
