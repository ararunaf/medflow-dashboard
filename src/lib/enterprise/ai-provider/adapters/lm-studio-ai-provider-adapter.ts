/**
 * LM Studio stub adapter — EPC-07.
 * Implementa AIProviderPort. NÃO executa chamadas reais.
 */
import { StubAIProviderAdapter } from "./stub-ai-provider-adapter";

export const LM_STUDIO_AI_PROVIDER_ADAPTER_ID = "lm-studio-stub";

export class LMStudioAIProviderAdapter extends StubAIProviderAdapter {
  constructor() {
    super({
      providerId: "lm-studio",
      adapterId: LM_STUDIO_AI_PROVIDER_ADAPTER_ID,
      metadata: {
        name: "LM Studio",
        version: "0.0.0-stub",
        vendor: "lm-studio",
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
