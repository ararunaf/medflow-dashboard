/**
 * OpenAI stub adapter — EPC-07.
 * Implementa AIProviderPort. NÃO executa chamadas reais.
 */
import { StubAIProviderAdapter } from "./stub-ai-provider-adapter";

export const OPENAI_AI_PROVIDER_ADAPTER_ID = "openai-stub";

export class OpenAIAIProviderAdapter extends StubAIProviderAdapter {
  constructor() {
    super({
      providerId: "openai",
      adapterId: OPENAI_AI_PROVIDER_ADAPTER_ID,
      metadata: {
        name: "OpenAI",
        version: "0.0.0-stub",
        vendor: "openai",
        description: "Stub adapter — real HTTP/SDK out of scope for EPC-07.",
      },
      capabilities: [
        "text-generation",
        "structured-output",
        "vision",
        "streaming",
        "embeddings",
        "tool-calling",
        "json-mode",
      ],
      modalities: ["text", "image", "embedding"],
      status: "stub",
    });
  }
}
