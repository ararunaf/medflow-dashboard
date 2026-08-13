/**
 * Enterprise Identity Runtime — S2-02.
 *
 * Fluxo estrutural oficial (S2-02):
 *   Produto → Enterprise Runtime → IdentityRuntimePort
 *     → DefaultIdentityRuntimeAdapter / EnterpriseIdentityRuntimeAdapter /
 *       MockIdentityRuntimeAdapter
 *     → InMemoryIdentityRuntimeStore → IdentityResult
 *
 * S2-02: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / findings de identidade futura (openJob/closeJob/submitRequest/
 * registerFinding/getResult/stats). Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 * Sem persistência. Sem banco. Sem APIs.
 */
export type {
  BusinessIdentity,
  CanonicalIdentityOperation,
  ClinicalIdentity,
  CloseIdentityJobInput,
  CloseIdentityJobResult,
  ComplianceIdentity,
  FinancialIdentity,
  FutureIdentityTypeContract,
  GetIdentityResultInput,
  GetIdentityResultResult,
  OpenIdentityJobInput,
  OpenIdentityJobResult,
  OperatorIdentity,
  QualityIdentity,
  RegisterIdentityFindingInput,
  RegisterIdentityFindingResult,
  IdentityContext,
  IdentityFinding,
  IdentityHealth,
  IdentityIssue,
  IdentityJob,
  IdentityJustification,
  IdentityMetadata,
  IdentityRecommendation,
  IdentityRequest,
  IdentityResult,
  IdentityRuntimeCapabilities,
  IdentityRuntimeEngineCapabilities,
  IdentityRuntimeEnterpriseDeps,
  IdentityRuntimeHealth,
  IdentityRuntimeInfo,
  IdentityRuntimeOperationalControls,
  IdentityRuntimeOperationEnvelope,
  IdentityRuntimeOptions,
  IdentityRuntimePort,
  IdentityRuntimeProviderId,
  IdentityRuntimeProviderMetadata,
  IdentityRuntimeProviderOptions,
  IdentityRuntimeRegistration,
  IdentityRuntimeStatus,
  IdentityRuntimeStructuredLog,
  IdentityRuntimeTelemetry,
  IdentityScore,
  IdentityStatistics,
  IdentityStatsInput,
  IdentityStatsResult,
  IdentityStatus,
  IdentitySummary,
  IdentityTypeContract,
  IdentityTypeKind,
  SubmitIdentityRequestInput,
  SubmitIdentityRequestResult,
  TechnicalIdentity,
  TISSIdentity,
} from "./ports";

export {
  IDENTITY_RUNTIME_IDENTITY,
  DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
  createIdentityFindingId,
  createIdentityIssueId,
  createIdentityJobId,
  createIdentityJustificationId,
  createIdentityRecommendationId,
  createIdentityRequestId,
  createIdentityResultId,
  createIdentityRuntimeRequestId,
  createIdentityScoreId,
  createIdentitySummaryId,
  createDisabledIdentityTypeContract,
  defineIdentityRuntimeEngineCapabilities,
  emptyIdentityRuntimeEngineCapabilities,
  resetAllIdentityRuntimeIdSequences,
  toCanonicalIdentityCapabilities,
} from "./ports";

export {
  DEFAULT_IDENTITY_RUNTIME_ADAPTER_ID,
  DEFAULT_IDENTITY_RUNTIME_VERSION,
  DEFAULT_MOCK_IDENTITY_RUNTIME_VERSION,
  DefaultIdentityRuntimeAdapter,
  EnterpriseIdentityRuntimeAdapter,
  MOCK_IDENTITY_RUNTIME_ADAPTER_ID,
  MockIdentityRuntimeAdapter,
  REALTISS_IDENTITY_RUNTIME_ADAPTER_ID,
  REALTISS_IDENTITY_RUNTIME_VERSION,
  RealTissIdentityRuntimeAdapter,
  TEST_IDENTITY_RUNTIME_ADAPTER_ID,
  TEST_IDENTITY_RUNTIME_VERSION,
  TestIdentityRuntimeAdapter,
  type DefaultIdentityRuntimeAdapterOptions,
  type MockIdentityRuntimeAdapterOptions,
  type RealTissIdentityRuntimeAdapterOptions,
  type TestIdentityRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_IDENTITY_RUNTIME_STORE_ID,
  InMemoryIdentityRuntimeStore,
  type IdentityRuntimeStore,
  type InMemoryIdentityRuntimeStoreOptions,
  type StoredIdentityRuntimeFinding,
  type StoredIdentityRuntimeJob,
  type StoredIdentityRuntimeRequest,
  type StoredIdentityRuntimeResult,
} from "./store";

export {
  IdentityRuntimeFactory,
  createIdentityRuntimeFactory,
  type IdentityRuntimeFactoryOptions,
} from "./factory";

export {
  IdentityRuntimeRegistry,
  BUILTIN_IDENTITY_RUNTIME_PROVIDER_COUNT,
  createDefaultIdentityRuntimeRegistry,
  type IdentityRuntimeRegistrySnapshot,
} from "./registry";

export {
  IdentityRuntimeProvider,
  createIdentityRuntimePort,
  getIdentityRuntimeFactory,
  getIdentityRuntimePort,
} from "./providers";
