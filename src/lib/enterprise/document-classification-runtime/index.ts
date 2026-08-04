/**
 * Enterprise Document Classification Runtime — F3-CAP-06 (+ DIP-04 / CLASS-01 preservado).
 *
 * Fluxo estrutural oficial (F3-CAP-06):
 *   Produto → Enterprise Runtime → DocumentClassificationRuntimePort
 *     → DefaultDocumentClassificationRuntimeAdapter / EnterpriseDocumentClassificationRuntimeAdapter / MockDocumentClassificationRuntimeAdapter
 *     → InMemoryDocumentClassificationRuntimeStore → DocumentClassificationResult
 *
 * Fluxo DIP-04 / CLASS-01 preservado (coordenação + execução real):
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → DocumentClassificationProviderPort
 *     → DefaultDocumentClassificationAdapter → Classification Provider
 *
 * F3-CAP-06: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / documentos de classificação (openJob/closeJob/submitRequest/
 * registerDocument/getResult/stats). Sem IA. Sem ML. Sem LLM. Sem OCR real.
 * Sem template matching. Sem roteamento automático. Sem visão computacional
 * neste módulo. Dependências IntelligentCaptureRuntime/Scanner/WatchFolder/
 * Upload/PersistentQueue/Worker/Scheduler/Observability/Scalability
 * preparadas — sem consumo funcional (shape-check apenas em health()).
 *
 * CLASS-01: classificação rule-based via DocumentClassificationProviderPort.
 * Sem IA, sem LLM, sem embeddings, sem ML, sem RAG.
 */
export type {
  CanonicalDocumentClassificationCapabilities,
  CanonicalDocumentClassificationConfiguration,
  CanonicalDocumentClassificationIdentity,
  CanonicalDocumentClassificationMetadata,
  CanonicalDocumentClassificationProviderReference,
  CanonicalDocumentClassificationProviderReferenceId,
  CanonicalDocumentClassificationReference,
  CanonicalDocumentClassificationRequest,
  CanonicalDocumentClassificationResult,
  CanonicalDocumentClassificationSession,
  CanonicalDocumentClassificationTelemetry,
  CanonicalDocumentClassificationType,
  CanonicalClassificationOperation,
  CanonicalClassificationProvider,
  CanonicalClassificationStatistics,
  ClassificationCapabilities,
  ClassificationConfidence,
  ClassificationContext,
  ClassificationHealth,
  ClassificationMetadata,
  ClassificationRule,
  ClassificationStatsInput,
  ClassificationStatsResult,
  ClassificationStatus,
  ClassifyDocumentInput,
  ClassifyDocumentResult,
  CloseClassificationJobInput,
  CloseClassificationJobResult,
  CoordinateClassificationInput,
  CoordinateClassificationResult,
  DocumentCategory,
  DocumentClassificationDocument,
  DocumentClassificationJob,
  DocumentClassificationRequest,
  DocumentClassificationResult,
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeEngineCapabilities,
  DocumentClassificationRuntimeEnterpriseDeps,
  DocumentClassificationRuntimeHealth,
  DocumentClassificationRuntimeInfo,
  DocumentClassificationRuntimeOperationalControls,
  DocumentClassificationRuntimeOperationEnvelope,
  DocumentClassificationRuntimeOptions,
  DocumentClassificationRuntimePort,
  DocumentClassificationRuntimeProviderId,
  DocumentClassificationRuntimeProviderMetadata,
  DocumentClassificationRuntimeProviderOptions,
  DocumentClassificationRuntimeRegistration,
  DocumentClassificationRuntimeSessionStatus,
  DocumentClassificationRuntimeStatus,
  DocumentClassificationRuntimeStructuredLog,
  DocumentClassificationRuntimeTelemetry,
  DocumentType,
  GetClassificationResultInput,
  GetClassificationResultResult,
  GetDocumentClassificationRuntimeSessionInput,
  GetDocumentClassificationRuntimeSessionResult,
  ListDocumentClassificationProviderReferencesResult,
  ListDocumentClassificationRuntimeSessionsInput,
  ListDocumentClassificationRuntimeSessionsResult,
  OpenClassificationJobInput,
  OpenClassificationJobResult,
  RegisterClassificationDocumentInput,
  RegisterClassificationDocumentResult,
  SubmitClassificationRequestInput,
  SubmitClassificationRequestResult,
} from "./ports";

export {
  STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES,
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
  DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY,
  createDocumentClassificationCapRequestId,
  createDocumentClassificationDocumentId,
  createDocumentClassificationJobId,
  createDocumentClassificationResultId,
  createDocumentClassificationRuntimeRequestId,
  createDocumentClassificationRuntimeSessionId,
  defineDocumentClassificationRuntimeEngineCapabilities,
  emptyDocumentClassificationRuntimeEngineCapabilities,
  resetAllDocumentClassificationRuntimeIdSequences,
  resetDocumentClassificationRuntimeSessionIdSequence,
  resolveStructuralClassificationProviderReference,
  toCanonicalClassificationCapabilities,
} from "./ports";

export {
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
  DefaultDocumentClassificationRuntimeAdapter,
  EnterpriseDocumentClassificationRuntimeAdapter,
  MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  MockDocumentClassificationRuntimeAdapter,
  STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID,
  type DefaultDocumentClassificationRuntimeAdapterOptions,
  type MockDocumentClassificationRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID,
  InMemoryDocumentClassificationRuntimeStore,
  type DocumentClassificationRuntimeStore,
  type InMemoryDocumentClassificationRuntimeStoreOptions,
  type StoredDocumentClassificationRuntimeDocument,
  type StoredDocumentClassificationRuntimeJob,
  type StoredDocumentClassificationRuntimeRequest,
  type StoredDocumentClassificationRuntimeResult,
  type StoredDocumentClassificationRuntimeSession,
} from "./store";

export {
  DocumentClassificationRuntimeFactory,
  createDocumentClassificationRuntimeFactory,
  type DocumentClassificationRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_DOCUMENT_CLASSIFICATION_RUNTIME_PROVIDER_COUNT,
  DocumentClassificationRuntimeRegistry,
  createDefaultDocumentClassificationRuntimeRegistry,
  type DocumentClassificationRuntimeRegistrySnapshot,
} from "./registry";

export {
  DocumentClassificationRuntimeProvider,
  createDocumentClassificationRuntimePort,
  getDocumentClassificationRuntimeFactory,
  getDocumentClassificationRuntimePort,
} from "./providers";

export {
  getDocumentClassificationRuntimeHealthSummary,
  type DocumentClassificationRuntimeHealthSummary,
} from "./demo";
