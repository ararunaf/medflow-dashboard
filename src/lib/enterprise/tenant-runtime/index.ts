/**
 * Enterprise Tenant Runtime — S3-02.
 *
 * Fluxo estrutural oficial (S3-02):
 *   Produto → Enterprise Runtime → TenantRuntimePort
 *     → DefaultTenantRuntimeAdapter / EnterpriseTenantRuntimeAdapter /
 *       MockTenantRuntimeAdapter
 *     → InMemoryTenantRuntimeStore → TenantResult
 *
 * S3-02: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / findings de identidade futura (openJob/closeJob/submitRequest/
 * registerFinding/getResult/stats). Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 * Sem persistência. Sem banco. Sem APIs.
 */
export type {
  BusinessTenant,
  CanonicalTenantOperation,
  ClinicalTenant,
  CloseTenantJobInput,
  CloseTenantJobResult,
  ComplianceTenant,
  FinancialTenant,
  FutureTenantTypeContract,
  GetTenantResultInput,
  GetTenantResultResult,
  OpenTenantJobInput,
  OpenTenantJobResult,
  OperatorTenant,
  QualityTenant,
  RegisterTenantFindingInput,
  RegisterTenantFindingResult,
  TenantContext,
  TenantFinding,
  TenantHealth,
  TenantIssue,
  TenantJob,
  TenantJustification,
  TenantMetadata,
  TenantRecommendation,
  TenantRequest,
  TenantResult,
  TenantRuntimeCapabilities,
  TenantRuntimeEngineCapabilities,
  TenantRuntimeEnterpriseDeps,
  TenantRuntimeHealth,
  TenantRuntimeInfo,
  TenantRuntimeOperationalControls,
  TenantRuntimeOperationEnvelope,
  TenantRuntimeOptions,
  TenantRuntimePort,
  TenantRuntimeProviderId,
  TenantRuntimeProviderMetadata,
  TenantRuntimeProviderOptions,
  TenantRuntimeRegistration,
  TenantRuntimeStatus,
  TenantRuntimeStructuredLog,
  TenantRuntimeTelemetry,
  TenantScore,
  TenantStatistics,
  TenantStatsInput,
  TenantStatsResult,
  TenantStatus,
  TenantSummary,
  TenantTypeContract,
  TenantTypeKind,
  SubmitTenantRequestInput,
  SubmitTenantRequestResult,
  TechnicalTenant,
  TISSTenant,
} from "./ports";

export {
  TENANT_RUNTIME_IDENTITY,
  DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES,
  createTenantFindingId,
  createTenantIssueId,
  createTenantJobId,
  createTenantJustificationId,
  createTenantRecommendationId,
  createTenantRequestId,
  createTenantResultId,
  createTenantRuntimeRequestId,
  createTenantScoreId,
  createTenantSummaryId,
  createDisabledTenantTypeContract,
  defineTenantRuntimeEngineCapabilities,
  emptyTenantRuntimeEngineCapabilities,
  resetAllTenantRuntimeIdSequences,
  toCanonicalTenantCapabilities,
} from "./ports";

export {
  DEFAULT_TENANT_RUNTIME_ADAPTER_ID,
  DEFAULT_TENANT_RUNTIME_VERSION,
  DEFAULT_MOCK_TENANT_RUNTIME_VERSION,
  DefaultTenantRuntimeAdapter,
  EnterpriseTenantRuntimeAdapter,
  MOCK_TENANT_RUNTIME_ADAPTER_ID,
  MockTenantRuntimeAdapter,
  REALTISS_TENANT_RUNTIME_ADAPTER_ID,
  REALTISS_TENANT_RUNTIME_VERSION,
  RealTissTenantRuntimeAdapter,
  TEST_TENANT_RUNTIME_ADAPTER_ID,
  TEST_TENANT_RUNTIME_VERSION,
  TestTenantRuntimeAdapter,
  type DefaultTenantRuntimeAdapterOptions,
  type MockTenantRuntimeAdapterOptions,
  type RealTissTenantRuntimeAdapterOptions,
  type TestTenantRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_TENANT_RUNTIME_STORE_ID,
  InMemoryTenantRuntimeStore,
  type TenantRuntimeStore,
  type InMemoryTenantRuntimeStoreOptions,
  type StoredTenantRuntimeFinding,
  type StoredTenantRuntimeJob,
  type StoredTenantRuntimeRequest,
  type StoredTenantRuntimeResult,
} from "./store";

export {
  TenantRuntimeFactory,
  createTenantRuntimeFactory,
  type TenantRuntimeFactoryOptions,
} from "./factory";

export {
  TenantRuntimeRegistry,
  BUILTIN_TENANT_RUNTIME_PROVIDER_COUNT,
  createDefaultTenantRuntimeRegistry,
  type TenantRuntimeRegistrySnapshot,
} from "./registry";

export {
  TenantRuntimeProvider,
  createTenantRuntimePort,
  getTenantRuntimeFactory,
  getTenantRuntimePort,
} from "./providers";
