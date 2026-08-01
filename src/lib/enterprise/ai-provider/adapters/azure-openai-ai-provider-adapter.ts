/**
 * Azure OpenAI stub adapter — EPC-07.
 * Implementa AIProviderPort. NÃO executa chamadas reais.
 */
import { StubAIProviderAdapter } from "./stub-ai-provider-adapter";

export const AZURE_OPENAI_AI_PROVIDER_ADAPTER_ID = "azure-openai-stub";

export class AzureOpenAIAIProviderAdapter extends StubAIProviderAdapter {
  constructor() {
    super({
      providerId: "azure-openai",
      adapterId: AZURE_OPENAI_AI_PROVIDER_ADAPTER_ID,
      metadata: {
        name: "Azure OpenAI",
        version: "0.0.0-stub",
        vendor: "microsoft-azure",
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
