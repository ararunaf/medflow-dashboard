/**
 * Enterprise Security Runtime — S1-02.
 *
 * Fluxo estrutural oficial (S1-02):
 *   Produto → Enterprise Runtime → SecurityRuntimePort
 *     → DefaultSecurityRuntimeAdapter / EnterpriseSecurityRuntimeAdapter /
 *       MockSecurityRuntimeAdapter
 *     → InMemorySecurityRuntimeStore → SecurityResult
 *
 * S1-02: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / findings de segurança futura (openJob/closeJob/submitRequest/
 * registerFinding/getResult/stats). Sem segurança real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 * Sem persistência. Sem banco. Sem APIs.
 */
export type {
  BusinessSecurity,
  CanonicalSecurityOperation,
  ClinicalSecurity,
  CloseSecurityJobInput,
  CloseSecurityJobResult,
  ComplianceSecurity,
  FinancialSecurity,
  FutureSecurityTypeContract,
  GetSecurityResultInput,
  GetSecurityResultResult,
  OpenSecurityJobInput,
  OpenSecurityJobResult,
  OperatorSecurity,
  QualitySecurity,
  RegisterSecurityFindingInput,
  RegisterSecurityFindingResult,
  SecurityContext,
  SecurityFinding,
  SecurityHealth,
  SecurityIssue,
  SecurityJob,
  SecurityJustification,
  SecurityMetadata,
  SecurityRecommendation,
  SecurityRequest,
  SecurityResult,
  SecurityRuntimeCapabilities,
  SecurityRuntimeEngineCapabilities,
  SecurityRuntimeEnterpriseDeps,
  SecurityRuntimeHealth,
  SecurityRuntimeInfo,
  SecurityRuntimeOperationalControls,
  SecurityRuntimeOperationEnvelope,
  SecurityRuntimeOptions,
  SecurityRuntimePort,
  SecurityRuntimeProviderId,
  SecurityRuntimeProviderMetadata,
  SecurityRuntimeProviderOptions,
  SecurityRuntimeRegistration,
  SecurityRuntimeStatus,
  SecurityRuntimeStructuredLog,
  SecurityRuntimeTelemetry,
  SecurityScore,
  SecurityStatistics,
  SecurityStatsInput,
  SecurityStatsResult,
  SecurityStatus,
  SecuritySummary,
  SecurityTypeContract,
  SecurityTypeKind,
  SubmitSecurityRequestInput,
  SubmitSecurityRequestResult,
  TechnicalSecurity,
  TISSSecurity,
} from "./ports";

export {
  SECURITY_RUNTIME_IDENTITY,
  DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
  createSecurityFindingId,
  createSecurityIssueId,
  createSecurityJobId,
  createSecurityJustificationId,
  createSecurityRecommendationId,
  createSecurityRequestId,
  createSecurityResultId,
  createSecurityRuntimeRequestId,
  createSecurityScoreId,
  createSecuritySummaryId,
  createDisabledSecurityTypeContract,
  defineSecurityRuntimeEngineCapabilities,
  emptySecurityRuntimeEngineCapabilities,
  resetAllSecurityRuntimeIdSequences,
  toCanonicalSecurityCapabilities,
} from "./ports";

export {
  DEFAULT_SECURITY_RUNTIME_ADAPTER_ID,
  DEFAULT_SECURITY_RUNTIME_VERSION,
  DEFAULT_MOCK_SECURITY_RUNTIME_VERSION,
  DefaultSecurityRuntimeAdapter,
  EnterpriseSecurityRuntimeAdapter,
  MOCK_SECURITY_RUNTIME_ADAPTER_ID,
  MockSecurityRuntimeAdapter,
  REALTISS_SECURITY_RUNTIME_ADAPTER_ID,
  REALTISS_SECURITY_RUNTIME_VERSION,
  RealTissSecurityRuntimeAdapter,
  TEST_SECURITY_RUNTIME_ADAPTER_ID,
  TEST_SECURITY_RUNTIME_VERSION,
  TestSecurityRuntimeAdapter,
  type DefaultSecurityRuntimeAdapterOptions,
  type MockSecurityRuntimeAdapterOptions,
  type RealTissSecurityRuntimeAdapterOptions,
  type TestSecurityRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_SECURITY_RUNTIME_STORE_ID,
  InMemorySecurityRuntimeStore,
  type SecurityRuntimeStore,
  type InMemorySecurityRuntimeStoreOptions,
  type StoredSecurityRuntimeFinding,
  type StoredSecurityRuntimeJob,
  type StoredSecurityRuntimeRequest,
  type StoredSecurityRuntimeResult,
} from "./store";

export {
  SecurityRuntimeFactory,
  createSecurityRuntimeFactory,
  type SecurityRuntimeFactoryOptions,
} from "./factory";

export {
  SecurityRuntimeRegistry,
  BUILTIN_SECURITY_RUNTIME_PROVIDER_COUNT,
  createDefaultSecurityRuntimeRegistry,
  type SecurityRuntimeRegistrySnapshot,
} from "./registry";

export {
  SecurityRuntimeProvider,
  createSecurityRuntimePort,
  getSecurityRuntimeFactory,
  getSecurityRuntimePort,
} from "./providers";
