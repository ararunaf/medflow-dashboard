/**
 * DefaultMockAIProvider / MockAIProviderAdapter — EPC-07.
 *
 * Retornos determinísticos. Sem chamadas externas. Sem internet. Sem IA real.
 * Alias oficial da sprint: DefaultMockAIProvider.
 */
import type { AICapabilityId } from "../ports/capabilities";
import type { AIProviderPort } from "../ports/ai-provider-port";
import type {
  AIConfigurationValidation,
  AIModality,
  AIProviderCapabilities,
  AIProviderHealth,
  AIProviderId,
  AIProviderInfo,
  AIProviderMetadata,
  AIRequest,
  AIResponse,
} from "../ports/types";

export const MOCK_AI_PROVIDER_ADAPTER_ID = "mock-deterministic";
export const DEFAULT_MOCK_AI_PROVIDER_VERSION = "1.0.0";

const MOCK_CAPABILITIES: readonly AICapabilityId[] = [
  "text-generation",
  "structured-output",
  "vision",
  "document-analysis",
  "streaming",
  "embeddings",
  "tool-calling",
  "json-mode",
];

const MOCK_MODALITIES: readonly AIModality[] = ["text", "image", "document", "embedding"];

export type MockAIProviderAdapterOptions = {
  provider?: Extract<AIProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
};

function mockMetadata(providerId: Extract<AIProviderId, "mock" | "test">): AIProviderMetadata {
  return {
    name: providerId === "test" ? "Test AI Provider" : "Default Mock AI Provider",
    version: DEFAULT_MOCK_AI_PROVIDER_VERSION,
    vendor: "medicflow-enterprise",
    description: "Deterministic in-process mock — no network, no API keys.",
  };
}

function extractPromptText(request: AIRequest): string {
  if (typeof request.prompt === "string" && request.prompt.length > 0) {
    return request.prompt;
  }
  if (request.messages && request.messages.length > 0) {
    return request.messages.map((m) => m.content).join("\n");
  }
  return "";
}

/**
 * Mock determinístico. Também exportado como `DefaultMockAIProvider`.
 */
export class MockAIProviderAdapter implements AIProviderPort {
  readonly providerId: Extract<AIProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: AIProviderMetadata;

  constructor(options: MockAIProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} AI provider ready (deterministic).`;
    this.metadata = mockMetadata(this.providerId);
  }

  capabilities(): AIProviderCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_AI_PROVIDER_ADAPTER_ID,
      capabilities: MOCK_CAPABILITIES,
      modalities: MOCK_MODALITIES,
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      supportsEmbeddings: true,
      supportsToolCalling: true,
      supportsJsonMode: true,
    };
  }

  providerInfo(): AIProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      modalities: MOCK_MODALITIES,
      capabilities: MOCK_CAPABILITIES,
    };
  }

  supports(capability: AICapabilityId): boolean {
    return MOCK_CAPABILITIES.includes(capability);
  }

  async health(): Promise<AIProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy ? "ready" : "unhealthy",
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<AIConfigurationValidation> {
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: "Mock provider não requer configuração externa.",
    };
  }

  async invoke(request: AIRequest): Promise<AIResponse> {
    if (!this.healthy) {
      return {
        ok: false,
        requestId: request.requestId,
        provider: this.providerId,
        model: request.model ?? "mock-model",
        simulated: true,
        metadata: this.metadata,
        message: "Mock provider unhealthy.",
      };
    }

    const capability = request.capability ?? "text-generation";
    if (!this.supports(capability)) {
      return {
        ok: false,
        requestId: request.requestId,
        provider: this.providerId,
        simulated: true,
        metadata: this.metadata,
        message: `Capability não suportada: ${capability}`,
      };
    }

    const promptText = extractPromptText(request);
    const promptTokens = Math.max(1, promptText.length);
    const completionTokens = 24;

    if (capability === "embeddings") {
      return {
        ok: true,
        requestId: request.requestId,
        provider: this.providerId,
        model: request.model ?? "mock-embeddings",
        simulated: true,
        data: {
          vector: [0.1, 0.2, 0.3, 0.4],
          dimensions: 4,
        },
        usage: {
          promptTokens,
          totalTokens: promptTokens,
        },
        metadata: this.metadata,
        message: "Deterministic mock embeddings.",
      };
    }

    if (
      request.responseFormat === "json" ||
      request.responseFormat === "structured" ||
      capability === "structured-output" ||
      capability === "json-mode"
    ) {
      return {
        ok: true,
        requestId: request.requestId,
        provider: this.providerId,
        model: request.model ?? "mock-structured",
        content: JSON.stringify({ ok: true, echo: promptText.slice(0, 64), capability }),
        data: { ok: true, echo: promptText.slice(0, 64), capability },
        simulated: true,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        metadata: this.metadata,
        message: "Deterministic mock structured output.",
      };
    }

    return {
      ok: true,
      requestId: request.requestId,
      provider: this.providerId,
      model: request.model ?? "mock-text",
      content: `MOCK:${capability}:${promptText.slice(0, 128)}`,
      simulated: true,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      metadata: this.metadata,
      message: "Deterministic mock text generation.",
    };
  }
}

/** Alias oficial da sprint EPC-07. */
export { MockAIProviderAdapter as DefaultMockAIProvider };
