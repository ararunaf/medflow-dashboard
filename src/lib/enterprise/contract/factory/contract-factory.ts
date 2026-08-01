/**
 * ContractFactory — instancia o adapter correto (EPC-11).
 *
 * Sem lógica de negócio. Sem regras. Sem validação. Sem banco.
 * Posição na arquitetura:
 *   Application → ContractPort → Adapter ← Factory ← Provider
 */
import { DefaultContractAdapter, MockContractAdapter } from "../adapters";
import type { ContractPort } from "../ports/contract-port";
import type { ContractProviderId, ContractProviderOptions } from "../ports/types";

export type ContractFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: ContractProviderId;
};

/**
 * Factory responsável por materializar o ContractPort pedido.
 */
export class ContractFactory {
  private readonly defaultProvider: ContractProviderId;

  constructor(options: ContractFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos / futuros falham explicitamente (sem fallback silencioso).
   */
  create(options: ContractProviderOptions = {}): ContractPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ContractProviderId): ContractPort {
    switch (provider) {
      case "default":
        return new DefaultContractAdapter();
      case "mock":
        return new MockContractAdapter({ provider: "mock" });
      case "test":
        return new MockContractAdapter({ provider: "test" });
      case "database":
      case "remote":
      case "registry":
        throw new Error(
          `Contract adapter para "${provider}" ainda não implementado. ` +
            `Use "default" (produção) ou "mock"/"test" até a sprint correspondente.`,
        );
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de contract desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createContractFactory(options: ContractFactoryOptions = {}): ContractFactory {
  return new ContractFactory(options);
}
