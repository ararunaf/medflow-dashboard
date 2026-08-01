/**
 * Anthropic Claude stub adapter — EPC-07.
 * Implementa AIProviderPort. NÃO executa chamadas reais.
 */
import { StubAIProviderAdapter } from "./stub-ai-provider-adapter";

export const CLAUDE_AI_PROVIDER_ADAPTER_ID = "claude-stub";

export class ClaudeAIProviderAdapter extends StubAIProviderAdapter {
  constructor() {
    super({
      providerId: "claude",
      adapterId: CLAUDE_AI_PROVIDER_ADAPTER_ID,
      metadata: {
        name: "Anthropic Claude",
        version: "0.0.0-stub",
        vendor: "anthropic",
        description: "Stub adapter — real HTTP/SDK out of scope for EPC-07.",
      },
      capabilities: [
        "text-generation",
        "structured-output",
        "vision",
        "document-analysis",
        "streaming",
        "tool-calling",
        "json-mode",
      ],
      modalities: ["text", "image", "document"],
      status: "stub",
    });
  }
}
