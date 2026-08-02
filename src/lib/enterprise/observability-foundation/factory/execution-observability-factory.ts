/**
 * ExecutionObservabilityFactory — instancia o adapter correto (INF-04).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem logs. Sem métricas. Sem tracing. Sem backends reais de Observabilidade.
 * Posição na arquitetura:
 *   Application → ExecutionObservabilityPort → Adapter ← Store ← Factory ← Provider
 */
import type { ExecutionSchedulerPort } from "../../scheduler-foundation/ports/execution-scheduler-port";
import {
  DefaultExecutionObservabilityAdapter,
  MockExecutionObservabilityAdapter,
} from "../adapters";
import type { ExecutionObservabilityPort } from "../ports/execution-observability-port";
import type {
  ObservabilityFoundationProviderId,
  ObservabilityFoundationProviderOptions,
} from "../ports/types";
import type { ExecutionObservabilityStore } from "../store";

export type ExecutionObservabilityFactoryOptions = {
  defaultProvider?: ObservabilityFoundationProviderId;
  store?: ExecutionObservabilityStore;
  /** Port exclusivo do Scheduler Foundation (INF-03). */
  executionScheduler?: ExecutionSchedulerPort;
};

export class ExecutionObservabilityFactory {
  private readonly defaultProvider: ObservabilityFoundationProviderId;
  private readonly store?: ExecutionObservabilityStore;
  private readonly executionScheduler?: ExecutionSchedulerPort;

  constructor(options: ExecutionObservabilityFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.executionScheduler = options.executionScheduler;
  }

  create(options: ObservabilityFoundationProviderOptions = {}): ExecutionObservabilityPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ObservabilityFoundationProviderId): ExecutionObservabilityPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionObservabilityAdapter({
          store: this.store,
          executionScheduler: this.executionScheduler,
        });
      case "mock":
        return new MockExecutionObservabilityAdapter({
          provider: "mock",
          store: this.store,
          executionScheduler: this.executionScheduler,
        });
      case "test":
        return new MockExecutionObservabilityAdapter({
          provider: "test",
          store: this.store,
          executionScheduler: this.executionScheduler,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de observability-foundation desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionObservabilityFactory(
  options: ExecutionObservabilityFactoryOptions = {},
): ExecutionObservabilityFactory {
  return new ExecutionObservabilityFactory(options);
}
