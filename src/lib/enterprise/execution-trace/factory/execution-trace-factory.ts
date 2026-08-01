/**
 * ExecutionTraceFactory — instancia o adapter correto (EPC-24 Sprint 07).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Sem logs. Sem telemetria.
 * Posição na arquitetura:
 *   Application → ExecutionTracePort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultExecutionTraceAdapter, MockExecutionTraceAdapter } from "../adapters";
import type { ExecutionTracePort } from "../ports/execution-trace-port";
import type { ExecutionTraceProviderId, ExecutionTraceProviderOptions } from "../ports/types";
import type { ExecutionTraceStore } from "../store";

export type ExecutionTraceFactoryOptions = {
  defaultProvider?: ExecutionTraceProviderId;
  store?: ExecutionTraceStore;
};

export class ExecutionTraceFactory {
  private readonly defaultProvider: ExecutionTraceProviderId;
  private readonly store?: ExecutionTraceStore;

  constructor(options: ExecutionTraceFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  create(options: ExecutionTraceProviderOptions = {}): ExecutionTracePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ExecutionTraceProviderId): ExecutionTracePort {
    switch (provider) {
      case "default":
        return new DefaultExecutionTraceAdapter({ store: this.store });
      case "mock":
        return new MockExecutionTraceAdapter({ provider: "mock", store: this.store });
      case "test":
        return new MockExecutionTraceAdapter({ provider: "test", store: this.store });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de execution-trace desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createExecutionTraceFactory(
  options: ExecutionTraceFactoryOptions = {},
): ExecutionTraceFactory {
  return new ExecutionTraceFactory(options);
}
