/**
 * ContractRuleBindingFactory — instancia o adapter correto (EPC-17).
 *
 * Sem lógica de negócio. Sem Rule Engine. Sem banco.
 * Sem carregamento de Contratos / Rule Packs / Expression Engine.
 * Posição na arquitetura:
 *   Application → ContractRuleBindingPort → Adapter ← Factory ← Provider
 */
import { DefaultContractRuleBindingAdapter, MockContractRuleBindingAdapter } from "../adapters";
import type { ContractRuleBindingPort } from "../ports/contract-rule-binding-port";
import type {
  ContractRuleBindingProviderId,
  ContractRuleBindingProviderOptions,
} from "../ports/types";

export type ContractRuleBindingFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: ContractRuleBindingProviderId;
};

/**
 * Factory responsável por materializar o ContractRuleBindingPort pedido.
 */
export class ContractRuleBindingFactory {
  private readonly defaultProvider: ContractRuleBindingProviderId;

  constructor(options: ContractRuleBindingFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: ContractRuleBindingProviderOptions = {}): ContractRuleBindingPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ContractRuleBindingProviderId): ContractRuleBindingPort {
    switch (provider) {
      case "default":
        return new DefaultContractRuleBindingAdapter();
      case "mock":
        return new MockContractRuleBindingAdapter({ provider: "mock" });
      case "test":
        return new MockContractRuleBindingAdapter({ provider: "test" });
      case "database":
      case "remote":
      case "registry":
        throw new Error(
          `ContractRuleBinding adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de contract-rule-binding desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da camada. */
export function createContractRuleBindingFactory(
  options: ContractRuleBindingFactoryOptions = {},
): ContractRuleBindingFactory {
  return new ContractRuleBindingFactory(options);
}
