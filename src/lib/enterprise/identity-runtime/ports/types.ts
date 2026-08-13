/**
 * Tipos vendor-agnósticos do Enterprise Identity Runtime — S2-02.
 *
 * S2-02: infraestrutura canônica estrutural apenas — sem identidade real /
 * sem criptografia / sem assinatura digital / sem cadeia de custódia /
 * sem Key Vault / sem HSM / sem SIEM / sem OpenTelemetry / sem LGPD /
 * sem autenticação / sem autorização.
 */
import type {
  IdentityContext,
  IdentityFinding,
  IdentityJob,
  IdentityMetadata,
  IdentityRequest,
  IdentityResult,
  IdentityStatistics,
} from "./canonical";
import type { IdentityRuntimeEngineCapabilities } from "./capabilities";

export type {
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
  IdentityScore,
  IdentityStatistics,
  IdentityStatus,
  IdentitySummary,
  IdentityTypeContract,
  IdentityTypeKind,
  BusinessIdentity,
  CanonicalIdentityOperation,
  ClinicalIdentity,
  ComplianceIdentity,
  FinancialIdentity,
  FutureIdentityTypeContract,
  OperatorIdentity,
  QualityIdentity,
  TechnicalIdentity,
  TISSIdentity,
} from "./canonical";
export type { IdentityRuntimeEngineCapabilities };

/** Provedores / mecanismos do Identity Runtime (adapters do Port). */
export type IdentityRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";

/** Status operacional declarado no registry (S2-02). */
export type IdentityRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (S2-02). */
export type IdentityRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (S2-02). */
export type IdentityRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: IdentityRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Identity Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type IdentityRuntimeHealth = {
  ok: boolean;
  provider: IdentityRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: IdentityRuntimeStatus;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  identityEngineImplemented: false;
  businessRulesImplemented: false;
  tissIdentityImplemented: false;
  operatorIdentityImplemented: false;
  automaticIdentityImplemented: false;
  identitySuggestionsImplemented: false;
  identityJustificationImplemented: false;
  identityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter ativo.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type IdentityRuntimeCapabilities = {
  provider: IdentityRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalIdentity: boolean;
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
  identityEngineImplemented: false;
  businessRulesImplemented: false;
  tissIdentityImplemented: false;
  operatorIdentityImplemented: false;
  automaticIdentityImplemented: false;
  identitySuggestionsImplemented: false;
  identityJustificationImplemented: false;
  identityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Espelho declarativo (engine) e canônico (S2-02) — informativo. */
  engine?: IdentityRuntimeEngineCapabilities;
  canonical?: import("./canonical").IdentityCapabilities;
};

/** Metadados estáveis do provedor (S2-02). */
export type IdentityRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (S2-02). */
export type IdentityRuntimeInfo = {
  providerId: IdentityRuntimeProviderId;
  metadata: IdentityRuntimeProviderMetadata;
  status: IdentityRuntimeStatus;
  providerType: "IDENTITY_RUNTIME";
  capabilities: IdentityRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — S2-02. */
export type IdentityRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — S2-02. */
export type IdentityRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: IdentityRuntimeProviderId;
  telemetry: IdentityRuntimeTelemetry;
  logs?: readonly IdentityRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * S2-02: sem peers estruturais (scaffolding puro).
 */
export type IdentityRuntimeEnterpriseDeps = Record<string, never>;

/** Opções de resolução do IdentityRuntimePort. */
export type IdentityRuntimeProviderOptions = {
  provider?: IdentityRuntimeProviderId;
  enterpriseDeps?: IdentityRuntimeEnterpriseDeps;
};

/** Alias S2-02 — resolução do IdentityRuntimePort (default: `enterprise`). */
export type IdentityRuntimeOptions = IdentityRuntimeProviderOptions;

/** Entrada de registro no IdentityRuntimeRegistry (S2-02). */
export type IdentityRuntimeRegistration = {
  providerId: IdentityRuntimeProviderId;
  name: string;
  version: string;
  status: IdentityRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: IdentityRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// S2-02 — operações estruturais (openJob / closeJob / submitRequest /
// registerFinding / getResult / stats). Nunca executam identidade real.
// ---------------------------------------------------------------------------

export type OpenIdentityJobInput = IdentityRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: IdentityMetadata;
  identityContext?: IdentityContext;
};

export type OpenIdentityJobResult = IdentityRuntimeOperationEnvelope & {
  result?: IdentityResult;
  job?: IdentityJob;
};

export type CloseIdentityJobInput = IdentityRuntimeOperationalControls & {
  jobId: string;
};

export type CloseIdentityJobResult = IdentityRuntimeOperationEnvelope & {
  result?: IdentityResult;
  job?: IdentityJob;
};

export type SubmitIdentityRequestInput = IdentityRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  findingId?: string;
  metadata?: IdentityMetadata;
  identityContext?: IdentityContext;
};

export type SubmitIdentityRequestResult = IdentityRuntimeOperationEnvelope & {
  result?: IdentityResult;
  job?: IdentityJob;
  request?: IdentityRequest;
};

export type RegisterIdentityFindingInput = IdentityRuntimeOperationalControls & {
  findingId?: string;
  jobId?: string;
  requestId?: string;
  identityType?: import("./canonical").IdentityTypeKind;
  metadata?: IdentityMetadata;
  identityContext?: IdentityContext;
};

export type RegisterIdentityFindingResult = IdentityRuntimeOperationEnvelope & {
  result?: IdentityResult;
  finding?: IdentityFinding;
};

export type GetIdentityResultInput = IdentityRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  findingId?: string;
};

export type GetIdentityResultResult = IdentityRuntimeOperationEnvelope & {
  result?: IdentityResult;
  job?: IdentityJob;
  request?: IdentityRequest;
  finding?: IdentityFinding;
};

export type IdentityStatsInput = IdentityRuntimeOperationalControls & {
  jobId?: string;
};

export type IdentityStatsResult = IdentityRuntimeOperationEnvelope & {
  statistics?: IdentityStatistics;
  result?: IdentityResult;
};
