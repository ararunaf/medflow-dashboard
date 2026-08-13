/**
 * Enterprise Completed Runtime — A10-02.
 *
 * Fluxo estrutural oficial (A10-02):
 *   Produto → Enterprise Runtime → CompletedRuntimePort
 *     → DefaultCompletedRuntimeAdapter / EnterpriseCompletedRuntimeAdapter /
 *       MockCompletedRuntimeAdapter
 *     → InMemoryCompletedRuntimeStore → CompletedResult
 *
 * A10-02: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / findings de completedoria futura (openJob/closeJob/submitRequest/
 * registerFinding/getResult/stats). Sem completedoria real. Sem IA. Sem OpenAI.
 * Sem Azure OpenAI. Sem Gemini. Sem Claude. Sem ML. Sem regras TISS.
 * Sem regras de operadoras. Sem justificativas automáticas. Sem correções
 * automáticas. Sem aprovação/rejeição automática. Sem persistência.
 * Sem banco. Sem APIs.
 *
 * Contrato oficial CompletedContext:
 *   DocumentClassificationContext + DocumentExtractionResult +
 *   ValidationResult + AIOrchestrationContext
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências AIOrchestrationRuntime/ValidationRuntime/
 * DocumentExtractionRuntime/DocumentClassificationRuntime/OCRRuntime/
 * IntelligentCaptureRuntime/Scanner/WatchFolder/Upload/PersistentQueue/
 * Worker/Scheduler/Observability/Scalability preparadas — sem consumo
 * funcional (shape-check apenas em health()).
 */
export type {
  AIOrchestrationContext,
  CompletedCapabilities,
  CompletedContext,
  CompletedFinding,
  CompletedHealth,
  CompletedIssue,
  CompletedJob,
  CompletedJustification,
  CompletedMetadata,
  CompletedRecommendation,
  CompletedRequest,
  CompletedResult,
  CompletedRuntimeCapabilities,
  CompletedRuntimeEngineCapabilities,
  CompletedRuntimeEnterpriseDeps,
  CompletedRuntimeHealth,
  CompletedRuntimeInfo,
  CompletedRuntimeOperationalControls,
  CompletedRuntimeOperationEnvelope,
  CompletedRuntimeOptions,
  CompletedRuntimePort,
  CompletedRuntimeProviderId,
  CompletedRuntimeProviderMetadata,
  CompletedRuntimeProviderOptions,
  CompletedRuntimeRegistration,
  CompletedRuntimeStatus,
  CompletedRuntimeStructuredLog,
  CompletedRuntimeTelemetry,
  CompletedScore,
  CompletedStatistics,
  CompletedStatsInput,
  CompletedStatsResult,
  CompletedStatus,
  CompletedSummary,
  CompletedTypeContract,
  CompletedTypeKind,
  BusinessCompleted,
  CanonicalCompletedOperation,
  ClinicalCompleted,
  CloseCompletedJobInput,
  CloseCompletedJobResult,
  ComplianceCompleted,
  DocumentClassificationContext,
  DocumentExtractionResult,
  FinancialCompleted,
  FutureCompletedTypeContract,
  GetCompletedResultInput,
  GetCompletedResultResult,
  OpenCompletedJobInput,
  OpenCompletedJobResult,
  OperatorCompleted,
  QualityCompleted,
  RegisterCompletedFindingInput,
  RegisterCompletedFindingResult,
  SubmitCompletedRequestInput,
  SubmitCompletedRequestResult,
  TechnicalCompleted,
  TISSCompleted,
  ValidationResult,
} from "./ports";

export {
  COMPLETED_RUNTIME_IDENTITY,
  DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
  createCompletedFindingId,
  createCompletedIssueId,
  createCompletedJobId,
  createCompletedJustificationId,
  createCompletedRecommendationId,
  createCompletedRequestId,
  createCompletedResultId,
  createCompletedRuntimeRequestId,
  createCompletedScoreId,
  createCompletedSummaryId,
  createDisabledCompletedTypeContract,
  defineCompletedRuntimeEngineCapabilities,
  emptyCompletedRuntimeEngineCapabilities,
  resetAllCompletedRuntimeIdSequences,
  toCanonicalCompletedCapabilities,
} from "./ports";

export {
  DEFAULT_COMPLETED_RUNTIME_ADAPTER_ID,
  DEFAULT_COMPLETED_RUNTIME_VERSION,
  DEFAULT_MOCK_COMPLETED_RUNTIME_VERSION,
  DefaultCompletedRuntimeAdapter,
  EnterpriseCompletedRuntimeAdapter,
  MOCK_COMPLETED_RUNTIME_ADAPTER_ID,
  MockCompletedRuntimeAdapter,
  REALTISS_COMPLETED_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLETED_RUNTIME_VERSION,
  RealTissCompletedRuntimeAdapter,
  TEST_COMPLETED_RUNTIME_ADAPTER_ID,
  TEST_COMPLETED_RUNTIME_VERSION,
  TestCompletedRuntimeAdapter,
  type DefaultCompletedRuntimeAdapterOptions,
  type MockCompletedRuntimeAdapterOptions,
  type RealTissCompletedRuntimeAdapterOptions,
  type TestCompletedRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_COMPLETED_RUNTIME_STORE_ID,
  InMemoryCompletedRuntimeStore,
  type CompletedRuntimeStore,
  type InMemoryCompletedRuntimeStoreOptions,
  type StoredCompletedRuntimeFinding,
  type StoredCompletedRuntimeJob,
  type StoredCompletedRuntimeRequest,
  type StoredCompletedRuntimeResult,
} from "./store";

export {
  CompletedRuntimeFactory,
  createCompletedRuntimeFactory,
  type CompletedRuntimeFactoryOptions,
} from "./factory";

export {
  CompletedRuntimeRegistry,
  BUILTIN_COMPLETED_RUNTIME_PROVIDER_COUNT,
  createDefaultCompletedRuntimeRegistry,
  type CompletedRuntimeRegistrySnapshot,
} from "./registry";

export {
  CompletedRuntimeProvider,
  createCompletedRuntimePort,
  getCompletedRuntimeFactory,
  getCompletedRuntimePort,
} from "./providers";
