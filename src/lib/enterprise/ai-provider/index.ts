/**
 * Enterprise AI Providers — Ports & Adapters (EPC-07 / ARCH-02).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → AI Provider Runtime
 *     → AIProviderPort → Adapter → Provider → OpenAI
 *
 * Domain/Application NÃO devem importar SDKs de OpenAI, Azure, Gemini,
 * Claude, Ollama ou LM Studio nem chamar HTTP de LLM diretamente.
 *
 * OpenAI: Adapter oficial com chat.completions (ARCH-02).
 * Demais vendors: stubs estruturais.
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
