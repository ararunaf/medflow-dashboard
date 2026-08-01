/**
 * AIAuditorFactory — instancia o adapter correto (EPC-18 / FASE 4).
 *
 * Sem lógica de negócio. Sem IA. Sem HTTP. Sem banco.
 * Posição na arquitetura:
 *   Application → AIAuditorPort → Adapter ← Store ← Factory ← Provider
 *     → AI Orchestrator → AI Provider Framework
 */
import type { AIOrchestratorPort } from "../../ai-orchestrator";
import { DefaultMockAIAuditorAdapter, MockAIAuditorAdapter } from "../adapters";
import type { AIAuditorPort } from "../ports/ai-auditor-port";
import type { AIAuditorProviderId, AIAuditorProviderOptions } from "../ports/types";
import type { AIAuditorStore } from "../store";

export type AIAuditorFactoryOptions = {
  /** Override do default provider quando options.provider omitido. */
  defaultProvider?: AIAuditorProviderId;
  /** Store compartilhado opcional. */
  store?: AIAuditorStore;
  /** AI Orchestrator compartilhado opcional (EPC-16). */
  orchestrator?: AIOrchestratorPort;
};

/**
 * Factory responsável por materializar o AIAuditorPort pedido.
 */
export class AIAuditorFactory {
  private readonly defaultProvider: AIAuditorProviderId;
  private readonly store?: AIAuditorStore;
  private readonly orchestrator?: AIOrchestratorPort;

  constructor(options: AIAuditorFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.orchestrator = options.orchestrator;
  }

  /**
   * Instancia o mecanismo correto pelo id.
   * Mecanismos desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: AIAuditorProviderOptions = {}): AIAuditorPort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider);
  }

  private instantiate(provider: AIAuditorProviderId): AIAuditorPort {
    switch (provider) {
      case "default":
        return new DefaultMockAIAuditorAdapter({
          store: this.store,
          orchestrator: this.orchestrator,
        });
      case "mock":
        return new MockAIAuditorAdapter({
          provider: "mock",
          store: this.store,
          orchestrator: this.orchestrator,
        });
      case "test":
        return new MockAIAuditorAdapter({
          provider: "test",
          store: this.store,
          orchestrator: this.orchestrator,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de ai-auditor desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createAIAuditorFactory(options: AIAuditorFactoryOptions = {}): AIAuditorFactory {
  return new AIAuditorFactory(options);
}
