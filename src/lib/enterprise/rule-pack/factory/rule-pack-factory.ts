/**
 * RulePackFactory — instancia o adapter correto (EPC-09).
 *
 * Sem lógica de negócio. Sem regras. Sem Rule Engine novo. Sem banco.
 * Posição na arquitetura:
 *   Application → RulePackPort → Adapter ← Factory ← Provider
 */
import { DefaultRulePackAdapter, MockRulePackAdapter } from "../adapters";
import type { RulePackPort } from "../ports/rule-pack-port";
import type { RulePackProviderId, RulePackProviderOptions } from "../ports/types";

export type RulePackFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: RulePackProviderId;
};

/**
 * Factory responsável por materializar o RulePackPort pedido.
 */
export class RulePackFactory {
  private readonly defaultProvider: RulePackProviderId;

  constructor(options: RulePackFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: RulePackProviderOptions = {}): RulePackPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: RulePackProviderId): RulePackPort {
    switch (provider) {
      case "default":
        return new DefaultRulePackAdapter();
      case "mock":
        return new MockRulePackAdapter({ provider: "mock" });
      case "test":
        return new MockRulePackAdapter({ provider: "test" });
      case "database":
      case "remote":
      case "registry":
        throw new Error(
          `Rule Pack adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de rule-pack desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createRulePackFactory(options: RulePackFactoryOptions = {}): RulePackFactory {
  return new RulePackFactory(options);
}
