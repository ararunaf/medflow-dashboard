/**
 * Enterprise Compliance Runtime — S3-02.
 *
 * Fluxo estrutural oficial (S3-02):
 *   Produto → Enterprise Runtime → ComplianceRuntimePort
 *     → DefaultComplianceRuntimeAdapter / EnterpriseComplianceRuntimeAdapter /
 *       MockComplianceRuntimeAdapter
 *     → InMemoryComplianceRuntimeStore → ComplianceResult
 *
 * S3-02: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / findings de identidade futura (openJob/closeJob/submitRequest/
 * registerFinding/getResult/stats). Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 * Sem persistência. Sem banco. Sem APIs.
 */
export type {
  BusinessCompliance,
  CanonicalComplianceOperation,
  ClinicalCompliance,
  CloseComplianceJobInput,
  CloseComplianceJobResult,
  ComplianceCompliance,
  FinancialCompliance,
  FutureComplianceTypeContract,
  GetComplianceResultInput,
  GetComplianceResultResult,
  OpenComplianceJobInput,
  OpenComplianceJobResult,
  OperatorCompliance,
  QualityCompliance,
  RegisterComplianceFindingInput,
  RegisterComplianceFindingResult,
  ComplianceContext,
  ComplianceFinding,
  ComplianceHealth,
  ComplianceIssue,
  ComplianceJob,
  ComplianceJustification,
  ComplianceMetadata,
  ComplianceRecommendation,
  ComplianceRequest,
  ComplianceResult,
  ComplianceRuntimeCapabilities,
  ComplianceRuntimeEngineCapabilities,
  ComplianceRuntimeEnterpriseDeps,
  ComplianceRuntimeHealth,
  ComplianceRuntimeInfo,
  ComplianceRuntimeOperationalControls,
  ComplianceRuntimeOperationEnvelope,
  ComplianceRuntimeOptions,
  ComplianceRuntimePort,
  ComplianceRuntimeProviderId,
  ComplianceRuntimeProviderMetadata,
  ComplianceRuntimeProviderOptions,
  ComplianceRuntimeRegistration,
  ComplianceRuntimeStatus,
  ComplianceRuntimeStructuredLog,
  ComplianceRuntimeTelemetry,
  ComplianceScore,
  ComplianceStatistics,
  ComplianceStatsInput,
  ComplianceStatsResult,
  ComplianceStatus,
  ComplianceSummary,
  ComplianceTypeContract,
  ComplianceTypeKind,
  SubmitComplianceRequestInput,
  SubmitComplianceRequestResult,
  TechnicalCompliance,
  TISSCompliance,
} from "./ports";

export {
  COMPLIANCE_RUNTIME_IDENTITY,
  DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
  createComplianceFindingId,
  createComplianceIssueId,
  createComplianceJobId,
  createComplianceJustificationId,
  createComplianceRecommendationId,
  createComplianceRequestId,
  createComplianceResultId,
  createComplianceRuntimeRequestId,
  createComplianceScoreId,
  createComplianceSummaryId,
  createDisabledComplianceTypeContract,
  defineComplianceRuntimeEngineCapabilities,
  emptyComplianceRuntimeEngineCapabilities,
  resetAllComplianceRuntimeIdSequences,
  toCanonicalComplianceCapabilities,
} from "./ports";

export {
  DEFAULT_COMPLIANCE_RUNTIME_ADAPTER_ID,
  DEFAULT_COMPLIANCE_RUNTIME_VERSION,
  DEFAULT_MOCK_COMPLIANCE_RUNTIME_VERSION,
  DefaultComplianceRuntimeAdapter,
  EnterpriseComplianceRuntimeAdapter,
  MOCK_COMPLIANCE_RUNTIME_ADAPTER_ID,
  MockComplianceRuntimeAdapter,
  REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLIANCE_RUNTIME_VERSION,
  RealTissComplianceRuntimeAdapter,
  TEST_COMPLIANCE_RUNTIME_ADAPTER_ID,
  TEST_COMPLIANCE_RUNTIME_VERSION,
  TestComplianceRuntimeAdapter,
  type DefaultComplianceRuntimeAdapterOptions,
  type MockComplianceRuntimeAdapterOptions,
  type RealTissComplianceRuntimeAdapterOptions,
  type TestComplianceRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_COMPLIANCE_RUNTIME_STORE_ID,
  InMemoryComplianceRuntimeStore,
  type ComplianceRuntimeStore,
  type InMemoryComplianceRuntimeStoreOptions,
  type StoredComplianceRuntimeFinding,
  type StoredComplianceRuntimeJob,
  type StoredComplianceRuntimeRequest,
  type StoredComplianceRuntimeResult,
} from "./store";

export {
  ComplianceRuntimeFactory,
  createComplianceRuntimeFactory,
  type ComplianceRuntimeFactoryOptions,
} from "./factory";

export {
  ComplianceRuntimeRegistry,
  BUILTIN_COMPLIANCE_RUNTIME_PROVIDER_COUNT,
  createDefaultComplianceRuntimeRegistry,
  type ComplianceRuntimeRegistrySnapshot,
} from "./registry";

export {
  ComplianceRuntimeProvider,
  createComplianceRuntimePort,
  getComplianceRuntimeFactory,
  getComplianceRuntimePort,
} from "./providers";
