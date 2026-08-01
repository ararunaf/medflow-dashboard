/**
 * ExecutionRequirementRegistryFactory — instancia o adapter correto (EPC-24 Sprint 12).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem validação de requisitos. Sem Rule Engine. Sem Decision Engine.
 * Posição na arquitetura:
 *   Application → ExecutionRequirementRegistryPort → Adapter ← Store ← Factory ← Provider
 */
import {
  DefaultExecutionRequirementRegistryAdapter,
  MockExecutionRequirementRegistryAdapter,
} from "../adapters";
import type { ExecutionRequirementRegistryPort } from "../ports/execution-requirement-registry-port";
import type {
  ExecutionRequirementRegistryProviderId,
  ExecutionRequirementRegistryProviderOptions,
} from "../ports/types";
import type { ExecutionRequirementRegistryStore } from "../store";

export type ExecutionRequirementRegistryFactoryOptions = {
  defaultProvider?: ExecutionRequirementRegistryProviderId;
  store?: ExecutionRequirementRegistryStore;
};

export class ExecutionRequirementRegistryFactory {
  private readonly defaultProvider: ExecutionRequirementRegistryProviderId;
  private readonly store?: ExecutionRequirementRegistryStore;

  constructor(options: ExecutionRequirementRegistryFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(
    options: ExecutionRequirementRegistryProviderOptions = {},
  ): ExecutionRequirementRegistryPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(
    provider: ExecutionRequirementRegistryProviderId,
  ): ExecutionRequirementRegistryPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionRequirementRegistryAdapter({ store: this.store });
      case "mock":
        return new MockExecutionRequirementRegistryAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockExecutionRequirementRegistryAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de execution-requirement-registry desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionRequirementRegistryFactory(
  options: ExecutionRequirementRegistryFactoryOptions = {},
): ExecutionRequirementRegistryFactory {
  return new ExecutionRequirementRegistryFactory(options);
}
