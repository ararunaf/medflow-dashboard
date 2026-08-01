/**
 * ExecutionContextFactory — instancia o adapter correto (EPC-24 Sprint 03).
 *
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem banco.
 * Posição na arquitetura:
 *   Application → ExecutionContextPort → Adapter ← Store ← Factory ← Provider
 */
import { DefaultExecutionContextAdapter, MockExecutionContextAdapter } from "../adapters";
import type { ExecutionContextPort } from "../ports/execution-context-port";
import type { ExecutionContextProviderId, ExecutionContextProviderOptions } from "../ports/types";
import type { ExecutionContextStore } from "../store";

export type ExecutionContextFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: ExecutionContextProviderId;
  /** Store compartilhado opcional. */
  store?: ExecutionContextStore;
};

/**
 * Factory responsável por materializar o ExecutionContextPort pedido.
 */
export class ExecutionContextFactory {
  private readonly defaultProvider: ExecutionContextProviderId;
  private readonly store?: ExecutionContextStore;

  constructor(options: ExecutionContextFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: ExecutionContextProviderOptions = {}): ExecutionContextPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: ExecutionContextProviderId): ExecutionContextPort {
    switch (provider) {
      case "default":
        return new DefaultExecutionContextAdapter({
          store: this.store,
        });
      case "mock":
        return new MockExecutionContextAdapter({
          provider: "mock",
          store: this.store,
        });
      case "test":
        return new MockExecutionContextAdapter({
          provider: "test",
          store: this.store,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de execution-context desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createExecutionContextFactory(
  options: ExecutionContextFactoryOptions = {},
): ExecutionContextFactory {
  return new ExecutionContextFactory(options);
}
