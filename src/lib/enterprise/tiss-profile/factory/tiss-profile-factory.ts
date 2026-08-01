/**
 * TISSProfileFactory — instancia o adapter correto (EPC-22 / FASE 4).
 *
 * Sem lógica de negócio. Sem parser XML. Sem validação. Sem banco.
 * Posição na arquitetura:
 *   Application → TISSProfilePort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultTISSProfileAdapter, MockTISSProfileAdapter } from "../adapters";
import type { TISSProfilePort } from "../ports/tiss-profile-port";
import type { TISSProfileProviderId, TISSProfileProviderOptions } from "../ports/types";
import type { TISSProfileStore } from "../store";

export type TISSProfileFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: TISSProfileProviderId;
  /** Store compartilhado opcional. */
  store?: TISSProfileStore;
};

/**
 * Factory responsável por materializar o TISSProfilePort pedido.
 */
export class TISSProfileFactory {
  private readonly defaultProvider: TISSProfileProviderId;
  private readonly store?: TISSProfileStore;

  constructor(options: TISSProfileFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: TISSProfileProviderOptions = {}): TISSProfilePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: TISSProfileProviderId): TISSProfilePort {
    switch (provider) {
      case "default":
        return new DefaultTISSProfileAdapter({
          store: this.store,
        });
      case "mock":
        return new MockTISSProfileAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockTISSProfileAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de tiss-profile desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createTISSProfileFactory(
  options: TISSProfileFactoryOptions = {},
): TISSProfileFactory {
  return new TISSProfileFactory(options);
}
