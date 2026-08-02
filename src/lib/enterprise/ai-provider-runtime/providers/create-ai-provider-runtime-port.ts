/**
 * AIProviderRuntimeProvider — factory do Port (ARCH-02 / DIP-07).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters concretos no Domain.
 */
import { createAIProviderRuntimeFactory } from "../factory/ai-provider-runtime-factory";
import type { AIProviderRuntimePort } from "../ports/ai-provider-runtime-port";
import type { AIProviderRuntimeProviderOptions } from "../ports/types";

/**
 * Cria o AIProviderRuntimePort para o provedor solicitado.
 *
 * Default de produção: DefaultAIProviderRuntimeAdapter
 * (Orchestrator + AIProviderPort via enterpriseDeps).
 */
export function createAIProviderRuntimePort(
  options: AIProviderRuntimeProviderOptions = {},
): AIProviderRuntimePort {
  return createAIProviderRuntimeFactory({
    enterpriseDeps: options.enterpriseDeps,
  }).create(options);
}
