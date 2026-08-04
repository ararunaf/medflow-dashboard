/**
 * Enterprise Validation Runtime — F3-CAP-08.
 *
 * Fluxo estrutural oficial (F3-CAP-08):
 *   Produto → Enterprise Runtime → ValidationRuntimePort
 *     → DefaultValidationRuntimeAdapter / EnterpriseValidationRuntimeAdapter /
 *       MockValidationRuntimeAdapter
 *     → InMemoryValidationRuntimeStore → ValidationResult
 *
 * F3-CAP-08: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / documentos de validação (openJob/closeJob/submitRequest/
 * registerDocument/getResult/stats). Sem validação real. Sem auditoria.
 * Sem IA. Sem ML. Sem LLM. Sem correção automática. Sem regras TISS.
 * Sem regras de operadoras. Sem aprovação/rejeição automática.
 * Sem persistência. Sem banco. Sem APIs.
 *
 * Contrato oficial ValidationContext:
 *   DocumentClassificationContext + DocumentExtractionResult
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências DocumentExtractionRuntime/DocumentClassificationRuntime/
 * OCRRuntime/IntelligentCaptureRuntime/Scanner/WatchFolder/Upload/
 * PersistentQueue/Worker/Scheduler/Observability/Scalability preparadas —
 * sem consumo funcional (shape-check apenas em health()).
 */
export type {
  CanonicalValidationOperation,
  CanonicalValidationProvider,
  CloseValidationJobInput,
  CloseValidationJobResult,
  DocumentClassificationContext,
  DocumentExtractionResult,
  FutureValidationRuleContracts,
  GetValidationResultInput,
  GetValidationResultResult,
  OpenValidationJobInput,
  OpenValidationJobResult,
  RegisterValidationDocumentInput,
  RegisterValidationDocumentResult,
  SubmitValidationRequestInput,
  SubmitValidationRequestResult,
  ValidationCapabilities,
  ValidationConfidence,
  ValidationContext,
  ValidationDocument,
  ValidationError,
  ValidationHealth,
  ValidationIssue,
  ValidationJob,
  ValidationMetadata,
  ValidationRequest,
  ValidationResult,
  ValidationRuntimeCapabilities,
  ValidationRuntimeEngineCapabilities,
  ValidationRuntimeEnterpriseDeps,
  ValidationRuntimeHealth,
  ValidationRuntimeInfo,
  ValidationRuntimeOperationalControls,
  ValidationRuntimeOperationEnvelope,
  ValidationRuntimeOptions,
  ValidationRuntimePort,
  ValidationRuntimeProviderId,
  ValidationRuntimeProviderMetadata,
  ValidationRuntimeProviderOptions,
  ValidationRuntimeRegistration,
  ValidationRuntimeStatus,
  ValidationRuntimeStructuredLog,
  ValidationRuntimeTelemetry,
  ValidationStatistics,
  ValidationStatus,
  ValidationStatsInput,
  ValidationStatsResult,
  ValidationSummary,
  ValidationWarning,
} from "./ports";

export {
  DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  VALIDATION_RUNTIME_IDENTITY,
  createValidationCapRequestId,
  createValidationDocumentId,
  createValidationJobId,
  createValidationResultId,
  createValidationRuntimeRequestId,
  defineValidationRuntimeEngineCapabilities,
  emptyValidationRuntimeEngineCapabilities,
  resetAllValidationRuntimeIdSequences,
  toCanonicalValidationCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_VALIDATION_RUNTIME_VERSION,
  DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID,
  DEFAULT_VALIDATION_RUNTIME_VERSION,
  DefaultValidationRuntimeAdapter,
  EnterpriseValidationRuntimeAdapter,
  MOCK_VALIDATION_RUNTIME_ADAPTER_ID,
  MockValidationRuntimeAdapter,
  type DefaultValidationRuntimeAdapterOptions,
  type MockValidationRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_VALIDATION_RUNTIME_STORE_ID,
  InMemoryValidationRuntimeStore,
  type InMemoryValidationRuntimeStoreOptions,
  type StoredValidationRuntimeDocument,
  type StoredValidationRuntimeJob,
  type StoredValidationRuntimeRequest,
  type StoredValidationRuntimeResult,
  type ValidationRuntimeStore,
} from "./store";

export {
  ValidationRuntimeFactory,
  createValidationRuntimeFactory,
  type ValidationRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_VALIDATION_RUNTIME_PROVIDER_COUNT,
  ValidationRuntimeRegistry,
  createDefaultValidationRuntimeRegistry,
  type ValidationRuntimeRegistrySnapshot,
} from "./registry";

export {
  ValidationRuntimeProvider,
  createValidationRuntimePort,
  getValidationRuntimeFactory,
  getValidationRuntimePort,
} from "./providers";

export { getValidationRuntimeHealthSummary, type ValidationRuntimeHealthSummary } from "./demo";
