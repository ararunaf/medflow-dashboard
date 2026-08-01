/**
 * ExecutionStateMachineFactory — instancia o adapter correto (EPC-24 Sprint 04).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Posição na arquitetura:
 *   Application → ExecutionStateMachinePort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultExecutionStateMachineAdapter, MockExecutionStateMachineAdapter } from "../adapters";
import type { ExecutionStateMachinePort } from "../ports/execution-state-machine-port";
import type {
  ExecutionStateMachineProviderId,
  ExecutionStateMachineProviderOptions,
} from "../ports/types";
import type { ExecutionStateMachineStore } from "../store";

export type ExecutionStateMachineFactoryOptions = {
  defaultProvider?: ExecutionStateMachineProviderId;
  store?: ExecutionStateMachineStore;
};

export class ExecutionStateMachineFactory {
  private readonly defaultProvider: ExecutionStateMachineProviderId;
  private readonly store?: ExecutionStateMachineStore;

  constructor(options: ExecutionStateMachineFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(options: ExecutionStateMachineProviderOptions = {}): ExecutionStateMachinePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ExecutionStateMachineProviderId): ExecutionStateMachinePort {
    switch (provider) {
      case "default":
        return new DefaultExecutionStateMachineAdapter({ store: this.store });
      case "mock":
        return new MockExecutionStateMachineAdapter({ provider: "mock", store: this.store });
      case "test":
        return new MockExecutionStateMachineAdapter({ provider: "test", store: this.store });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de execution-state-machine desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createExecutionStateMachineFactory(
  options: ExecutionStateMachineFactoryOptions = {},
): ExecutionStateMachineFactory {
  return new ExecutionStateMachineFactory(options);
}
