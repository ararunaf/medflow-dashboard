/**
 * TISSRuleRuntimeFactory — instancia o adapter correto (EPC-23 / FASE 4).
 *
 * Sem lógica de negócio. Sem regras. Sem validação. Sem banco.
 * Posição na arquitetura:
 *   Application → TISSRuleRuntimePort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultTISSRuleRuntimeAdapter, MockTISSRuleRuntimeAdapter } from "../adapters";
import type { TISSRuleRuntimePort } from "../ports/tiss-rule-runtime-port";
import type { TISSRuleRuntimeProviderId, TISSRuleRuntimeProviderOptions } from "../ports/types";
import type { TISSRuleRuntimeStore } from "../store";

export type TISSRuleRuntimeFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: TISSRuleRuntimeProviderId;
  /** Store compartilhado opcional. */
  store?: TISSRuleRuntimeStore;
};

/**
 * Factory responsável por materializar o TISSRuleRuntimePort pedido.
 */
export class TISSRuleRuntimeFactory {
  private readonly defaultProvider: TISSRuleRuntimeProviderId;
  private readonly store?: TISSRuleRuntimeStore;

  constructor(options: TISSRuleRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: TISSRuleRuntimeProviderOptions = {}): TISSRuleRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: TISSRuleRuntimeProviderId): TISSRuleRuntimePort {
    switch (provider) {
      case "default":
        return new DefaultTISSRuleRuntimeAdapter({
          store: this.store,
        });
      case "mock":
        return new MockTISSRuleRuntimeAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockTISSRuleRuntimeAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de tiss-rule-runtime desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createTISSRuleRuntimeFactory(
  options: TISSRuleRuntimeFactoryOptions = {},
): TISSRuleRuntimeFactory {
  return new TISSRuleRuntimeFactory(options);
}
