/**
 * ExecutionRegistryFactory — instancia o adapter correto (EPC-24 Sprint 06).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Posição na arquitetura:
 *   Application → ExecutionRegistryPort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultExecutionRegistryAdapter, MockExecutionRegistryAdapter } from "../adapters";
import type { ExecutionRegistryPort } from "../ports/execution-registry-port";
import type { ExecutionRegistryProviderId, ExecutionRegistryProviderOptions } from "../ports/types";
import type { ExecutionRegistryStore } from "../store";

export type ExecutionRegistryFactoryOptions = {
  defaultProvider?: ExecutionRegistryProviderId;
  store?: ExecutionRegistryStore;
};

export class ExecutionRegistryFactory {
  private readonly defaultProvider: ExecutionRegistryProviderId;
  private readonly store?: ExecutionRegistryStore;

  constructor(options: ExecutionRegistryFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(options: ExecutionRegistryProviderOptions = {}): ExecutionRegistryPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ExecutionRegistryProviderId): ExecutionRegistryPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionRegistryAdapter({ store: this.store });
      case "mock":
        return new MockExecutionRegistryAdapter({ provider: "mock", store: this.store });
      case "test":
        return new MockExecutionRegistryAdapter({ provider: "test", store: this.store });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de execution-registry desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createExecutionRegistryFactory(
  options: ExecutionRegistryFactoryOptions = {},
): ExecutionRegistryFactory {
  return new ExecutionRegistryFactory(options);
}
