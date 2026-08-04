/**
 * Enterprise TISS Mapping Runtime — F3-CAP-11.
 *
 * Fluxo estrutural oficial (F3-CAP-11):
 *   Produto → Enterprise Runtime → TISSMappingRuntimePort
 *     → DefaultTISSMappingRuntimeAdapter / EnterpriseTISSMappingRuntimeAdapter /
 *       MockTISSMappingRuntimeAdapter
 *     → InMemoryTISSMappingRuntimeStore → CanonicalMappingResult
 *
 * F3-CAP-11: infraestrutura canônica de orquestração estrutural de mapeamento
 * TISS futuro (prepareMapping/getResult/stats). Sem mapeamento funcional.
 * Sem operadoras. Sem XML. Sem preenchimento automático. Sem IA. Sem banco.
 * Sem persistência. Sem APIs. Sem integração com operadoras.
 *
 * Contrato oficial TISSMappingContext:
 *   DocumentClassificationContext + DocumentExtractionResult +
 *   ValidationResult + AuditResult + AIOrchestrationContext
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências AIOrchestrationRuntime/AuditRuntime/ValidationRuntime/
 * DocumentExtractionRuntime/DocumentClassificationRuntime/OCRRuntime/
 * IntelligentCaptureRuntime/Scanner/WatchFolder/Upload preparadas — sem
 * consumo funcional (shape-check apenas em health()).
 */
export type {
  AIOrchestrationContext,
  AuditResult,
  CanonicalBeneficiary,
  CanonicalField,
  CanonicalGuide,
  CanonicalGuideAnexo,
  CanonicalGuideConsulta,
  CanonicalGuideHonorarios,
  CanonicalGuideInternacao,
  CanonicalGuideOdontologica,
  CanonicalGuideResumoInternacao,
  CanonicalGuideSPADT,
  CanonicalGuideType,
  CanonicalMapping,
  CanonicalMappingCapabilities,
  CanonicalMappingHealth,
  CanonicalMappingIssue,
  CanonicalMappingResult,
  CanonicalMappingStatistics,
  CanonicalMappingStatus,
  CanonicalOperator,
  CanonicalOperatorKind,
  CanonicalProcedure,
  CanonicalProfessional,
  CanonicalProvider,
  CanonicalSection,
  CanonicalTISSMappingOperation,
  CanonicalTISSVersion,
  CanonicalTISSVersionContract,
  DocumentClassificationContext,
  DocumentExtractionResult,
  FutureCanonicalGuideContract,
  GetTISSMappingResultInput,
  GetTISSMappingResultResult,
  PrepareTISSMappingInput,
  PrepareTISSMappingResult,
  TISSMappingContext,
  TISSMappingRuntimeCapabilities,
  TISSMappingRuntimeEngineCapabilities,
  TISSMappingRuntimeEnterpriseDeps,
  TISSMappingRuntimeHealth,
  TISSMappingRuntimeInfo,
  TISSMappingRuntimeOperationalControls,
  TISSMappingRuntimeOperationEnvelope,
  TISSMappingRuntimeOptions,
  TISSMappingRuntimePort,
  TISSMappingRuntimeProviderId,
  TISSMappingRuntimeProviderMetadata,
  TISSMappingRuntimeProviderOptions,
  TISSMappingRuntimeRegistration,
  TISSMappingRuntimeStatus,
  TISSMappingRuntimeStructuredLog,
  TISSMappingRuntimeTelemetry,
  TISSMappingStatsInput,
  TISSMappingStatsResult,
  ValidationResult,
} from "./ports";

export {
  DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
  TISS_MAPPING_RUNTIME_IDENTITY,
  createCanonicalFieldId,
  createCanonicalGuideId,
  createCanonicalMappingId,
  createCanonicalMappingIssueId,
  createCanonicalMappingResultId,
  createCanonicalProcedureId,
  createCanonicalSectionId,
  createDisabledCanonicalGuide,
  createDisabledCanonicalOperator,
  createDisabledTISSVersionContract,
  createTISSMappingRuntimeRequestId,
  defineTISSMappingRuntimeEngineCapabilities,
  emptyTISSMappingRuntimeEngineCapabilities,
  resetAllTISSMappingRuntimeIdSequences,
  toCanonicalMappingCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_TISS_MAPPING_RUNTIME_VERSION,
  DEFAULT_TISS_MAPPING_RUNTIME_ADAPTER_ID,
  DEFAULT_TISS_MAPPING_RUNTIME_VERSION,
  DefaultTISSMappingRuntimeAdapter,
  EnterpriseTISSMappingRuntimeAdapter,
  MOCK_TISS_MAPPING_RUNTIME_ADAPTER_ID,
  MockTISSMappingRuntimeAdapter,
  type DefaultTISSMappingRuntimeAdapterOptions,
  type MockTISSMappingRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_TISS_MAPPING_RUNTIME_STORE_ID,
  InMemoryTISSMappingRuntimeStore,
  type InMemoryTISSMappingRuntimeStoreOptions,
  type StoredTISSMappingRuntimeMapping,
  type StoredTISSMappingRuntimeResult,
  type TISSMappingRuntimeStore,
} from "./store";

export {
  TISSMappingRuntimeFactory,
  createTISSMappingRuntimeFactory,
  type TISSMappingRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_TISS_MAPPING_RUNTIME_PROVIDER_COUNT,
  TISSMappingRuntimeRegistry,
  createDefaultTISSMappingRuntimeRegistry,
  type TISSMappingRuntimeRegistrySnapshot,
} from "./registry";

export {
  TISSMappingRuntimeProvider,
  createTISSMappingRuntimePort,
  getTISSMappingRuntimeFactory,
  getTISSMappingRuntimePort,
} from "./providers";

export { getTISSMappingRuntimeHealthSummary, type TISSMappingRuntimeHealthSummary } from "./demo";
