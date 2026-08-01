/**
 * Google Gemini stub adapter — EPC-07.
 * Implementa AIProviderPort. NÃO executa chamadas reais.
 */
import { StubAIProviderAdapter } from "./stub-ai-provider-adapter";

export const GEMINI_AI_PROVIDER_ADAPTER_ID = "gemini-stub";

export class GeminiAIProviderAdapter extends StubAIProviderAdapter {
  constructor() {
    super({
      providerId: "gemini",
      adapterId: GEMINI_AI_PROVIDER_ADAPTER_ID,
      metadata: {
        name: "Google Gemini",
        version: "0.0.0-stub",
        vendor: "google",
        description: "Stub adapter — real HTTP/SDK out of scope for EPC-07.",
      },
      capabilities: [
        "text-generation",
        "structured-output",
        "vision",
        "document-analysis",
        "streaming",
        "embeddings",
        "tool-calling",
        "json-mode",
      ],
      modalities: ["text", "image", "document", "embedding"],
      status: "stub",
    });
  }
}
