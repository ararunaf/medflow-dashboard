/**
 * Tipos vendor-agnósticos do Enterprise Authorization Runtime — S3-02.
 *
 * S3-02: infraestrutura canônica estrutural apenas — sem identidade real /
 * sem criptografia / sem assinatura digital / sem cadeia de custódia /
 * sem Key Vault / sem HSM / sem SIEM / sem OpenTelemetry / sem LGPD /
 * sem autenticação / sem autorização.
 */
import type {
  AuthorizationContext,
  AuthorizationFinding,
  AuthorizationJob,
  AuthorizationMetadata,
  AuthorizationRequest,
  AuthorizationResult,
  AuthorizationStatistics,
} from "./canonical";
import type { AuthorizationRuntimeEngineCapabilities } from "./capabilities";

export type {
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
  AuthorizationScore,
  AuthorizationStatistics,
  AuthorizationStatus,
  AuthorizationSummary,
  AuthorizationTypeContract,
  AuthorizationTypeKind,
  BusinessAuthorization,
  CanonicalAuthorizationOperation,
  ClinicalAuthorization,
  ComplianceAuthorization,
  FinancialAuthorization,
  FutureAuthorizationTypeContract,
  OperatorAuthorization,
  QualityAuthorization,
  TechnicalAuthorization,
  TISSAuthorization,
} from "./canonical";
export type { AuthorizationRuntimeEngineCapabilities };

/** Provedores / mecanismos do Authorization Runtime (adapters do Port). */
export type AuthorizationRuntimeProviderId =
  | "mock"
  | "test"
  | "default"
  | "enterprise"
  | "real-tiss";

/** Status operacional declarado no registry (S3-02). */
export type AuthorizationRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (S3-02). */
export type AuthorizationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (S3-02). */
export type AuthorizationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: AuthorizationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Authorization Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type AuthorizationRuntimeHealth = {
  ok: boolean;
  provider: AuthorizationRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: AuthorizationRuntimeStatus;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  authorizationEngineImplemented: false;
  businessRulesImplemented: false;
  tissAuthorizationImplemented: false;
  operatorAuthorizationImplemented: false;
  automaticAuthorizationImplemented: false;
  authorizationSuggestionsImplemented: false;
  authorizationJustificationImplemented: false;
  authorizationScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter ativo.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AuthorizationRuntimeCapabilities = {
  provider: AuthorizationRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalAuthorization: boolean;
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
  authorizationEngineImplemented: false;
  businessRulesImplemented: false;
  tissAuthorizationImplemented: false;
  operatorAuthorizationImplemented: false;
  automaticAuthorizationImplemented: false;
  authorizationSuggestionsImplemented: false;
  authorizationJustificationImplemented: false;
  authorizationScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Espelho declarativo (engine) e canônico (S3-02) — informativo. */
  engine?: AuthorizationRuntimeEngineCapabilities;
  canonical?: import("./canonical").AuthorizationCapabilities;
};

/** Metadados estáveis do provedor (S3-02). */
export type AuthorizationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (S3-02). */
export type AuthorizationRuntimeInfo = {
  providerId: AuthorizationRuntimeProviderId;
  metadata: AuthorizationRuntimeProviderMetadata;
  status: AuthorizationRuntimeStatus;
  providerType: "AUTHORIZATION_RUNTIME";
  capabilities: AuthorizationRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — S3-02. */
export type AuthorizationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — S3-02. */
export type AuthorizationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: AuthorizationRuntimeProviderId;
  telemetry: AuthorizationRuntimeTelemetry;
  logs?: readonly AuthorizationRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * S3-02: sem peers estruturais (scaffolding puro).
 */
export type AuthorizationRuntimeEnterpriseDeps = Record<string, unknown>;

/** Opções de resolução do AuthorizationRuntimePort. */
export type AuthorizationRuntimeProviderOptions = {
  provider?: AuthorizationRuntimeProviderId;
  enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;
};

/** Alias S3-02 — resolução do AuthorizationRuntimePort (default: `enterprise`). */
export type AuthorizationRuntimeOptions = AuthorizationRuntimeProviderOptions;

/** Entrada de registro no AuthorizationRuntimeRegistry (S3-02). */
export type AuthorizationRuntimeRegistration = {
  providerId: AuthorizationRuntimeProviderId;
  name: string;
  version: string;
  status: AuthorizationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: AuthorizationRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// S3-02 — operações estruturais (openJob / closeJob / submitRequest /
// registerFinding / getResult / stats). Nunca executam identidade real.
// ---------------------------------------------------------------------------

export type OpenAuthorizationJobInput = AuthorizationRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: AuthorizationMetadata;
  authorizationContext?: AuthorizationContext;
};

export type OpenAuthorizationJobResult = AuthorizationRuntimeOperationEnvelope & {
  result?: AuthorizationResult;
  job?: AuthorizationJob;
};

export type CloseAuthorizationJobInput = AuthorizationRuntimeOperationalControls & {
  jobId: string;
};

export type CloseAuthorizationJobResult = AuthorizationRuntimeOperationEnvelope & {
  result?: AuthorizationResult;
  job?: AuthorizationJob;
};

export type SubmitAuthorizationRequestInput = AuthorizationRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  findingId?: string;
  metadata?: AuthorizationMetadata;
  authorizationContext?: AuthorizationContext;
};

export type SubmitAuthorizationRequestResult = AuthorizationRuntimeOperationEnvelope & {
  result?: AuthorizationResult;
  job?: AuthorizationJob;
  request?: AuthorizationRequest;
};

export type RegisterAuthorizationFindingInput = AuthorizationRuntimeOperationalControls & {
  findingId?: string;
  jobId?: string;
  requestId?: string;
  authorizationType?: import("./canonical").AuthorizationTypeKind;
  metadata?: AuthorizationMetadata;
  authorizationContext?: AuthorizationContext;
};

export type RegisterAuthorizationFindingResult = AuthorizationRuntimeOperationEnvelope & {
  result?: AuthorizationResult;
  finding?: AuthorizationFinding;
};

export type GetAuthorizationResultInput = AuthorizationRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  findingId?: string;
};

export type GetAuthorizationResultResult = AuthorizationRuntimeOperationEnvelope & {
  result?: AuthorizationResult;
  job?: AuthorizationJob;
  request?: AuthorizationRequest;
  finding?: AuthorizationFinding;
};

export type AuthorizationStatsInput = AuthorizationRuntimeOperationalControls & {
  jobId?: string;
};

export type AuthorizationStatsResult = AuthorizationRuntimeOperationEnvelope & {
  statistics?: AuthorizationStatistics;
  result?: AuthorizationResult;
};
