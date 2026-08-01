/**
 * TISSVocabularyFactory — instancia o adapter correto (EPC-20 / FASE 4).
 *
 * Sem lógica de negócio. Sem parser XML. Sem validação. Sem banco.
 * Posição na arquitetura:
 *   Application → TISSVocabularyPort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultTISSVocabularyAdapter, MockTISSVocabularyAdapter } from "../adapters";
import type { TISSVocabularyPort } from "../ports/tiss-vocabulary-port";
import type { TISSVocabularyProviderId, TISSVocabularyProviderOptions } from "../ports/types";
import type { TISSVocabularyStore } from "../store";

export type TISSVocabularyFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: TISSVocabularyProviderId;
  /** Store compartilhado opcional. */
  store?: TISSVocabularyStore;
};

/**
 * Factory responsável por materializar o TISSVocabularyPort pedido.
 */
export class TISSVocabularyFactory {
  private readonly defaultProvider: TISSVocabularyProviderId;
  private readonly store?: TISSVocabularyStore;

  constructor(options: TISSVocabularyFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: TISSVocabularyProviderOptions = {}): TISSVocabularyPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: TISSVocabularyProviderId): TISSVocabularyPort {
    switch (provider) {
      case "default":
        return new DefaultTISSVocabularyAdapter({
          store: this.store,
        });
      case "mock":
        return new MockTISSVocabularyAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockTISSVocabularyAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de tiss-vocabulary desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createTISSVocabularyFactory(
  options: TISSVocabularyFactoryOptions = {},
): TISSVocabularyFactory {
  return new TISSVocabularyFactory(options);
}
