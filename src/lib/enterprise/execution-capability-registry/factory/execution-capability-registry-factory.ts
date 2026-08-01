/**
 * ExecutionCapabilityRegistryFactory — instancia o adapter correto (EPC-24 Sprint 08).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem descoberta automática. Sem reflexão. Sem plugins.
 * Posição na arquitetura:
 *   Application → ExecutionCapabilityRegistryPort → Adapter ← Store ← Factory ← Provider
 */
import {
  DefaultExecutionCapabilityRegistryAdapter,
  MockExecutionCapabilityRegistryAdapter,
} from "../adapters";
import type { ExecutionCapabilityRegistryPort } from "../ports/execution-capability-registry-port";
import type {
  ExecutionCapabilityRegistryProviderId,
  ExecutionCapabilityRegistryProviderOptions,
} from "../ports/types";
import type { ExecutionCapabilityRegistryStore } from "../store";

export type ExecutionCapabilityRegistryFactoryOptions = {
  defaultProvider?: ExecutionCapabilityRegistryProviderId;
  store?: ExecutionCapabilityRegistryStore;
};

export class ExecutionCapabilityRegistryFactory {
  private readonly defaultProvider: ExecutionCapabilityRegistryProviderId;
  private readonly store?: ExecutionCapabilityRegistryStore;

  constructor(options: ExecutionCapabilityRegistryFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(
    options: ExecutionCapabilityRegistryProviderOptions = {},
  ): ExecutionCapabilityRegistryPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(
    provider: ExecutionCapabilityRegistryProviderId,
  ): ExecutionCapabilityRegistryPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionCapabilityRegistryAdapter({ store: this.store });
      case "mock":
        return new MockExecutionCapabilityRegistryAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockExecutionCapabilityRegistryAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de execution-capability-registry desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionCapabilityRegistryFactory(
  options: ExecutionCapabilityRegistryFactoryOptions = {},
): ExecutionCapabilityRegistryFactory {
  return new ExecutionCapabilityRegistryFactory(options);
}
