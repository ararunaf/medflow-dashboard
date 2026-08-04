/**
 * Enterprise OCR Runtime — F3-CAP-05 (+ DIP-03 / OCR-01 preservado).
 *
 * Fluxo estrutural oficial (F3-CAP-05):
 *   Produto → Enterprise Runtime → OCRRuntimePort
 *     → DefaultOCRRuntimeAdapter / EnterpriseOCRRuntimeAdapter / MockOCRRuntimeAdapter
 *     → InMemoryOCRRuntimeStore → OCRResult
 *
 * Fluxo DIP-03 / OCR-01 preservado (coordenação + execução real):
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCRRuntimePort → Canonical Execution Orchestrator
 *     → OCR Provider Adapter → Provider (Azure Document Intelligence)
 *
 * F3-CAP-05: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / documentos OCR (openJob/closeJob/submitRequest/registerDocument/
 * getResult/stats). Sem OCR real. Sem Tesseract. Sem Azure Document
 * Intelligence / Google Vision / AWS Textract / ABBYY / PaddleOCR neste
 * módulo. Sem IA. Sem extração de texto real. Sem leitura de páginas/pixels
 * reais. Dependências IntelligentCaptureRuntime/Scanner/WatchFolder/Upload/
 * PersistentQueue/Worker/Scheduler/Observability/Scalability preparadas —
 * sem consumo funcional (shape-check apenas em health()).
 *
 * HTTP Azure exclusivamente no AzureDocumentIntelligenceAdapter (OCRProviderPort) —
 * coordenação/execução real via coordinateOcr()/process() permanecem preservadas
 * para compatibilidade com Capture Engine Runtime e OCR Provider Adapter.
 */
export type {
  CanonicalOCRCapabilities,
  CanonicalOCRConfiguration,
  CanonicalOCRIdentity,
  CanonicalOCRMetadata,
  CanonicalOCRProvider,
  CanonicalOCRProviderReference,
  CanonicalOCRProviderReferenceId,
  CanonicalOCRReference,
  CanonicalOCRRequest,
  CanonicalOCRResult,
  CanonicalOCRSession,
  CanonicalOCRStatistics,
  CanonicalOCROperation,
  CloseOCRJobInput,
  CloseOCRJobResult,
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRResultInput,
  GetOCRResultResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRCapabilities,
  OCRConfidence,
  OCRDocument,
  OCREngine,
  OCRHealth,
  OCRJob,
  OCRLanguage,
  OCRMetadata,
  OCRPage,
  OCRProcessingContext,
  OCRRequest,
  OCRResult,
  OCRRuntimeCapabilities,
  OCRRuntimeEngineCapabilities,
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeHealth,
  OCRRuntimeInfo,
  OCRRuntimeOperationalControls,
  OCRRuntimeOperationEnvelope,
  OCRRuntimeOptions,
  OCRRuntimePort,
  OCRRuntimeProviderId,
  OCRRuntimeProviderMetadata,
  OCRRuntimeProviderOptions,
  OCRRuntimeRegistration,
  OCRRuntimeSessionStatus,
  OCRRuntimeStatus,
  OCRRuntimeStructuredLog,
  OCRRuntimeTelemetry,
  OCRStatsInput,
  OCRStatsResult,
  OCRStatus,
  OpenOCRJobInput,
  OpenOCRJobResult,
  ProcessOCRInput,
  ProcessOCRResult,
  RegisterOCRDocumentInput,
  RegisterOCRDocumentResult,
  SubmitOCRRequestInput,
  SubmitOCRRequestResult,
} from "./ports";

export {
  STRUCTURAL_OCR_PROVIDER_REFERENCES,
  DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES,
  OCR_RUNTIME_IDENTITY,
  createOCRCapRequestId,
  createOCRDocumentId,
  createOCRJobId,
  createOCRResultId,
  createOCRRuntimeRequestId,
  createOCRRuntimeSessionId,
  defineOCRRuntimeEngineCapabilities,
  emptyOCRRuntimeEngineCapabilities,
  resetAllOCRRuntimeIdSequences,
  resetOCRRuntimeSessionIdSequence,
  resolveStructuralProviderReference,
  toCanonicalOCRCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_OCR_RUNTIME_VERSION,
  DEFAULT_OCR_RUNTIME_ADAPTER_ID,
  DEFAULT_OCR_RUNTIME_VERSION,
  DefaultOCRRuntimeAdapter,
  EnterpriseOCRRuntimeAdapter,
  MOCK_OCR_RUNTIME_ADAPTER_ID,
  MockOCRRuntimeAdapter,
  type DefaultOCRRuntimeAdapterOptions,
  type MockOCRRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_OCR_RUNTIME_STORE_ID,
  InMemoryOCRRuntimeStore,
  type InMemoryOCRRuntimeStoreOptions,
  type OCRRuntimeStore,
  type StoredOCRRuntimeDocument,
  type StoredOCRRuntimeJob,
  type StoredOCRRuntimeRequest,
  type StoredOCRRuntimeResult,
  type StoredOCRRuntimeSession,
} from "./store";

export {
  OCRRuntimeFactory,
  createOCRRuntimeFactory,
  type OCRRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_OCR_RUNTIME_PROVIDER_COUNT,
  OCRRuntimeRegistry,
  createDefaultOCRRuntimeRegistry,
  type OCRRuntimeRegistrySnapshot,
} from "./registry";

export {
  OCRRuntimeProvider,
  createOCRRuntimePort,
  getOCRRuntimeFactory,
  getOCRRuntimePort,
} from "./providers";

export { getOCRRuntimeHealthSummary, type OCRRuntimeHealthSummary } from "./demo";
