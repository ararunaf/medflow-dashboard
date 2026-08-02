/**
 * AIProviderRuntimeFactory — instancia o adapter correto (ARCH-02 / DIP-07).
 *
 * Sem lógica de negócio. Sem HTTP direto.
 * Posição na arquitetura:
 *   Enterprise Runtime → AIProviderRuntimePort → Adapter ← Factory ← Provider
 */
import { DefaultAIProviderRuntimeAdapter, MockAIProviderRuntimeAdapter } from "../adapters";
import type { AIProviderRuntimePort } from "../ports/ai-provider-runtime-port";
import type {
  AIProviderRuntimeEnterpriseDeps,
  AIProviderRuntimeProviderId,
  AIProviderRuntimeProviderOptions,
} from "../ports/types";
import type { AIProviderRuntimeStore } from "../store";

export type AIProviderRuntimeFactoryOptions = {
  defaultProvider?: AIProviderRuntimeProviderId;
  store?: AIProviderRuntimeStore;
  enterpriseDeps?: AIProviderRuntimeEnterpriseDeps;
};

export class AIProviderRuntimeFactory {
  private readonly defaultProvider: AIProviderRuntimeProviderId;
  private readonly store?: AIProviderRuntimeStore;
  private readonly enterpriseDeps?: AIProviderRuntimeEnterpriseDeps;

  constructor(options: AIProviderRuntimeFactoryOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? "default";
    this.store = options.store;
    this.enterpriseDeps = options.enterpriseDeps;
  }

  create(options: AIProviderRuntimeProviderOptions = {}): AIProviderRuntimePort {
    const provider = options.provider ?? this.defaultProvider;
    return this.instantiate(provider, options.enterpriseDeps ?? this.enterpriseDeps);
  }

  private instantiate(
    provider: AIProviderRuntimeProviderId,
    enterpriseDeps?: AIProviderRuntimeEnterpriseDeps,
  ): AIProviderRuntimePort {
    switch (provider) {
      case "default": {
        if (!enterpriseDeps) {
          throw new Error(
            'AIProviderRuntime provider "default" exige enterpriseDeps ' +
              "(getOrchestratorPort + getAIProviderPort). " +
              "Use createEnterpriseRuntime() / DI do composition root.",
          );
        }
        return new DefaultAIProviderRuntimeAdapter({
          enterpriseDeps,
          store: this.store,
        });
      }
      case "mock":
        return new MockAIProviderRuntimeAdapter({
          provider: "mock",
          store: this.store,
          enterpriseDeps,
        });
      case "test":
        return new MockAIProviderRuntimeAdapter({
          provider: "test",
          store: this.store,
          enterpriseDeps,
        });
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Provedor de ai-provider-runtime desconhecido: ${String(_exhaustive)}`);
      }
    }
  }
}

export function createAIProviderRuntimeFactory(
  options: AIProviderRuntimeFactoryOptions = {},
): AIProviderRuntimeFactory {
  return new AIProviderRuntimeFactory(options);
}
