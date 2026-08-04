/**
 * AIOrchestrationRuntimeFactory — instancia o adapter correto (F3-CAP-09).
 *
 * Sem lógica de negócio. Sem IA real. Sem banco. Sem HTTP.
 * Posição na arquitetura:
 *   Application → Enterprise Runtime → AIOrchestrationRuntimePort → Adapter ← Factory ← Registry
 */
import {
  DefaultAIOrchestrationRuntimeAdapter,
  MockAIOrchestrationRuntimeAdapter,
} from "../adapters";
import type { AIOrchestrationRuntimePort } from "../ports/ai-orchestration-runtime-port";
import type {
  AIOrchestrationRuntimeEnterpriseDeps,
  AIOrchestrationRuntimeOptions,
  AIOrchestrationRuntimeProviderId,
} from "../ports/types";
import {
  AIOrchestrationRuntimeRegistry,
  createDefaultAIOrchestrationRuntimeRegistry,
} from "../registry/ai-orchestration-runtime-registry";
import type { AIOrchestrationRuntimeStore } from "../store";

export type AIOrchestrationRuntimeFactoryOptions = {
  registry?: AIOrchestrationRuntimeRegistry;
  /** Store compartilhado opcional. */
  store?: AIOrchestrationRuntimeStore;
  /** Ports Enterprise default para os providers default/enterprise. */
  enterpriseDeps?: AIOrchestrationRuntimeEnterpriseDeps;
};

/**
 * Factory responsável por materializar o AIOrchestrationRuntimePort pedido.
 */
export class AIOrchestrationRuntimeFactory {
  private readonly registry: AIOrchestrationRuntimeRegistry;
  private readonly store?: AIOrchestrationRuntimeStore;
  private readonly enterpriseDeps?: AIOrchestrationRuntimeEnterpriseDeps;

  constructor(options: AIOrchestrationRuntimeFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultAIOrchestrationRuntimeRegistry();
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  getRegistry(): AIOrchestrationRuntimeRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: AIOrchestrationRuntimeOptions = {}): AIOrchestrationRuntimePort {
    const provider = options.provider ?? "enterprise";

    if (!this.registry.has(provider)) {
      throw new Error(
        `AI Orchestration Runtime provider "${provider}" não está registrado no AIOrchestrationRuntimeRegistry.`,
      );
    }

    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: AIOrchestrationRuntimeProviderId,
    enterpriseDeps?: AIOrchestrationRuntimeEnterpriseDeps,
  ): AIOrchestrationRuntimePort {
    switch (provider) {
      case "mock":
        return new MockAIOrchestrationRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockAIOrchestrationRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      case "default":
        return new DefaultAIOrchestrationRuntimeAdapter({
          provider: "default",
          store: this.store,
          enterpriseDeps,
        });
      case "enterprise":
        return new DefaultAIOrchestrationRuntimeAdapter({
          provider: "enterprise",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`AI Orchestration Runtime provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createAIOrchestrationRuntimeFactory(
  options: AIOrchestrationRuntimeFactoryOptions = {},
): AIOrchestrationRuntimeFactory {
  return new AIOrchestrationRuntimeFactory(options);
}
