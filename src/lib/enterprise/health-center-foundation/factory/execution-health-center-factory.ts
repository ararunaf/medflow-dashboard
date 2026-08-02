/**
 * ExecutionHealthCenterFactory — instancia o adapter correto (INF-05).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem monitoramento. Sem health checks. Sem backends reais de Health Center.
 * Posição na arquitetura:
 *   Application → ExecutionHealthCenterPort → Adapter ← Store ← Factory ← Provider
 */
import type { ExecutionObservabilityPort } from "../../observability-foundation/ports/execution-observability-port";
import { DefaultExecutionHealthCenterAdapter, MockExecutionHealthCenterAdapter } from "../adapters";
import type { ExecutionHealthCenterPort } from "../ports/execution-health-center-port";
import type {
  HealthCenterFoundationProviderId,
  HealthCenterFoundationProviderOptions,
} from "../ports/types";
import type { ExecutionHealthCenterStore } from "../store";

export type ExecutionHealthCenterFactoryOptions = {
  defaultProvider?: HealthCenterFoundationProviderId;
  store?: ExecutionHealthCenterStore;
  /** Port exclusivo do Observability Foundation (INF-04). */
  executionObservability?: ExecutionObservabilityPort;
};

export class ExecutionHealthCenterFactory {
  private readonly defaultProvider: HealthCenterFoundationProviderId;
  private readonly store?: ExecutionHealthCenterStore;
  private readonly executionObservability?: ExecutionObservabilityPort;

  constructor(options: ExecutionHealthCenterFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.executionObservability = options.executionObservability;
  }

  create(options: HealthCenterFoundationProviderOptions = {}): ExecutionHealthCenterPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: HealthCenterFoundationProviderId): ExecutionHealthCenterPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionHealthCenterAdapter({
          store: this.store,
          executionObservability: this.executionObservability,
        });
      case "mock":
        return new MockExecutionHealthCenterAdapter({
          provider: "mock",
          store: this.store,
          executionObservability: this.executionObservability,
        });
      case "test":
        return new MockExecutionHealthCenterAdapter({
          provider: "test",
          store: this.store,
          executionObservability: this.executionObservability,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(
          `Provedor de health-center-foundation desconhecido: ${String(_exhaustive)}`,
        );
      }
    }
  }
}

export function createExecutionHealthCenterFactory(
  options: ExecutionHealthCenterFactoryOptions = {},
): ExecutionHealthCenterFactory {
  return new ExecutionHealthCenterFactory(options);
}
