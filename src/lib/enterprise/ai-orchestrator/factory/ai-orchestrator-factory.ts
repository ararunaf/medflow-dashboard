/**
 * AIOrchestratorFactory — instancia o adapter correto (EPC-16).
 *
 * Sem lógica de negócio. Sem IA. Sem HTTP. Sem banco.
 * Posição na arquitetura:
 *   Application → AIOrchestratorPort → Adapter ← Store ← Factory ← Provider
 *     → AI Provider Framework (EPC-07)
 */
import type { AIProviderRegistry } from "../../ai-provider";
import { DefaultAIOrchestratorAdapter, MockAIOrchestratorAdapter } from "../adapters";
import type { AIOrchestratorPort } from "../ports/ai-orchestrator-port";
import type { AIOrchestratorProviderId, AIOrchestratorProviderOptions } from "../ports/types";
import type { AIOrchestratorStore } from "../store";

export type AIOrchestratorFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: AIOrchestratorProviderId;
  /** Store compartilhado opcional para o adapter default. */
  store?: AIOrchestratorStore;
  /** Registry EPC-07 compartilhado opcional. */
  registry?: AIProviderRegistry;
};

/**
 * Factory responsável por materializar o AIOrchestratorPort pedido.
 */
export class AIOrchestratorFactory {
  private readonly defaultProvider: AIOrchestratorProviderId;
  private readonly store?: AIOrchestratorStore;
  private readonly registry?: AIProviderRegistry;

  constructor(options: AIOrchestratorFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.registry = options.registry;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: AIOrchestratorProviderOptions = {}): AIOrchestratorPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: AIOrchestratorProviderId): AIOrchestratorPort {
    switch (provider) {
      case "default":
        return new DefaultAIOrchestratorAdapter({
          store: this.store,
          registry: this.registry,
        });
      case "mock":
        return new MockAIOrchestratorAdapter({
          provider: "mock",
          store: this.store,
          registry: this.registry,
        });
      case "test":
        return new MockAIOrchestratorAdapter({
          provider: "test",
          store: this.store,
          registry: this.registry,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de ai-orchestrator desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createAIOrchestratorFactory(
  options: AIOrchestratorFactoryOptions = {},
): AIOrchestratorFactory {
  return new AIOrchestratorFactory(options);
}
