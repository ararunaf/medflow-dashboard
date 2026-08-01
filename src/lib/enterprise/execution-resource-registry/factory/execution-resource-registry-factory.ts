/**
 * ExecutionResourceRegistryFactory — instancia o adapter correto (EPC-24 Sprint 13).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem validação de recursos. Sem alocação de recursos. Sem balanceamento de carga.
 * Posição na arquitetura:
 *   Application → ExecutionResourceRegistryPort → Adapter ← Store ← Factory ← Provider
 */
import {
  DefaultExecutionResourceRegistryAdapter,
  MockExecutionResourceRegistryAdapter,
} from "../adapters";
import type { ExecutionResourceRegistryPort } from "../ports/execution-resource-registry-port";
import type {
  ExecutionResourceRegistryProviderId,
  ExecutionResourceRegistryProviderOptions,
} from "../ports/types";
import type { ExecutionResourceRegistryStore } from "../store";

export type ExecutionResourceRegistryFactoryOptions = {
  defaultProvider?: ExecutionResourceRegistryProviderId;
  store?: ExecutionResourceRegistryStore;
};

export class ExecutionResourceRegistryFactory {
  private readonly defaultProvider: ExecutionResourceRegistryProviderId;
  private readonly store?: ExecutionResourceRegistryStore;

  constructor(options: ExecutionResourceRegistryFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(options: ExecutionResourceRegistryProviderOptions = {}): ExecutionResourceRegistryPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(
    provider: ExecutionResourceRegistryProviderId,
  ): ExecutionResourceRegistryPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionResourceRegistryAdapter({ store: this.store });
      case "mock":
        return new MockExecutionResourceRegistryAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockExecutionResourceRegistryAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de execution-resource-registry desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionResourceRegistryFactory(
  options: ExecutionResourceRegistryFactoryOptions = {},
): ExecutionResourceRegistryFactory {
  return new ExecutionResourceRegistryFactory(options);
}
