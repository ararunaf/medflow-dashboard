/**
 * Tipos vendor-agnósticos do Enterprise Security Runtime — S1-02.
 *
 * S1-02: infraestrutura canônica estrutural apenas — sem segurança real /
 * sem criptografia / sem assinatura digital / sem cadeia de custódia /
 * sem Key Vault / sem HSM / sem SIEM / sem OpenTelemetry / sem LGPD /
 * sem autenticação / sem autorização.
 */
import type {
  SecurityContext,
  SecurityFinding,
  SecurityJob,
  SecurityMetadata,
  SecurityRequest,
  SecurityResult,
  SecurityStatistics,
} from "./canonical";
import type { SecurityRuntimeEngineCapabilities } from "./capabilities";

export type {
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
  SecurityScore,
  SecurityStatistics,
  SecurityStatus,
  SecuritySummary,
  SecurityTypeContract,
  SecurityTypeKind,
  BusinessSecurity,
  CanonicalSecurityOperation,
  ClinicalSecurity,
  ComplianceSecurity,
  FinancialSecurity,
  FutureSecurityTypeContract,
  OperatorSecurity,
  QualitySecurity,
  TechnicalSecurity,
  TISSSecurity,
} from "./canonical";
export type { SecurityRuntimeEngineCapabilities };

/** Provedores / mecanismos do Security Runtime (adapters do Port). */
export type SecurityRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";

/** Status operacional declarado no registry (S1-02). */
export type SecurityRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (S1-02). */
export type SecurityRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (S1-02). */
export type SecurityRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: SecurityRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Security Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type SecurityRuntimeHealth = {
  ok: boolean;
  provider: SecurityRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: SecurityRuntimeStatus;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  securityEngineImplemented: false;
  businessRulesImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  securityJustificationImplemented: false;
  securityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter ativo.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type SecurityRuntimeCapabilities = {
  provider: SecurityRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalSecurity: boolean;
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
  securityEngineImplemented: false;
  businessRulesImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  securityJustificationImplemented: false;
  securityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Espelho declarativo (engine) e canônico (S1-02) — informativo. */
  engine?: SecurityRuntimeEngineCapabilities;
  canonical?: import("./canonical").SecurityCapabilities;
};

/** Metadados estáveis do provedor (S1-02). */
export type SecurityRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (S1-02). */
export type SecurityRuntimeInfo = {
  providerId: SecurityRuntimeProviderId;
  metadata: SecurityRuntimeProviderMetadata;
  status: SecurityRuntimeStatus;
  providerType: "SECURITY_RUNTIME";
  capabilities: SecurityRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — S1-02. */
export type SecurityRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — S1-02. */
export type SecurityRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: SecurityRuntimeProviderId;
  telemetry: SecurityRuntimeTelemetry;
  logs?: readonly SecurityRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * S1-02: sem peers estruturais (scaffolding puro).
 */
export type SecurityRuntimeEnterpriseDeps = Record<string, never>;

/** Opções de resolução do SecurityRuntimePort. */
export type SecurityRuntimeProviderOptions = {
  provider?: SecurityRuntimeProviderId;
  enterpriseDeps?: SecurityRuntimeEnterpriseDeps;
};

/** Alias S1-02 — resolução do SecurityRuntimePort (default: `enterprise`). */
export type SecurityRuntimeOptions = SecurityRuntimeProviderOptions;

/** Entrada de registro no SecurityRuntimeRegistry (S1-02). */
export type SecurityRuntimeRegistration = {
  providerId: SecurityRuntimeProviderId;
  name: string;
  version: string;
  status: SecurityRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: SecurityRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// S1-02 — operações estruturais (openJob / closeJob / submitRequest /
// registerFinding / getResult / stats). Nunca executam segurança real.
// ---------------------------------------------------------------------------

export type OpenSecurityJobInput = SecurityRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: SecurityMetadata;
  securityContext?: SecurityContext;
};

export type OpenSecurityJobResult = SecurityRuntimeOperationEnvelope & {
  result?: SecurityResult;
  job?: SecurityJob;
};

export type CloseSecurityJobInput = SecurityRuntimeOperationalControls & {
  jobId: string;
};

export type CloseSecurityJobResult = SecurityRuntimeOperationEnvelope & {
  result?: SecurityResult;
  job?: SecurityJob;
};

export type SubmitSecurityRequestInput = SecurityRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  findingId?: string;
  metadata?: SecurityMetadata;
  securityContext?: SecurityContext;
};

export type SubmitSecurityRequestResult = SecurityRuntimeOperationEnvelope & {
  result?: SecurityResult;
  job?: SecurityJob;
  request?: SecurityRequest;
};

export type RegisterSecurityFindingInput = SecurityRuntimeOperationalControls & {
  findingId?: string;
  jobId?: string;
  requestId?: string;
  securityType?: import("./canonical").SecurityTypeKind;
  metadata?: SecurityMetadata;
  securityContext?: SecurityContext;
};

export type RegisterSecurityFindingResult = SecurityRuntimeOperationEnvelope & {
  result?: SecurityResult;
  finding?: SecurityFinding;
};

export type GetSecurityResultInput = SecurityRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  findingId?: string;
};

export type GetSecurityResultResult = SecurityRuntimeOperationEnvelope & {
  result?: SecurityResult;
  job?: SecurityJob;
  request?: SecurityRequest;
  finding?: SecurityFinding;
};

export type SecurityStatsInput = SecurityRuntimeOperationalControls & {
  jobId?: string;
};

export type SecurityStatsResult = SecurityRuntimeOperationEnvelope & {
  statistics?: SecurityStatistics;
  result?: SecurityResult;
};
