/**
 * Enterprise Document Extraction Runtime — F3-CAP-07.
 *
 * Fluxo estrutural oficial (F3-CAP-07):
 *   Produto → Enterprise Runtime → DocumentExtractionRuntimePort
 *     → DefaultDocumentExtractionRuntimeAdapter / EnterpriseDocumentExtractionRuntimeAdapter /
 *       MockDocumentExtractionRuntimeAdapter
 *     → InMemoryDocumentExtractionRuntimeStore → DocumentExtractionResult
 *
 * F3-CAP-07: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / documentos de extração (openJob/closeJob/submitRequest/
 * registerDocument/getResult/stats). Sem extração real. Sem OCR. Sem IA.
 * Sem ML. Sem LLM. Sem Regex. Sem Template Matching. Sem leitura de campos.
 * Sem preenchimento de guias. Sem persistência. Sem banco. Sem APIs.
 *
 * Contrato oficial com Document Classification Runtime:
 *   DocumentClassificationContext (metadados estruturais apenas).
 *
 * Dependências DocumentClassificationRuntime/OCRRuntime/IntelligentCaptureRuntime/
 * Scanner/WatchFolder/Upload/PersistentQueue/Worker/Scheduler/Observability/
 * Scalability preparadas — sem consumo funcional (shape-check apenas em health()).
 */
export type {
  CanonicalExtractionOperation,
  CanonicalExtractionProvider,
  CloseExtractionJobInput,
  CloseExtractionJobResult,
  DocumentClassificationContext,
  DocumentExtractionDocument,
  DocumentExtractionRequest,
  DocumentExtractionResult,
  DocumentExtractionRuntimeCapabilities,
  DocumentExtractionRuntimeEngineCapabilities,
  DocumentExtractionRuntimeEnterpriseDeps,
  DocumentExtractionRuntimeHealth,
  DocumentExtractionRuntimeInfo,
  DocumentExtractionRuntimeOperationalControls,
  DocumentExtractionRuntimeOperationEnvelope,
  DocumentExtractionRuntimeOptions,
  DocumentExtractionRuntimePort,
  DocumentExtractionRuntimeProviderId,
  DocumentExtractionRuntimeProviderMetadata,
  DocumentExtractionRuntimeProviderOptions,
  DocumentExtractionRuntimeRegistration,
  DocumentExtractionRuntimeStatus,
  DocumentExtractionRuntimeStructuredLog,
  DocumentExtractionRuntimeTelemetry,
  ExtractionCapabilities,
  ExtractionConfidence,
  ExtractionContext,
  ExtractionField,
  ExtractionHealth,
  ExtractionJob,
  ExtractionMetadata,
  ExtractionStatsInput,
  ExtractionStatsResult,
  ExtractionStatistics,
  ExtractionStatus,
  ExtractionSummary,
  ExtractionTable,
  GetExtractionResultInput,
  GetExtractionResultResult,
  OpenExtractionJobInput,
  OpenExtractionJobResult,
  RegisterExtractionDocumentInput,
  RegisterExtractionDocumentResult,
  SubmitExtractionRequestInput,
  SubmitExtractionRequestResult,
} from "./ports";

export {
  DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
  DOCUMENT_EXTRACTION_RUNTIME_IDENTITY,
  createDocumentExtractionCapRequestId,
  createDocumentExtractionDocumentId,
  createDocumentExtractionResultId,
  createDocumentExtractionRuntimeRequestId,
  createExtractionJobId,
  defineDocumentExtractionRuntimeEngineCapabilities,
  emptyDocumentExtractionRuntimeEngineCapabilities,
  resetAllDocumentExtractionRuntimeIdSequences,
  toCanonicalExtractionCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
  DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
  DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
  DefaultDocumentExtractionRuntimeAdapter,
  EnterpriseDocumentExtractionRuntimeAdapter,
  MOCK_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
  MockDocumentExtractionRuntimeAdapter,
  REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
  REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
  RealTissDocumentExtractionRuntimeAdapter,
  type DefaultDocumentExtractionRuntimeAdapterOptions,
  type MockDocumentExtractionRuntimeAdapterOptions,
  type RealTissDocumentExtractionRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_DOCUMENT_EXTRACTION_RUNTIME_STORE_ID,
  InMemoryDocumentExtractionRuntimeStore,
  type InMemoryDocumentExtractionRuntimeStoreOptions,
  type DocumentExtractionRuntimeStore,
  type StoredDocumentExtractionRuntimeDocument,
  type StoredDocumentExtractionRuntimeJob,
  type StoredDocumentExtractionRuntimeRequest,
  type StoredDocumentExtractionRuntimeResult,
} from "./store";

export {
  DocumentExtractionRuntimeFactory,
  createDocumentExtractionRuntimeFactory,
  type DocumentExtractionRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_DOCUMENT_EXTRACTION_RUNTIME_PROVIDER_COUNT,
  DocumentExtractionRuntimeRegistry,
  createDefaultDocumentExtractionRuntimeRegistry,
  type DocumentExtractionRuntimeRegistrySnapshot,
} from "./registry";

export {
  DocumentExtractionRuntimeProvider,
  createDocumentExtractionRuntimePort,
  getDocumentExtractionRuntimeFactory,
  getDocumentExtractionRuntimePort,
} from "./providers";

export {
  getDocumentExtractionRuntimeHealthSummary,
  type DocumentExtractionRuntimeHealthSummary,
} from "./demo";
