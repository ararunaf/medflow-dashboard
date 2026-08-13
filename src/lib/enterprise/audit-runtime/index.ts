/**
 * Enterprise Audit Runtime — F3-CAP-10.
 *
 * Fluxo estrutural oficial (F3-CAP-10):
 *   Produto → Enterprise Runtime → AuditRuntimePort
 *     → DefaultAuditRuntimeAdapter / EnterpriseAuditRuntimeAdapter /
 *       MockAuditRuntimeAdapter
 *     → InMemoryAuditRuntimeStore → AuditResult
 *
 * F3-CAP-10: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / findings de auditoria futura (openJob/closeJob/submitRequest/
 * registerFinding/getResult/stats). Sem auditoria real. Sem IA. Sem OpenAI.
 * Sem Azure OpenAI. Sem Gemini. Sem Claude. Sem ML. Sem regras TISS.
 * Sem regras de operadoras. Sem justificativas automáticas. Sem correções
 * automáticas. Sem aprovação/rejeição automática. Sem persistência.
 * Sem banco. Sem APIs.
 *
 * Contrato oficial AuditContext:
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
  AuditCapabilities,
  AuditContext,
  AuditFinding,
  AuditHealth,
  AuditIssue,
  AuditJob,
  AuditJustification,
  AuditMetadata,
  AuditRecommendation,
  AuditRequest,
  AuditResult,
  AuditRuntimeCapabilities,
  AuditRuntimeEngineCapabilities,
  AuditRuntimeEnterpriseDeps,
  AuditRuntimeHealth,
  AuditRuntimeInfo,
  AuditRuntimeOperationalControls,
  AuditRuntimeOperationEnvelope,
  AuditRuntimeOptions,
  AuditRuntimePort,
  AuditRuntimeProviderId,
  AuditRuntimeProviderMetadata,
  AuditRuntimeProviderOptions,
  AuditRuntimeRegistration,
  AuditRuntimeStatus,
  AuditRuntimeStructuredLog,
  AuditRuntimeTelemetry,
  AuditScore,
  AuditStatistics,
  AuditStatsInput,
  AuditStatsResult,
  AuditStatus,
  AuditSummary,
  AuditTypeContract,
  AuditTypeKind,
  BusinessAudit,
  CanonicalAuditOperation,
  ClinicalAudit,
  CloseAuditJobInput,
  CloseAuditJobResult,
  ComplianceAudit,
  DocumentClassificationContext,
  DocumentExtractionResult,
  FinancialAudit,
  FutureAuditTypeContract,
  GetAuditResultInput,
  GetAuditResultResult,
  OpenAuditJobInput,
  OpenAuditJobResult,
  OperatorAudit,
  QualityAudit,
  RegisterAuditFindingInput,
  RegisterAuditFindingResult,
  SubmitAuditRequestInput,
  SubmitAuditRequestResult,
  TechnicalAudit,
  TISSAudit,
  ValidationResult,
} from "./ports";

export {
  AUDIT_RUNTIME_IDENTITY,
  DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
  createAuditFindingId,
  createAuditIssueId,
  createAuditJobId,
  createAuditJustificationId,
  createAuditRecommendationId,
  createAuditRequestId,
  createAuditResultId,
  createAuditRuntimeRequestId,
  createAuditScoreId,
  createAuditSummaryId,
  createDisabledAuditTypeContract,
  defineAuditRuntimeEngineCapabilities,
  emptyAuditRuntimeEngineCapabilities,
  resetAllAuditRuntimeIdSequences,
  toCanonicalAuditCapabilities,
} from "./ports";

export {
  DEFAULT_AUDIT_RUNTIME_ADAPTER_ID,
  DEFAULT_AUDIT_RUNTIME_VERSION,
  DEFAULT_MOCK_AUDIT_RUNTIME_VERSION,
  DefaultAuditRuntimeAdapter,
  EnterpriseAuditRuntimeAdapter,
  MOCK_AUDIT_RUNTIME_ADAPTER_ID,
  MockAuditRuntimeAdapter,
  REALTISS_AUDIT_RUNTIME_ADAPTER_ID,
  REALTISS_AUDIT_RUNTIME_VERSION,
  RealTissAuditRuntimeAdapter,
  type DefaultAuditRuntimeAdapterOptions,
  type MockAuditRuntimeAdapterOptions,
  type RealTissAuditRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_AUDIT_RUNTIME_STORE_ID,
  InMemoryAuditRuntimeStore,
  type AuditRuntimeStore,
  type InMemoryAuditRuntimeStoreOptions,
  type StoredAuditRuntimeFinding,
  type StoredAuditRuntimeJob,
  type StoredAuditRuntimeRequest,
  type StoredAuditRuntimeResult,
} from "./store";

export {
  AuditRuntimeFactory,
  createAuditRuntimeFactory,
  type AuditRuntimeFactoryOptions,
} from "./factory";

export {
  AuditRuntimeRegistry,
  BUILTIN_AUDIT_RUNTIME_PROVIDER_COUNT,
  createDefaultAuditRuntimeRegistry,
  type AuditRuntimeRegistrySnapshot,
} from "./registry";

export {
  AuditRuntimeProvider,
  createAuditRuntimePort,
  getAuditRuntimeFactory,
  getAuditRuntimePort,
} from "./providers";

export { getAuditRuntimeHealthSummary, type AuditRuntimeHealthSummary } from "./demo";
