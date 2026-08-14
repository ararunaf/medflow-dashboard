/**
 * Enterprise Governance Runtime — S6-02.
 *
 * Fluxo estrutural oficial (S6-02):
 *   Produto → Enterprise Runtime → GovernanceRuntimePort
 *     → DefaultGovernanceRuntimeAdapter / EnterpriseGovernanceRuntimeAdapter /
 *       MockGovernanceRuntimeAdapter
 *     → InMemoryGovernanceRuntimeStore → GovernanceResult
 *
 * S6-02: infraestrutura canônica de orquestração estrutural de jobs /
 * requests / findings de identidade futura (openJob/closeJob/submitRequest/
 * registerFinding/getResult/stats). Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 * Sem persistência. Sem banco. Sem APIs.
 */
export type {
  BusinessGovernance,
  CanonicalGovernanceOperation,
  ClinicalGovernance,
  CloseGovernanceJobInput,
  CloseGovernanceJobResult,
  FutureGovernanceTypeContract,
  GetGovernanceResultInput,
  GetGovernanceResultResult,
  OpenGovernanceJobInput,
  OpenGovernanceJobResult,
  OperatorGovernance,
  QualityGovernance,
  RegisterGovernanceFindingInput,
  RegisterGovernanceFindingResult,
  GovernanceContext,
  GovernanceFinding,
  GovernanceHealth,
  GovernanceIssue,
  GovernanceJob,
  GovernanceJustification,
  GovernanceMetadata,
  GovernanceRecommendation,
  GovernanceRequest,
  GovernanceResult,
  GovernanceRuntimeCapabilities,
  GovernanceRuntimeEngineCapabilities,
  GovernanceRuntimeEnterpriseDeps,
  GovernanceRuntimeHealth,
  GovernanceRuntimeInfo,
  GovernanceRuntimeOperationalControls,
  GovernanceRuntimeOperationEnvelope,
  GovernanceRuntimeOptions,
  GovernanceRuntimePort,
  GovernanceRuntimeProviderId,
  GovernanceRuntimeProviderMetadata,
  GovernanceRuntimeProviderOptions,
  GovernanceRuntimeRegistration,
  GovernanceRuntimeStatus,
  GovernanceRuntimeStructuredLog,
  GovernanceRuntimeTelemetry,
  GovernanceScore,
  GovernanceStatistics,
  GovernanceStatsInput,
  GovernanceStatsResult,
  GovernanceStatus,
  GovernanceSummary,
  GovernanceTypeContract,
  GovernanceTypeKind,
  SubmitGovernanceRequestInput,
  SubmitGovernanceRequestResult,
  TechnicalGovernance,
  TISSGovernance,
} from "./ports";

export {
  GOVERNANCE_RUNTIME_IDENTITY,
  DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
  createGovernanceFindingId,
  createGovernanceIssueId,
  createGovernanceJobId,
  createGovernanceJustificationId,
  createGovernanceRecommendationId,
  createGovernanceRequestId,
  createGovernanceResultId,
  createGovernanceRuntimeRequestId,
  createGovernanceScoreId,
  createGovernanceSummaryId,
  createDisabledGovernanceTypeContract,
  defineGovernanceRuntimeEngineCapabilities,
  emptyGovernanceRuntimeEngineCapabilities,
  resetAllGovernanceRuntimeIdSequences,
  toCanonicalGovernanceCapabilities,
} from "./ports";

export {
  DEFAULT_GOVERNANCE_RUNTIME_ADAPTER_ID,
  DEFAULT_GOVERNANCE_RUNTIME_VERSION,
  DEFAULT_MOCK_GOVERNANCE_RUNTIME_VERSION,
  DefaultGovernanceRuntimeAdapter,
  EnterpriseGovernanceRuntimeAdapter,
  MOCK_GOVERNANCE_RUNTIME_ADAPTER_ID,
  MockGovernanceRuntimeAdapter,
  REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID,
  REALTISS_GOVERNANCE_RUNTIME_VERSION,
  RealTissGovernanceRuntimeAdapter,
  TEST_GOVERNANCE_RUNTIME_ADAPTER_ID,
  TEST_GOVERNANCE_RUNTIME_VERSION,
  TestGovernanceRuntimeAdapter,
  type DefaultGovernanceRuntimeAdapterOptions,
  type MockGovernanceRuntimeAdapterOptions,
  type RealTissGovernanceRuntimeAdapterOptions,
  type TestGovernanceRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_GOVERNANCE_RUNTIME_STORE_ID,
  InMemoryGovernanceRuntimeStore,
  type GovernanceRuntimeStore,
  type InMemoryGovernanceRuntimeStoreOptions,
  type StoredGovernanceRuntimeFinding,
  type StoredGovernanceRuntimeJob,
  type StoredGovernanceRuntimeRequest,
  type StoredGovernanceRuntimeResult,
} from "./store";

export {
  GovernanceRuntimeFactory,
  createGovernanceRuntimeFactory,
  type GovernanceRuntimeFactoryOptions,
} from "./factory";

export {
  GovernanceRuntimeRegistry,
  BUILTIN_GOVERNANCE_RUNTIME_PROVIDER_COUNT,
  createDefaultGovernanceRuntimeRegistry,
  type GovernanceRuntimeRegistrySnapshot,
} from "./registry";

export {
  GovernanceRuntimeProvider,
  createGovernanceRuntimePort,
  getGovernanceRuntimeFactory,
  getGovernanceRuntimePort,
} from "./providers";
