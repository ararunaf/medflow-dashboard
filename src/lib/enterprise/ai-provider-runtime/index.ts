/**
 * Enterprise AI Provider Runtime — ARCH-02 / DIP-07.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → AIProviderRuntimePort
 *     → Canonical Execution Orchestrator → AIProviderPort
 *     → Adapter → Provider → OpenAI
 *
 * Elimina bypass HTTP direto a LLMs fora da Enterprise Foundation.
 */
export type {
  AIRequest,
  AIResponse,
  CanonicalAIInvocationIdentity,
  CanonicalAIInvocationMetadata,
  CanonicalAIInvocationRequest,
  CanonicalAIInvocationResult,
  CanonicalAIInvocationSession,
  CanonicalAIProviderReference,
  CanonicalAIProviderReferenceId,
  CoordinateAIInvocationInput,
  CoordinateAIInvocationResult,
  GetAIProviderRuntimeSessionInput,
  GetAIProviderRuntimeSessionResult,
  ListAIProviderReferencesResult,
  ListAIProviderRuntimeSessionsInput,
  ListAIProviderRuntimeSessionsResult,
  AIProviderRuntimeCapabilities,
  AIProviderRuntimeEnterpriseDeps,
  AIProviderRuntimeHealth,
  AIProviderRuntimePort,
  AIProviderRuntimeProviderId,
  AIProviderRuntimeProviderOptions,
  AIProviderRuntimeSessionStatus,
} from "./ports";

export {
  STRUCTURAL_AI_PROVIDER_REFERENCES,
  createAIProviderRuntimeSessionId,
  resetAllAIProviderRuntimeIdSequences,
  resetAIProviderRuntimeSessionIdSequence,
  resolveStructuralAIProviderReference,
} from "./ports";

export {
  DEFAULT_AI_PROVIDER_RUNTIME_ADAPTER_ID,
  DefaultAIProviderRuntimeAdapter,
  MOCK_AI_PROVIDER_RUNTIME_ADAPTER_ID,
  MockAIProviderRuntimeAdapter,
  type DefaultAIProviderRuntimeAdapterOptions,
  type MockAIProviderRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_AI_PROVIDER_RUNTIME_STORE_ID,
  InMemoryAIProviderRuntimeStore,
  type InMemoryAIProviderRuntimeStoreOptions,
  type AIProviderRuntimeStore,
  type StoredAIProviderRuntimeSession,
} from "./store";

export {
  AIProviderRuntimeFactory,
  createAIProviderRuntimeFactory,
  type AIProviderRuntimeFactoryOptions,
} from "./factory";

export { createAIProviderRuntimePort } from "./providers";

export { getAIProviderRuntimeHealthSummary, type AIProviderRuntimeHealthSummary } from "./demo";
