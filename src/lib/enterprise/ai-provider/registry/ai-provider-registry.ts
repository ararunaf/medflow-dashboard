/**
 * AIProviderRegistry — catálogo de provedores registrados (EPC-07).
 *
 * Registra: nome, versão, capacidades, modalidades, status.
 * Sem lógica de negócio. Sem chamadas de rede.
 */
import {
  AZURE_OPENAI_AI_PROVIDER_ADAPTER_ID,
  CLAUDE_AI_PROVIDER_ADAPTER_ID,
  DEFAULT_MOCK_AI_PROVIDER_VERSION,
  GEMINI_AI_PROVIDER_ADAPTER_ID,
  LM_STUDIO_AI_PROVIDER_ADAPTER_ID,
  MOCK_AI_PROVIDER_ADAPTER_ID,
  OLLAMA_AI_PROVIDER_ADAPTER_ID,
  OPENAI_AI_PROVIDER_ADAPTER_ID,
} from "../adapters";
import type { AICapabilityId } from "../ports/capabilities";
import type {
  AIModality,
  AIProviderId,
  AIProviderRegistration,
  AIProviderStatus,
} from "../ports/types";

export type AIProviderRegistrySnapshot = {
  registrations: readonly AIProviderRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly AIProviderRegistration[] = [
  {
    providerId: "mock",
    name: "Default Mock AI Provider",
    version: DEFAULT_MOCK_AI_PROVIDER_VERSION,
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
    status: "ready",
    adapterId: MOCK_AI_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    description: "Deterministic in-process mock.",
  },
  {
    providerId: "test",
    name: "Test AI Provider",
    version: DEFAULT_MOCK_AI_PROVIDER_VERSION,
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
    status: "ready",
    adapterId: MOCK_AI_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    description: "Test alias of the deterministic mock.",
  },
  {
    providerId: "openai",
    name: "OpenAI",
    version: "0.0.0-stub",
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
    adapterId: OPENAI_AI_PROVIDER_ADAPTER_ID,
    vendor: "openai",
  },
  {
    providerId: "azure-openai",
    name: "Azure OpenAI",
    version: "0.0.0-stub",
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
    adapterId: AZURE_OPENAI_AI_PROVIDER_ADAPTER_ID,
    vendor: "microsoft-azure",
  },
  {
    providerId: "gemini",
    name: "Google Gemini",
    version: "0.0.0-stub",
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
    adapterId: GEMINI_AI_PROVIDER_ADAPTER_ID,
    vendor: "google",
  },
  {
    providerId: "claude",
    name: "Anthropic Claude",
    version: "0.0.0-stub",
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
    adapterId: CLAUDE_AI_PROVIDER_ADAPTER_ID,
    vendor: "anthropic",
  },
  {
    providerId: "ollama",
    name: "Ollama",
    version: "0.0.0-stub",
    capabilities: ["text-generation", "structured-output", "streaming", "embeddings", "json-mode"],
    modalities: ["text", "embedding"],
    status: "stub",
    adapterId: OLLAMA_AI_PROVIDER_ADAPTER_ID,
    vendor: "ollama",
  },
  {
    providerId: "lm-studio",
    name: "LM Studio",
    version: "0.0.0-stub",
    capabilities: ["text-generation", "structured-output", "streaming", "embeddings", "json-mode"],
    modalities: ["text", "embedding"],
    status: "stub",
    adapterId: LM_STUDIO_AI_PROVIDER_ADAPTER_ID,
    vendor: "lm-studio",
  },
];

export class AIProviderRegistry {
  private readonly byId = new Map<AIProviderId, AIProviderRegistration>();

  constructor(seed: readonly AIProviderRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry });
    }
  }

  register(entry: AIProviderRegistration): void {
    this.byId.set(entry.providerId, { ...entry });
  }

  get(providerId: AIProviderId): AIProviderRegistration | undefined {
    return this.byId.get(providerId);
  }

  has(providerId: AIProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly AIProviderRegistration[] {
    return Array.from(this.byId.values());
  }

  listByStatus(status: AIProviderStatus): readonly AIProviderRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  supports(providerId: AIProviderId, capability: AICapabilityId): boolean {
    const entry = this.byId.get(providerId);
    if (!entry) return false;
    return entry.capabilities.includes(capability);
  }

  modalitiesOf(providerId: AIProviderId): readonly AIModality[] {
    return this.byId.get(providerId)?.modalities ?? [];
  }

  snapshot(): AIProviderRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com todos os providers da fundação. */
export function createDefaultAIProviderRegistry(): AIProviderRegistry {
  return new AIProviderRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_AI_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
