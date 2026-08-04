/**
 * Enterprise Auto-Fill Runtime — F3-CAP-12.
 *
 * Fluxo estrutural oficial (F3-CAP-12):
 *   Produto → Enterprise Runtime → AutoFillRuntimePort
 *     → DefaultAutoFillRuntimeAdapter / EnterpriseAutoFillRuntimeAdapter /
 *       MockAutoFillRuntimeAdapter
 *     → InMemoryAutoFillRuntimeStore → AutoFillResult
 *
 * F3-CAP-12: infraestrutura canônica de orquestração estrutural de
 * preenchimento futuro de guias TISS (prepareAutoFill/getResult/stats).
 * Sem preenchimento automático. Sem geração de XML. Sem escrita em guias.
 * Sem integração com operadoras. Sem IA. Sem banco. Sem persistência. Sem APIs.
 *
 * Contrato oficial AutoFillContext:
 *   CanonicalGuide + CanonicalMappingResult + ValidationResult +
 *   AuditResult + AIOrchestrationContext
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências TISSMappingRuntime/AuditRuntime/ValidationRuntime/
 * DocumentExtractionRuntime/DocumentClassificationRuntime/OCRRuntime/
 * AIOrchestrationRuntime/IntelligentCaptureRuntime/Scanner/WatchFolder/Upload
 * preparadas — sem consumo funcional (shape-check apenas em health()).
 */
export type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillCapabilities,
  AutoFillContext,
  AutoFillField,
  AutoFillGuide,
  AutoFillGuideAnexo,
  AutoFillGuideConsulta,
  AutoFillGuideHonorarios,
  AutoFillGuideInternacao,
  AutoFillGuideOdontologica,
  AutoFillGuideResumoInternacao,
  AutoFillGuideSPADT,
  AutoFillGuideType,
  AutoFillHealth,
  AutoFillIssue,
  AutoFillOperator,
  AutoFillOperatorKind,
  AutoFillResult,
  AutoFillRuntimeCapabilities,
  AutoFillRuntimeEngineCapabilities,
  AutoFillRuntimeEnterpriseDeps,
  AutoFillRuntimeHealth,
  AutoFillRuntimeInfo,
  AutoFillRuntimeOperationalControls,
  AutoFillRuntimeOperationEnvelope,
  AutoFillRuntimeOptions,
  AutoFillRuntimePort,
  AutoFillRuntimeProviderId,
  AutoFillRuntimeProviderMetadata,
  AutoFillRuntimeProviderOptions,
  AutoFillRuntimeRegistration,
  AutoFillRuntimeStatus,
  AutoFillRuntimeStructuredLog,
  AutoFillRuntimeTelemetry,
  AutoFillSection,
  AutoFillSession,
  AutoFillStatistics,
  AutoFillStatsInput,
  AutoFillStatsResult,
  AutoFillStatus,
  CanonicalAutoFillOperation,
  CanonicalGuide,
  CanonicalGuideAnexo,
  CanonicalGuideConsulta,
  CanonicalGuideHonorarios,
  CanonicalGuideInternacao,
  CanonicalGuideOdontologica,
  CanonicalGuideResumoInternacao,
  CanonicalGuideSPADT,
  CanonicalGuideType,
  CanonicalMappingResult,
  CanonicalOperator,
  CanonicalOperatorKind,
  FutureAutoFillGuideContract,
  GetAutoFillResultInput,
  GetAutoFillResultResult,
  PrepareAutoFillInput,
  PrepareAutoFillResult,
  ValidationResult,
} from "./ports";

export {
  AUTO_FILL_RUNTIME_IDENTITY,
  DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
  createAutoFillFieldId,
  createAutoFillGuideId,
  createAutoFillId,
  createAutoFillIssueId,
  createAutoFillResultId,
  createAutoFillRuntimeRequestId,
  createAutoFillSectionId,
  createDisabledAutoFillGuide,
  createDisabledAutoFillOperator,
  defineAutoFillRuntimeEngineCapabilities,
  emptyAutoFillRuntimeEngineCapabilities,
  resetAllAutoFillRuntimeIdSequences,
  toAutoFillCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_AUTO_FILL_RUNTIME_VERSION,
  DEFAULT_AUTO_FILL_RUNTIME_ADAPTER_ID,
  DEFAULT_AUTO_FILL_RUNTIME_VERSION,
  DefaultAutoFillRuntimeAdapter,
  EnterpriseAutoFillRuntimeAdapter,
  MOCK_AUTO_FILL_RUNTIME_ADAPTER_ID,
  MockAutoFillRuntimeAdapter,
  type DefaultAutoFillRuntimeAdapterOptions,
  type MockAutoFillRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_AUTO_FILL_RUNTIME_STORE_ID,
  InMemoryAutoFillRuntimeStore,
  type InMemoryAutoFillRuntimeStoreOptions,
  type StoredAutoFillRuntimeResult,
  type StoredAutoFillRuntimeSession,
  type AutoFillRuntimeStore,
} from "./store";

export {
  AutoFillRuntimeFactory,
  createAutoFillRuntimeFactory,
  type AutoFillRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_AUTO_FILL_RUNTIME_PROVIDER_COUNT,
  AutoFillRuntimeRegistry,
  createDefaultAutoFillRuntimeRegistry,
  type AutoFillRuntimeRegistrySnapshot,
} from "./registry";

export {
  AutoFillRuntimeProvider,
  createAutoFillRuntimePort,
  getAutoFillRuntimeFactory,
  getAutoFillRuntimePort,
} from "./providers";

export { getAutoFillRuntimeHealthSummary, type AutoFillRuntimeHealthSummary } from "./demo";
