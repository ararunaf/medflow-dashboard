/**
 * Enterprise Authorization Runtime — S3-02.
 *
 * Fluxo estrutural oficial (S3-02):
 *   Produto → Enterprise Runtime → AuthorizationRuntimePort
 *     → DefaultAuthorizationRuntimeAdapter / EnterpriseAuthorizationRuntimeAdapter /
 *       MockAuthorizationRuntimeAdapter
 *     → InMemoryAuthorizationRuntimeStore → AuthorizationResult
 *
 * S3-02: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / findings de identidade futura (openJob/closeJob/submitRequest/
 * registerFinding/getResult/stats). Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 * Sem persistência. Sem banco. Sem APIs.
 */
export type {
  BusinessAuthorization,
  CanonicalAuthorizationOperation,
  ClinicalAuthorization,
  CloseAuthorizationJobInput,
  CloseAuthorizationJobResult,
  ComplianceAuthorization,
  FinancialAuthorization,
  FutureAuthorizationTypeContract,
  GetAuthorizationResultInput,
  GetAuthorizationResultResult,
  OpenAuthorizationJobInput,
  OpenAuthorizationJobResult,
  OperatorAuthorization,
  QualityAuthorization,
  RegisterAuthorizationFindingInput,
  RegisterAuthorizationFindingResult,
  AuthorizationContext,
  AuthorizationFinding,
  AuthorizationHealth,
  AuthorizationIssue,
  AuthorizationJob,
  AuthorizationJustification,
  AuthorizationMetadata,
  AuthorizationRecommendation,
  AuthorizationRequest,
  AuthorizationResult,
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeEngineCapabilities,
  AuthorizationRuntimeEnterpriseDeps,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeOperationalControls,
  AuthorizationRuntimeOperationEnvelope,
  AuthorizationRuntimeOptions,
  AuthorizationRuntimePort,
  AuthorizationRuntimeProviderId,
  AuthorizationRuntimeProviderMetadata,
  AuthorizationRuntimeProviderOptions,
  AuthorizationRuntimeRegistration,
  AuthorizationRuntimeStatus,
  AuthorizationRuntimeStructuredLog,
  AuthorizationRuntimeTelemetry,
  AuthorizationScore,
  AuthorizationStatistics,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  AuthorizationStatus,
  AuthorizationSummary,
  AuthorizationTypeContract,
  AuthorizationTypeKind,
  SubmitAuthorizationRequestInput,
  SubmitAuthorizationRequestResult,
  TechnicalAuthorization,
  TISSAuthorization,
} from "./ports";

export {
  AUTHORIZATION_RUNTIME_IDENTITY,
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  createAuthorizationFindingId,
  createAuthorizationIssueId,
  createAuthorizationJobId,
  createAuthorizationJustificationId,
  createAuthorizationRecommendationId,
  createAuthorizationRequestId,
  createAuthorizationResultId,
  createAuthorizationRuntimeRequestId,
  createAuthorizationScoreId,
  createAuthorizationSummaryId,
  createDisabledAuthorizationTypeContract,
  defineAuthorizationRuntimeEngineCapabilities,
  emptyAuthorizationRuntimeEngineCapabilities,
  resetAllAuthorizationRuntimeIdSequences,
  toCanonicalAuthorizationCapabilities,
} from "./ports";

export {
  DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  DEFAULT_AUTHORIZATION_RUNTIME_VERSION,
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION,
  DefaultAuthorizationRuntimeAdapter,
  EnterpriseAuthorizationRuntimeAdapter,
  MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  MockAuthorizationRuntimeAdapter,
  REALTISS_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  REALTISS_AUTHORIZATION_RUNTIME_VERSION,
  RealTissAuthorizationRuntimeAdapter,
  TEST_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  TEST_AUTHORIZATION_RUNTIME_VERSION,
  TestAuthorizationRuntimeAdapter,
  type DefaultAuthorizationRuntimeAdapterOptions,
  type MockAuthorizationRuntimeAdapterOptions,
  type RealTissAuthorizationRuntimeAdapterOptions,
  type TestAuthorizationRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID,
  InMemoryAuthorizationRuntimeStore,
  type AuthorizationRuntimeStore,
  type InMemoryAuthorizationRuntimeStoreOptions,
  type StoredAuthorizationRuntimeFinding,
  type StoredAuthorizationRuntimeJob,
  type StoredAuthorizationRuntimeRequest,
  type StoredAuthorizationRuntimeResult,
} from "./store";

export {
  AuthorizationRuntimeFactory,
  createAuthorizationRuntimeFactory,
  type AuthorizationRuntimeFactoryOptions,
} from "./factory";

export {
  AuthorizationRuntimeRegistry,
  BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT,
  createDefaultAuthorizationRuntimeRegistry,
  type AuthorizationRuntimeRegistrySnapshot,
} from "./registry";

export {
  AuthorizationRuntimeProvider,
  createAuthorizationRuntimePort,
  getAuthorizationRuntimeFactory,
  getAuthorizationRuntimePort,
} from "./providers";
