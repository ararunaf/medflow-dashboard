/**
 * ExecutionPolicyRegistryFactory — instancia o adapter correto (EPC-24 Sprint 10).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem interpretação de políticas. Sem Rule Engine. Sem Decision Engine.
 * Posição na arquitetura:
 *   Application → ExecutionPolicyRegistryPort → Adapter ← Store ← Factory ← Provider
 */
import {
  DefaultExecutionPolicyRegistryAdapter,
  MockExecutionPolicyRegistryAdapter,
} from "../adapters";
import type { ExecutionPolicyRegistryPort } from "../ports/execution-policy-registry-port";
import type {
  ExecutionPolicyRegistryProviderId,
  ExecutionPolicyRegistryProviderOptions,
} from "../ports/types";
import type { ExecutionPolicyRegistryStore } from "../store";

export type ExecutionPolicyRegistryFactoryOptions = {
  defaultProvider?: ExecutionPolicyRegistryProviderId;
  store?: ExecutionPolicyRegistryStore;
};

export class ExecutionPolicyRegistryFactory {
  private readonly defaultProvider: ExecutionPolicyRegistryProviderId;
  private readonly store?: ExecutionPolicyRegistryStore;

  constructor(options: ExecutionPolicyRegistryFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(options: ExecutionPolicyRegistryProviderOptions = {}): ExecutionPolicyRegistryPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ExecutionPolicyRegistryProviderId): ExecutionPolicyRegistryPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionPolicyRegistryAdapter({ store: this.store });
      case "mock":
        return new MockExecutionPolicyRegistryAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockExecutionPolicyRegistryAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de execution-policy-registry desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionPolicyRegistryFactory(
  options: ExecutionPolicyRegistryFactoryOptions = {},
): ExecutionPolicyRegistryFactory {
  return new ExecutionPolicyRegistryFactory(options);
}
