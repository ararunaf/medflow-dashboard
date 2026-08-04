/**
 * Enterprise Quality Runtime — F3-CAP-13.
 *
 * Fluxo estrutural oficial (F3-CAP-13):
 *   Produto → Enterprise Runtime → QualityRuntimePort
 *     → DefaultQualityRuntimeAdapter / EnterpriseQualityRuntimeAdapter /
 *       MockQualityRuntimeAdapter
 *     → InMemoryQualityRuntimeStore → QualityResult
 *
 * F3-CAP-13: infraestrutura canônica de orquestração estrutural de
 * avaliação futura de qualidade do pipeline documental
 * (prepareQualityAssessment/getResult/stats).
 * Sem avaliação automática. Sem score funcional. Sem decisão automática.
 * Sem IA. Sem OCR. Sem auditoria automática. Sem banco. Sem persistência. Sem APIs.
 *
 * Contrato oficial QualityContext:
 *   OCRResult + DocumentClassificationResult + DocumentExtractionResult +
 *   ValidationResult + CanonicalMappingResult + AutoFillResult +
 *   AuditResult + AIOrchestrationContext
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências AutoFillRuntime/TISSMappingRuntime/AuditRuntime/ValidationRuntime/
 * DocumentExtractionRuntime/DocumentClassificationRuntime/OCRRuntime/
 * AIOrchestrationRuntime/IntelligentCaptureRuntime/Scanner/WatchFolder/Upload
 * preparadas — sem consumo funcional (shape-check apenas em health()).
 */
export type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillResult,
  CanonicalMappingResult,
  CanonicalQualityOperation,
  DocumentClassificationResult,
  DocumentExtractionResult,
  GetQualityResultInput,
  GetQualityResultResult,
  OCRResult,
  PrepareQualityAssessmentInput,
  PrepareQualityAssessmentResult,
  QualityAssessment,
  QualityCapabilities,
  QualityContext,
  QualityDecision,
  QualityHealth,
  QualityIssue,
  QualityMetric,
  QualityMetricKind,
  QualityResult,
  QualityRuntimeCapabilities,
  QualityRuntimeEngineCapabilities,
  QualityRuntimeEnterpriseDeps,
  QualityRuntimeHealth,
  QualityRuntimeInfo,
  QualityRuntimeOperationalControls,
  QualityRuntimeOperationEnvelope,
  QualityRuntimeOptions,
  QualityRuntimePort,
  QualityRuntimeProviderId,
  QualityRuntimeProviderMetadata,
  QualityRuntimeProviderOptions,
  QualityRuntimeRegistration,
  QualityRuntimeStatus,
  QualityRuntimeStructuredLog,
  QualityRuntimeTelemetry,
  QualityScore,
  QualityStatistics,
  QualityStatsInput,
  QualityStatsResult,
  QualityStatus,
  ValidationResult,
} from "./ports";

export {
  QUALITY_RUNTIME_IDENTITY,
  DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
  STRUCTURAL_QUALITY_METRIC_KINDS,
  createDisabledQualityDecision,
  createDisabledQualityMetric,
  createDisabledQualityScore,
  createQualityAssessmentId,
  createQualityDecisionId,
  createQualityIssueId,
  createQualityMetricId,
  createQualityResultId,
  createQualityRuntimeRequestId,
  createQualityScoreId,
  defineQualityRuntimeEngineCapabilities,
  emptyQualityRuntimeEngineCapabilities,
  resetAllQualityRuntimeIdSequences,
  toQualityCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_QUALITY_RUNTIME_VERSION,
  DEFAULT_QUALITY_RUNTIME_ADAPTER_ID,
  DEFAULT_QUALITY_RUNTIME_VERSION,
  DefaultQualityRuntimeAdapter,
  EnterpriseQualityRuntimeAdapter,
  MOCK_QUALITY_RUNTIME_ADAPTER_ID,
  MockQualityRuntimeAdapter,
  type DefaultQualityRuntimeAdapterOptions,
  type MockQualityRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_QUALITY_RUNTIME_STORE_ID,
  InMemoryQualityRuntimeStore,
  type InMemoryQualityRuntimeStoreOptions,
  type StoredQualityRuntimeAssessment,
  type StoredQualityRuntimeResult,
  type QualityRuntimeStore,
} from "./store";

export {
  QualityRuntimeFactory,
  createQualityRuntimeFactory,
  type QualityRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_QUALITY_RUNTIME_PROVIDER_COUNT,
  QualityRuntimeRegistry,
  createDefaultQualityRuntimeRegistry,
  type QualityRuntimeRegistrySnapshot,
} from "./registry";

export {
  QualityRuntimeProvider,
  createQualityRuntimePort,
  getQualityRuntimeFactory,
  getQualityRuntimePort,
} from "./providers";

export { getQualityRuntimeHealthSummary, type QualityRuntimeHealthSummary } from "./demo";
