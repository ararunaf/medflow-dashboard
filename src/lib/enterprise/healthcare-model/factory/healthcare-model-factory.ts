/**
 * HealthcareModelFactory — instancia o adapter correto (EPC-19 / FASE 4).
 *
 * Sem lógica de negócio. Sem TISS. Sem ANS. Sem banco.
 * Posição na arquitetura:
 *   Application → HealthcareModelPort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultHealthcareModelAdapter, MockHealthcareModelAdapter } from "../adapters";
import type { HealthcareModelPort } from "../ports/healthcare-model-port";
import type { HealthcareModelProviderId, HealthcareModelProviderOptions } from "../ports/types";
import type { HealthcareModelStore } from "../store";

export type HealthcareModelFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: HealthcareModelProviderId;
  /** Store compartilhado opcional. */
  store?: HealthcareModelStore;
};

/**
 * Factory responsável por materializar o HealthcareModelPort pedido.
 */
export class HealthcareModelFactory {
  private readonly defaultProvider: HealthcareModelProviderId;
  private readonly store?: HealthcareModelStore;

  constructor(options: HealthcareModelFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: HealthcareModelProviderOptions = {}): HealthcareModelPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: HealthcareModelProviderId): HealthcareModelPort {
    switch (provider) {
      case "default":
        return new DefaultHealthcareModelAdapter({
          store: this.store,
        });
      case "mock":
        return new MockHealthcareModelAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockHealthcareModelAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de healthcare-model desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createHealthcareModelFactory(
  options: HealthcareModelFactoryOptions = {},
): HealthcareModelFactory {
  return new HealthcareModelFactory(options);
}
