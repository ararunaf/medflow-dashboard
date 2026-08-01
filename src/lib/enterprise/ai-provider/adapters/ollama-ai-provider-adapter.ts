/**
 * Ollama stub adapter — EPC-07.
 * Implementa AIProviderPort. NÃO executa chamadas reais.
 */
import { StubAIProviderAdapter } from "./stub-ai-provider-adapter";

export const OLLAMA_AI_PROVIDER_ADAPTER_ID = "ollama-stub";

export class OllamaAIProviderAdapter extends StubAIProviderAdapter {
  constructor() {
    super({
      providerId: "ollama",
      adapterId: OLLAMA_AI_PROVIDER_ADAPTER_ID,
      metadata: {
        name: "Ollama",
        version: "0.0.0-stub",
        vendor: "ollama",
        description: "Stub adapter — real HTTP/SDK out of scope for EPC-07.",
      },
      capabilities: [
        "text-generation",
        "structured-output",
        "streaming",
        "embeddings",
        "json-mode",
      ],
      modalities: ["text", "embedding"],
      status: "stub",
    });
  }
}
