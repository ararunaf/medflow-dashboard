/**
 * Provider / factory pública do AIProviderPort — inversão de dependência (EPC-07).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * de vendor diretamente no Domain.
 */
import { AIProviderFactory, createAIProviderFactory } from "../factory/ai-provider-factory";
import type { AIProviderPort } from "../ports/ai-provider-port";
import type { AIProviderOptions } from "../ports/types";

let sharedFactory: AIProviderFactory | undefined;

function getSharedFactory(): AIProviderFactory {
  if (!sharedFactory) {
    sharedFactory = createAIProviderFactory();
  }
  return sharedFactory;
}

/**
 * Cria o AIProviderPort para o provedor solicitado.
 *
 * Default da fundação: `mock` (determinístico, sem rede).
 * Provider `openai` usa o Adapter oficial com chat.completions (ARCH-02).
 */
export function createAIProviderPort(options: AIProviderOptions = {}): AIProviderPort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getAIProviderFactory(): AIProviderFactory {
  return getSharedFactory();
}
