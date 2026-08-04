/**
 * Enterprise AI Orchestration Runtime — F3-CAP-09.
 *
 * Fluxo estrutural oficial (F3-CAP-09):
 *   Produto → Enterprise Runtime → AIOrchestrationRuntimePort
 *     → DefaultAIOrchestrationRuntimeAdapter / EnterpriseAIOrchestrationRuntimeAdapter /
 *       MockAIOrchestrationRuntimeAdapter
 *     → InMemoryAIOrchestrationRuntimeStore → AIExecutionResult
 *
 * F3-CAP-09: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / tasks de IA futura (openJob/closeJob/submitRequest/
 * registerTask/getResult/stats). Sem IA real. Sem OpenAI. Sem Azure OpenAI.
 * Sem Gemini. Sem Claude. Sem Ollama. Sem Llama. Sem ML. Sem Prompt
 * Engineering. Sem HTTP. Sem agentes funcionais. Sem workflow. Sem decisão
 * automática. Sem persistência. Sem banco. Sem APIs.
 *
 * Contrato oficial AIOrchestrationContext:
 *   DocumentClassificationContext + DocumentExtractionResult + ValidationResult
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências ValidationRuntime/DocumentExtractionRuntime/
 * DocumentClassificationRuntime/OCRRuntime/IntelligentCaptureRuntime/Scanner/
 * WatchFolder/Upload/PersistentQueue/Worker/Scheduler/Observability/Scalability
 * preparadas — sem consumo funcional (shape-check apenas em health()).
 */
export type {
  AIAgent,
  AICapabilities,
  AIContext,
  AIExecutionPlan,
  AIExecutionResult,
  AIHealth,
  AIJob,
  AIMetadata,
  AIOrchestrationContext,
  AIOrchestrationRuntimeCapabilities,
  AIOrchestrationRuntimeEngineCapabilities,
  AIOrchestrationRuntimeEnterpriseDeps,
  AIOrchestrationRuntimeHealth,
  AIOrchestrationRuntimeInfo,
  AIOrchestrationRuntimeOperationalControls,
  AIOrchestrationRuntimeOperationEnvelope,
  AIOrchestrationRuntimeOptions,
  AIOrchestrationRuntimePort,
  AIOrchestrationRuntimeProviderId,
  AIOrchestrationRuntimeProviderMetadata,
  AIOrchestrationRuntimeProviderOptions,
  AIOrchestrationRuntimeRegistration,
  AIOrchestrationRuntimeStatus,
  AIOrchestrationRuntimeStructuredLog,
  AIOrchestrationRuntimeTelemetry,
  AIOrchestrationStatsInput,
  AIOrchestrationStatsResult,
  AIProvider,
  AIRequest,
  AIResponse,
  AIStatistics,
  AIStatus,
  AITask,
  AIWorkflow,
  AuditAgent,
  CanonicalAIOrchestrationOperation,
  ClassificationAgent,
  CloseAIOrchestrationJobInput,
  CloseAIOrchestrationJobResult,
  CoordinatorAgent,
  DocumentClassificationContext,
  DocumentExtractionResult,
  ExtractionAgent,
  FutureAIAgentContract,
  FutureAIAgentKind,
  FutureAIProviderCatalog,
  FutureAIProviderContract,
  FutureAIProviderKind,
  GetAIResultInput,
  GetAIResultResult,
  MedicalGuideAgent,
  OpenAIOrchestrationJobInput,
  OpenAIOrchestrationJobResult,
  QualityAgent,
  RegisterAITaskInput,
  RegisterAITaskResult,
  SubmitAIRequestInput,
  SubmitAIRequestResult,
  SupervisorAgent,
  TISSAgent,
  ValidationAgent,
  ValidationResult,
} from "./ports";

export {
  AI_ORCHESTRATION_RUNTIME_IDENTITY,
  DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
  createAIExecutionPlanId,
  createAIExecutionResultId,
  createAIJobId,
  createAIOrchestrationRuntimeRequestId,
  createAIRequestId,
  createAIResponseId,
  createAITaskId,
  createDisabledFutureAIProviderCatalog,
  defineAIOrchestrationRuntimeEngineCapabilities,
  emptyAIOrchestrationRuntimeEngineCapabilities,
  resetAllAIOrchestrationRuntimeIdSequences,
  toCanonicalAICapabilities,
} from "./ports";

export {
  DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
  DEFAULT_AI_ORCHESTRATION_RUNTIME_VERSION,
  DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_VERSION,
  DefaultAIOrchestrationRuntimeAdapter,
  EnterpriseAIOrchestrationRuntimeAdapter,
  MOCK_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
  MockAIOrchestrationRuntimeAdapter,
  type DefaultAIOrchestrationRuntimeAdapterOptions,
  type MockAIOrchestrationRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_AI_ORCHESTRATION_RUNTIME_STORE_ID,
  InMemoryAIOrchestrationRuntimeStore,
  type AIOrchestrationRuntimeStore,
  type InMemoryAIOrchestrationRuntimeStoreOptions,
  type StoredAIOrchestrationRuntimeJob,
  type StoredAIOrchestrationRuntimeRequest,
  type StoredAIOrchestrationRuntimeResult,
  type StoredAIOrchestrationRuntimeTask,
} from "./store";

export {
  AIOrchestrationRuntimeFactory,
  createAIOrchestrationRuntimeFactory,
  type AIOrchestrationRuntimeFactoryOptions,
} from "./factory";

export {
  AIOrchestrationRuntimeRegistry,
  BUILTIN_AI_ORCHESTRATION_RUNTIME_PROVIDER_COUNT,
  createDefaultAIOrchestrationRuntimeRegistry,
  type AIOrchestrationRuntimeRegistrySnapshot,
} from "./registry";

export {
  AIOrchestrationRuntimeProvider,
  createAIOrchestrationRuntimePort,
  getAIOrchestrationRuntimeFactory,
  getAIOrchestrationRuntimePort,
} from "./providers";

export {
  getAIOrchestrationRuntimeHealthSummary,
  type AIOrchestrationRuntimeHealthSummary,
} from "./demo";
