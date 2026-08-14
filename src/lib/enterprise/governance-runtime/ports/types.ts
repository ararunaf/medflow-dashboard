/**
 * Tipos vendor-agnósticos do Enterprise Governance Runtime — S6-02.
 *
 * S6-02: infraestrutura canônica estrutural apenas — sem identidade real /
 * sem criptografia / sem assinatura digital / sem cadeia de custódia /
 * sem Key Vault / sem HSM / sem SIEM / sem OpenTelemetry / sem LGPD /
 * sem autenticação / sem autorização.
 */
import type {
  GovernanceContext,
  GovernanceFinding,
  GovernanceJob,
  GovernanceMetadata,
  GovernanceRequest,
  GovernanceResult,
  GovernanceStatistics,
} from "./canonical";
import type { GovernanceRuntimeEngineCapabilities } from "./capabilities";

export type {
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
  GovernanceScore,
  GovernanceStatistics,
  GovernanceStatus,
  GovernanceSummary,
  GovernanceTypeContract,
  GovernanceTypeKind,
  BusinessGovernance,
  CanonicalGovernanceOperation,
  ClinicalGovernance,
  FutureGovernanceTypeContract,
  OperatorGovernance,
  QualityGovernance,
  TechnicalGovernance,
  TISSGovernance,
} from "./canonical";
export type { GovernanceRuntimeEngineCapabilities };

/** Provedores / mecanismos do Governance Runtime (adapters do Port). */
export type GovernanceRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";

/** Status operacional declarado no registry (S6-02). */
export type GovernanceRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (S6-02). */
export type GovernanceRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (S6-02). */
export type GovernanceRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: GovernanceRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Governance Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type GovernanceRuntimeHealth = {
  ok: boolean;
  provider: GovernanceRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: GovernanceRuntimeStatus;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  governanceJustificationImplemented: false;
  governanceScoreImplemented: false;
  governanceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter ativo.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type GovernanceRuntimeCapabilities = {
  provider: GovernanceRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalGovernance: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesAIOrchestrationRuntimePort: boolean;
  usesValidationRuntimePort: boolean;
  usesDocumentExtractionRuntimePort: boolean;
  usesDocumentClassificationRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesIntelligentCaptureRuntimePort: boolean;
  usesScannerRuntimePort: boolean;
  usesWatchFolderRuntimePort: boolean;
  usesUploadRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  usesScalabilityRuntimePort: boolean;
  runtimeReady: true;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  governanceJustificationImplemented: false;
  governanceScoreImplemented: false;
  governanceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Espelho declarativo (engine) e canônico (S6-02) — informativo. */
  engine?: GovernanceRuntimeEngineCapabilities;
  canonical?: import("./canonical").GovernanceCapabilities;
};

/** Metadados estáveis do provedor (S6-02). */
export type GovernanceRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (S6-02). */
export type GovernanceRuntimeInfo = {
  providerId: GovernanceRuntimeProviderId;
  metadata: GovernanceRuntimeProviderMetadata;
  status: GovernanceRuntimeStatus;
  providerType: "GOVERNANCE_RUNTIME";
  capabilities: GovernanceRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — S6-02. */
export type GovernanceRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — S6-02. */
export type GovernanceRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: GovernanceRuntimeProviderId;
  telemetry: GovernanceRuntimeTelemetry;
  logs?: readonly GovernanceRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * S6-02: sem peers estruturais (scaffolding puro).
 */
export type GovernanceRuntimeEnterpriseDeps = Record<string, unknown>;

/** Opções de resolução do GovernanceRuntimePort. */
export type GovernanceRuntimeProviderOptions = {
  provider?: GovernanceRuntimeProviderId;
  enterpriseDeps?: GovernanceRuntimeEnterpriseDeps;
};

/** Alias S6-02 — resolução do GovernanceRuntimePort (default: `enterprise`). */
export type GovernanceRuntimeOptions = GovernanceRuntimeProviderOptions;

/** Entrada de registro no GovernanceRuntimeRegistry (S6-02). */
export type GovernanceRuntimeRegistration = {
  providerId: GovernanceRuntimeProviderId;
  name: string;
  version: string;
  status: GovernanceRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: GovernanceRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// S6-02 — operações estruturais (openJob / closeJob / submitRequest /
// registerFinding / getResult / stats). Nunca executam identidade real.
// ---------------------------------------------------------------------------

export type OpenGovernanceJobInput = GovernanceRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: GovernanceMetadata;
  governanceContext?: GovernanceContext;
};

export type OpenGovernanceJobResult = GovernanceRuntimeOperationEnvelope & {
  result?: GovernanceResult;
  job?: GovernanceJob;
};

export type CloseGovernanceJobInput = GovernanceRuntimeOperationalControls & {
  jobId: string;
};

export type CloseGovernanceJobResult = GovernanceRuntimeOperationEnvelope & {
  result?: GovernanceResult;
  job?: GovernanceJob;
};

export type SubmitGovernanceRequestInput = GovernanceRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  findingId?: string;
  metadata?: GovernanceMetadata;
  governanceContext?: GovernanceContext;
};

export type SubmitGovernanceRequestResult = GovernanceRuntimeOperationEnvelope & {
  result?: GovernanceResult;
  job?: GovernanceJob;
  request?: GovernanceRequest;
};

export type RegisterGovernanceFindingInput = GovernanceRuntimeOperationalControls & {
  findingId?: string;
  jobId?: string;
  requestId?: string;
  governanceType?: import("./canonical").GovernanceTypeKind;
  metadata?: GovernanceMetadata;
  governanceContext?: GovernanceContext;
};

export type RegisterGovernanceFindingResult = GovernanceRuntimeOperationEnvelope & {
  result?: GovernanceResult;
  finding?: GovernanceFinding;
};

export type GetGovernanceResultInput = GovernanceRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  findingId?: string;
};

export type GetGovernanceResultResult = GovernanceRuntimeOperationEnvelope & {
  result?: GovernanceResult;
  job?: GovernanceJob;
  request?: GovernanceRequest;
  finding?: GovernanceFinding;
};

export type GovernanceStatsInput = GovernanceRuntimeOperationalControls & {
  jobId?: string;
};

export type GovernanceStatsResult = GovernanceRuntimeOperationEnvelope & {
  statistics?: GovernanceStatistics;
  result?: GovernanceResult;
};
