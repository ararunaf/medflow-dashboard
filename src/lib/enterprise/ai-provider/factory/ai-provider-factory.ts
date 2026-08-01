/**
 * AIProviderFactory — instancia o adapter correto (EPC-07).
 *
 * Sem lógica de negócio. Sem HTTP. Sem chaves de API.
 * Posição na arquitetura:
 *   Application → AIProviderPort → Adapter ← Factory ← Registry
 */
import {
  AzureOpenAIAIProviderAdapter,
  ClaudeAIProviderAdapter,
  GeminiAIProviderAdapter,
  LMStudioAIProviderAdapter,
  MockAIProviderAdapter,
  OllamaAIProviderAdapter,
  OpenAIAIProviderAdapter,
} from "../adapters";
import type { AIProviderPort } from "../ports/ai-provider-port";
import type { AIProviderId, AIProviderOptions } from "../ports/types";
import {
  AIProviderRegistry,
  createDefaultAIProviderRegistry,
} from "../registry/ai-provider-registry";

export type AIProviderFactoryOptions = {
  registry?: AIProviderRegistry;
};

/**
 * Factory responsável por materializar o AIProviderPort pedido.
 */
export class AIProviderFactory {
  private readonly registry: AIProviderRegistry;

  constructor(options: AIProviderFactoryOptions = {}) {
    this.registry = options.registry ?? createDefaultAIProviderRegistry();
  }

  getRegistry(): AIProviderRegistry {
    return this.registry;
  }

  /**
   * Instancia o provider correto pelo id.
   * Providers desconhecidos falham explicitamente (sem fallback silencioso).
   */
  create(options: AIProviderOptions = {}): AIProviderPort {
    const provider = options.provider ?? "mock";

    if (!this.registry.has(provider)) {
      throw new Error(`AI provider "${provider}" não está registrado no AIProviderRegistry.`);
    }

    return this.instantiate(provider);
  }

  private instantiate(provider: AIProviderId): AIProviderPort {
    switch (provider) {
      case "mock":
        return new MockAIProviderAdapter({ provider: "mock" });
      case "test":
        return new MockAIProviderAdapter({ provider: "test" });
      case "openai":
        return new OpenAIAIProviderAdapter();
      case "azure-openai":
        return new AzureOpenAIAIProviderAdapter();
      case "gemini":
        return new GeminiAIProviderAdapter();
      case "claude":
        return new ClaudeAIProviderAdapter();
      case "ollama":
        return new OllamaAIProviderAdapter();
      case "lm-studio":
        return new LMStudioAIProviderAdapter();
      default: {
        const _exhaustive: never = provider;
        throw new Error(`AI provider desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

/** Factory default da fundação. */
export function createAIProviderFactory(options: AIProviderFactoryOptions = {}): AIProviderFactory {
  return new AIProviderFactory(options);
}
