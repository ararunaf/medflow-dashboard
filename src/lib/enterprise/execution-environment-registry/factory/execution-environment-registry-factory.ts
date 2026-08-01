/**
 * ExecutionEnvironmentRegistryFactory — instancia o adapter correto (EPC-24 Sprint 14).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem seleção de ambientes. Sem seleção de ambientes. Sem ativação de ambientes.
 * Posição na arquitetura:
 *   Application → ExecutionEnvironmentRegistryPort → Adapter ← Store ← Factory ← Provider
 */
import {
  DefaultExecutionEnvironmentRegistryAdapter,
  MockExecutionEnvironmentRegistryAdapter,
} from "../adapters";
import type { ExecutionEnvironmentRegistryPort } from "../ports/execution-environment-registry-port";
import type {
  ExecutionEnvironmentRegistryProviderId,
  ExecutionEnvironmentRegistryProviderOptions,
} from "../ports/types";
import type { ExecutionEnvironmentRegistryStore } from "../store";

export type ExecutionEnvironmentRegistryFactoryOptions = {
  defaultProvider?: ExecutionEnvironmentRegistryProviderId;
  store?: ExecutionEnvironmentRegistryStore;
};

export class ExecutionEnvironmentRegistryFactory {
  private readonly defaultProvider: ExecutionEnvironmentRegistryProviderId;
  private readonly store?: ExecutionEnvironmentRegistryStore;

  constructor(options: ExecutionEnvironmentRegistryFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(
    options: ExecutionEnvironmentRegistryProviderOptions = {},
  ): ExecutionEnvironmentRegistryPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(
    provider: ExecutionEnvironmentRegistryProviderId,
  ): ExecutionEnvironmentRegistryPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionEnvironmentRegistryAdapter({ store: this.store });
      case "mock":
        return new MockExecutionEnvironmentRegistryAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockExecutionEnvironmentRegistryAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de execution-environment-registry desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionEnvironmentRegistryFactory(
  options: ExecutionEnvironmentRegistryFactoryOptions = {},
): ExecutionEnvironmentRegistryFactory {
  return new ExecutionEnvironmentRegistryFactory(options);
}
