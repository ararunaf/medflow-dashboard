/**
 * ExecutionConstraintRegistryFactory — instancia o adapter correto (EPC-24 Sprint 11).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem interpretação de restrições. Sem Rule Engine. Sem Decision Engine.
 * Posição na arquitetura:
 *   Application → ExecutionConstraintRegistryPort → Adapter ← Store ← Factory ← Provider
 */
import {
  DefaultExecutionConstraintRegistryAdapter,
  MockExecutionConstraintRegistryAdapter,
} from "../adapters";
import type { ExecutionConstraintRegistryPort } from "../ports/execution-constraint-registry-port";
import type {
  ExecutionConstraintRegistryProviderId,
  ExecutionConstraintRegistryProviderOptions,
} from "../ports/types";
import type { ExecutionConstraintRegistryStore } from "../store";

export type ExecutionConstraintRegistryFactoryOptions = {
  defaultProvider?: ExecutionConstraintRegistryProviderId;
  store?: ExecutionConstraintRegistryStore;
};

export class ExecutionConstraintRegistryFactory {
  private readonly defaultProvider: ExecutionConstraintRegistryProviderId;
  private readonly store?: ExecutionConstraintRegistryStore;

  constructor(options: ExecutionConstraintRegistryFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(
    options: ExecutionConstraintRegistryProviderOptions = {},
  ): ExecutionConstraintRegistryPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(
    provider: ExecutionConstraintRegistryProviderId,
  ): ExecutionConstraintRegistryPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionConstraintRegistryAdapter({ store: this.store });
      case "mock":
        return new MockExecutionConstraintRegistryAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockExecutionConstraintRegistryAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de execution-constraint-registry desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionConstraintRegistryFactory(
  options: ExecutionConstraintRegistryFactoryOptions = {},
): ExecutionConstraintRegistryFactory {
  return new ExecutionConstraintRegistryFactory(options);
}
