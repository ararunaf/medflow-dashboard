/**
 * ExecutionWorkerFactory — instancia o adapter correto (INF-02).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem execução. Sem threads. Sem background jobs. Sem backends reais de Workers.
 * Posição na arquitetura:
 *   Application → ExecutionWorkerPort → Adapter ← Store ← Factory ← Provider
 */
import type { ExecutionQueuePort } from "../../message-queue/ports/execution-queue-port";
import { DefaultExecutionWorkerAdapter, MockExecutionWorkerAdapter } from "../adapters";
import type { ExecutionWorkerPort } from "../ports/execution-worker-port";
import type { WorkerFoundationProviderId, WorkerFoundationProviderOptions } from "../ports/types";
import type { ExecutionWorkerStore } from "../store";

export type ExecutionWorkerFactoryOptions = {
  defaultProvider?: WorkerFoundationProviderId;
  store?: ExecutionWorkerStore;
  /** Port exclusivo da Message Queue (INF-01). */
  executionQueue?: ExecutionQueuePort;
};

export class ExecutionWorkerFactory {
  private readonly defaultProvider: WorkerFoundationProviderId;
  private readonly store?: ExecutionWorkerStore;
  private readonly executionQueue?: ExecutionQueuePort;

  constructor(options: ExecutionWorkerFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.executionQueue = options.executionQueue;
  }

  create(options: WorkerFoundationProviderOptions = {}): ExecutionWorkerPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: WorkerFoundationProviderId): ExecutionWorkerPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionWorkerAdapter({
          store: this.store,
          executionQueue: this.executionQueue,
        });
      case "mock":
        return new MockExecutionWorkerAdapter({
          provider: "mock",
          store: this.store,
          executionQueue: this.executionQueue,
        });
      case "test":
        return new MockExecutionWorkerAdapter({
          provider: "test",
          store: this.store,
          executionQueue: this.executionQueue,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de worker-foundation desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createExecutionWorkerFactory(
  options: ExecutionWorkerFactoryOptions = {},
): ExecutionWorkerFactory {
  return new ExecutionWorkerFactory(options);
}
