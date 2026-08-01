/**
 * Base stub para adapters vendor — EPC-07.
 *
 * Implementa AIProviderPort sem chamadas HTTP, sem SDK e sem chaves de API.
 * invoke() e health() são determinísticos e locais.
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
  AIProviderStatus,
  AIRequest,
  AIResponse,
} from "../ports/types";

export type StubAIProviderAdapterOptions = {
  providerId: Exclude<AIProviderId, "mock" | "test">;
  adapterId: string;
  metadata: AIProviderMetadata;
  capabilities?: readonly AICapabilityId[];
  modalities?: readonly AIModality[];
  status?: AIProviderStatus;
};

const DEFAULT_STUB_CAPABILITIES: readonly AICapabilityId[] = [
  "text-generation",
  "structured-output",
  "json-mode",
];

const DEFAULT_STUB_MODALITIES: readonly AIModality[] = ["text"];

/**
 * Adapter stub genérico. Subclasses vendor apenas fixam identidade.
 * Nenhuma subclasse pode introduzir I/O de rede nesta sprint.
 */
export class StubAIProviderAdapter implements AIProviderPort {
  readonly providerId: Exclude<AIProviderId, "mock" | "test">;

  private readonly adapterId: string;
  private readonly metadata: AIProviderMetadata;
  private readonly capabilityIds: readonly AICapabilityId[];
  private readonly modalities: readonly AIModality[];
  private readonly status: AIProviderStatus;

  constructor(options: StubAIProviderAdapterOptions) {
    this.providerId = options.providerId;
    this.adapterId = options.adapterId;
    this.metadata = options.metadata;
    this.capabilityIds = options.capabilities ?? DEFAULT_STUB_CAPABILITIES;
    this.modalities = options.modalities ?? DEFAULT_STUB_MODALITIES;
    this.status = options.status ?? "stub";
  }

  capabilities(): AIProviderCapabilities {
    const set = new Set(this.capabilityIds);
    return {
      provider: this.providerId,
      adapterId: this.adapterId,
      capabilities: this.capabilityIds,
      modalities: this.modalities,
      supportsStreaming: set.has("streaming"),
      supportsStructuredOutput: set.has("structured-output"),
      supportsVision: set.has("vision"),
      supportsEmbeddings: set.has("embeddings"),
      supportsToolCalling: set.has("tool-calling"),
      supportsJsonMode: set.has("json-mode"),
    };
  }

  providerInfo(): AIProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.status,
      modalities: this.modalities,
      capabilities: this.capabilityIds,
    };
  }

  supports(capability: AICapabilityId): boolean {
    return this.capabilityIds.includes(capability);
  }

  async health(): Promise<AIProviderHealth> {
    return {
      ok: false,
      provider: this.providerId,
      latencyMs: 0,
      status: this.status,
      message:
        `Stub adapter "${this.adapterId}" — sem chamadas reais. ` +
        `Provider registrado; implementação de rede fora do escopo EPC-07.`,
    };
  }

  async validateConfiguration(): Promise<AIConfigurationValidation> {
    return {
      ok: false,
      provider: this.providerId,
      errors: [
        `Adapter stub "${this.adapterId}" não aceita configuração de produção nesta sprint.`,
      ],
      warnings: ["Nenhuma chave de API é lida ou utilizada."],
      message: "Configuração de vendor não habilitada (stub).",
    };
  }

  async invoke(request: AIRequest): Promise<AIResponse> {
    return {
      ok: false,
      requestId: request.requestId,
      provider: this.providerId,
      model: request.model,
      simulated: true,
      metadata: this.metadata,
      message:
        `invoke() bloqueado no stub "${this.adapterId}". ` +
        `Nenhuma chamada HTTP/SDK é executada na EPC-07.`,
    };
  }
}
