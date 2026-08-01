/**
 * ExecutionDependencyRegistryFactory — instancia o adapter correto (EPC-24 Sprint 09).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem resolução de dependências. Sem ordenação. Sem DAG.
 * Posição na arquitetura:
 *   Application → ExecutionDependencyRegistryPort → Adapter ← Store ← Factory ← Provider
 */
import {
  DefaultExecutionDependencyRegistryAdapter,
  MockExecutionDependencyRegistryAdapter,
} from "../adapters";
import type { ExecutionDependencyRegistryPort } from "../ports/execution-dependency-registry-port";
import type {
  ExecutionDependencyRegistryProviderId,
  ExecutionDependencyRegistryProviderOptions,
} from "../ports/types";
import type { ExecutionDependencyRegistryStore } from "../store";

export type ExecutionDependencyRegistryFactoryOptions = {
  defaultProvider?: ExecutionDependencyRegistryProviderId;
  store?: ExecutionDependencyRegistryStore;
};

export class ExecutionDependencyRegistryFactory {
  private readonly defaultProvider: ExecutionDependencyRegistryProviderId;
  private readonly store?: ExecutionDependencyRegistryStore;

  constructor(options: ExecutionDependencyRegistryFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(
    options: ExecutionDependencyRegistryProviderOptions = {},
  ): ExecutionDependencyRegistryPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(
    provider: ExecutionDependencyRegistryProviderId,
  ): ExecutionDependencyRegistryPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionDependencyRegistryAdapter({ store: this.store });
      case "mock":
        return new MockExecutionDependencyRegistryAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockExecutionDependencyRegistryAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de execution-dependency-registry desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionDependencyRegistryFactory(
  options: ExecutionDependencyRegistryFactoryOptions = {},
): ExecutionDependencyRegistryFactory {
  return new ExecutionDependencyRegistryFactory(options);
}
