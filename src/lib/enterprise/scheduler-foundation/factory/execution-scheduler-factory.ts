/**
 * ExecutionSchedulerFactory — instancia o adapter correto (INF-03).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem execução. Sem cron. Sem timers. Sem backends reais de Scheduler.
 * Posição na arquitetura:
 *   Application → ExecutionSchedulerPort → Adapter ← Store ← Factory ← Provider
 */
import type { ExecutionWorkerPort } from "../../worker-foundation/ports/execution-worker-port";
import { DefaultExecutionSchedulerAdapter, MockExecutionSchedulerAdapter } from "../adapters";
import type { ExecutionSchedulerPort } from "../ports/execution-scheduler-port";
import type {
  SchedulerFoundationProviderId,
  SchedulerFoundationProviderOptions,
} from "../ports/types";
import type { ExecutionSchedulerStore } from "../store";

export type ExecutionSchedulerFactoryOptions = {
  defaultProvider?: SchedulerFoundationProviderId;
  store?: ExecutionSchedulerStore;
  /** Port exclusivo do Worker Foundation (INF-02). */
  executionWorker?: ExecutionWorkerPort;
};

export class ExecutionSchedulerFactory {
  private readonly defaultProvider: SchedulerFoundationProviderId;
  private readonly store?: ExecutionSchedulerStore;
  private readonly executionWorker?: ExecutionWorkerPort;

  constructor(options: ExecutionSchedulerFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.executionWorker = options.executionWorker;
  }

  create(options: SchedulerFoundationProviderOptions = {}): ExecutionSchedulerPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: SchedulerFoundationProviderId): ExecutionSchedulerPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionSchedulerAdapter({
          store: this.store,
          executionWorker: this.executionWorker,
        });
      case "mock":
        return new MockExecutionSchedulerAdapter({
          provider: "mock",
          store: this.store,
          executionWorker: this.executionWorker,
        });
      case "test":
        return new MockExecutionSchedulerAdapter({
          provider: "test",
          store: this.store,
          executionWorker: this.executionWorker,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de scheduler-foundation desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createExecutionSchedulerFactory(
  options: ExecutionSchedulerFactoryOptions = {},
): ExecutionSchedulerFactory {
  return new ExecutionSchedulerFactory(options);
}
