/**
 * Enterprise AI Providers — Ports & Adapters (EPC-07).
 *
 * Fluxo oficial:
 *   Application → AIProviderPort → AIProviderAdapter
 *     → ProviderFactory → ProviderRegistry → Health → Capabilities → Infrastructure
 *
 * Domain/Application NÃO devem importar SDKs de OpenAI, Azure, Gemini,
 * Claude, Ollama ou LM Studio. NÃO devem passar conceitos clínicos ao Port.
 *
 * EPC-07: infraestrutura de integração apenas.
 * NÃO implementa OCR, Auditor Inteligente, TISS, contratos, prompts clínicos,
 * chamadas HTTP reais ou uso de chaves de API.
 */
export type {
  AICapabilityDescriptor,
  AICapabilityId,
  AIConfigurationValidation,
  AIContext,
  AIMessage,
  AIModality,
  AIProviderCapabilities,
  AIProviderHealth,
  AIProviderId,
  AIProviderInfo,
  AIProviderMetadata,
  AIProviderOptions,
  AIProviderPort,
  AIProviderRegistration,
  AIProviderStatus,
  AIRequest,
  AIResponse,
  AITokenUsage,
} from "./ports";

export {
  AI_CAPABILITIES,
  AI_CAPABILITY_CATALOG,
  getCapability,
  isKnownCapability,
  listCapabilities,
} from "./ports";

export {
  AZURE_OPENAI_AI_PROVIDER_ADAPTER_ID,
  AzureOpenAIAIProviderAdapter,
  CLAUDE_AI_PROVIDER_ADAPTER_ID,
  ClaudeAIProviderAdapter,
  DEFAULT_MOCK_AI_PROVIDER_VERSION,
  DefaultMockAIProvider,
  GEMINI_AI_PROVIDER_ADAPTER_ID,
  GeminiAIProviderAdapter,
  LM_STUDIO_AI_PROVIDER_ADAPTER_ID,
  LMStudioAIProviderAdapter,
  MOCK_AI_PROVIDER_ADAPTER_ID,
  MockAIProviderAdapter,
  OLLAMA_AI_PROVIDER_ADAPTER_ID,
  OllamaAIProviderAdapter,
  OPENAI_AI_PROVIDER_ADAPTER_ID,
  OpenAIAIProviderAdapter,
  StubAIProviderAdapter,
  type MockAIProviderAdapterOptions,
  type StubAIProviderAdapterOptions,
} from "./adapters";

export {
  AIProviderFactory,
  createAIProviderFactory,
  type AIProviderFactoryOptions,
} from "./factory";

export {
  AIProviderRegistry,
  BUILTIN_AI_PROVIDER_COUNT,
  createDefaultAIProviderRegistry,
  type AIProviderRegistrySnapshot,
} from "./registry";

export { createAIProviderPort, getAIProviderFactory } from "./providers";

export { getAIProviderHealthSummary, type AIProviderHealthSummary } from "./demo";
