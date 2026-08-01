/**
 * Enterprise AI Orchestrator Foundation — Ports & Adapters (EPC-16).
 *
 * Fluxo oficial:
 *   Application → AIOrchestratorPort → AIOrchestratorAdapter
 *     → AIOrchestratorStore → AIOrchestratorFactory → AIOrchestratorProvider
 *     → AI Provider Framework (EPC-07)
 *
 * Domain/Application NÃO devem importar SDKs de OpenAI, Azure, Gemini,
 * Claude, Ollama ou LM Studio. NÃO devem passar conceitos clínicos ao Port.
 *
 * O AI Orchestrator nunca conversa diretamente com modelos.
 * Ele conversa apenas com o AI Provider Framework.
 *
 * EPC-16: infraestrutura de orquestração apenas.
 * NÃO implementa IA real, AI Auditor, OCR, contratos, TISS, prompts,
 * chamadas HTTP, Workflow, Rule Engine ou UI/APIs.
 */
export type {
  AICapabilityId,
  AIOrchestrationConfigurationReference,
  AIOrchestrationMetadataReference,
  AIOrchestrationPriority,
  AIOrchestrationRequest,
  AIOrchestrationResult,
  AIOrchestrationTag,
  AIOrchestrationTaskType,
  AIOrchestratorCapabilities,
  AIOrchestratorHealth,
  AIOrchestratorPort,
  AIOrchestratorProviderId,
  AIOrchestratorProviderOptions,
  AIProviderId,
  AIProviderRegistration,
  AISelectionPolicy,
  AISelectionPolicyDescriptor,
  GetProviderInput,
  GetProviderResult,
  ListAvailableProvidersInput,
  ListAvailableProvidersResult,
} from "./ports";

export {
  AI_SELECTION_POLICIES,
  AI_SELECTION_POLICY_CATALOG,
  createOrchestrationRequestId,
  getSelectionPolicy,
  isKnownSelectionPolicy,
  listSelectionPolicies,
  resetOrchestrationRequestIdSequence,
} from "./ports";

export {
  DEFAULT_AI_ORCHESTRATOR_ADAPTER_ID,
  DefaultAIOrchestratorAdapter,
  DefaultMockAIOrchestrator,
  MockAIOrchestratorAdapter,
  type DefaultAIOrchestratorRuntime,
  type MockAIOrchestratorAdapterOptions,
} from "./adapters";

export {
  DEFAULT_AI_ORCHESTRATOR_STORE_ID,
  DefaultAIOrchestratorStore,
  type AIOrchestratorStore,
  type DefaultAIOrchestratorStoreOptions,
  type StoredAIOrchestration,
} from "./store";

export {
  AIOrchestratorFactory,
  createAIOrchestratorFactory,
  type AIOrchestratorFactoryOptions,
} from "./factory";

export { createAIOrchestratorPort } from "./providers";

export { selectProviderDeterministic } from "./runtime";

export { getAIOrchestratorHealthSummary, type AIOrchestratorHealthSummary } from "./demo";
