/**
 * ExecutionEventBusFactory — instancia o adapter correto (EPC-24 Sprint 05).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Posição na arquitetura:
 *   Application → ExecutionEventBusPort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultExecutionEventBusAdapter, MockExecutionEventBusAdapter } from "../adapters";
import type { ExecutionEventBusPort } from "../ports/execution-event-bus-port";
import type { ExecutionEventBusProviderId, ExecutionEventBusProviderOptions } from "../ports/types";
import type { ExecutionEventBusStore } from "../store";

export type ExecutionEventBusFactoryOptions = {
  defaultProvider?: ExecutionEventBusProviderId;
  store?: ExecutionEventBusStore;
};

export class ExecutionEventBusFactory {
  private readonly defaultProvider: ExecutionEventBusProviderId;
  private readonly store?: ExecutionEventBusStore;

  constructor(options: ExecutionEventBusFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(options: ExecutionEventBusProviderOptions = {}): ExecutionEventBusPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ExecutionEventBusProviderId): ExecutionEventBusPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionEventBusAdapter({ store: this.store });
      case "mock":
        return new MockExecutionEventBusAdapter({ provider: "mock", store: this.store });
      case "test":
        return new MockExecutionEventBusAdapter({ provider: "test", store: this.store });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de execution-event-bus desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createExecutionEventBusFactory(
  options: ExecutionEventBusFactoryOptions = {},
): ExecutionEventBusFactory {
  return new ExecutionEventBusFactory(options);
}
