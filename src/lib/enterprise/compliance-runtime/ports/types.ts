/**
 * Tipos vendor-agnósticos do Enterprise Compliance Runtime — S3-02.
 *
 * S3-02: infraestrutura canônica estrutural apenas — sem identidade real /
 * sem criptografia / sem assinatura digital / sem cadeia de custódia /
 * sem Key Vault / sem HSM / sem SIEM / sem OpenTelemetry / sem LGPD /
 * sem autenticação / sem autorização.
 */
import type {
  ComplianceContext,
  ComplianceFinding,
  ComplianceJob,
  ComplianceMetadata,
  ComplianceRequest,
  ComplianceResult,
  ComplianceStatistics,
} from "./canonical";
import type { ComplianceRuntimeEngineCapabilities } from "./capabilities";

export type {
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
  ComplianceScore,
  ComplianceStatistics,
  ComplianceStatus,
  ComplianceSummary,
  ComplianceTypeContract,
  ComplianceTypeKind,
  BusinessCompliance,
  CanonicalComplianceOperation,
  ClinicalCompliance,
  ComplianceCompliance,
  FinancialCompliance,
  FutureComplianceTypeContract,
  OperatorCompliance,
  QualityCompliance,
  TechnicalCompliance,
  TISSCompliance,
} from "./canonical";
export type { ComplianceRuntimeEngineCapabilities };

/** Provedores / mecanismos do Compliance Runtime (adapters do Port). */
export type ComplianceRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";

/** Status operacional declarado no registry (S3-02). */
export type ComplianceRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (S3-02). */
export type ComplianceRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (S3-02). */
export type ComplianceRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: ComplianceRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Compliance Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type ComplianceRuntimeHealth = {
  ok: boolean;
  provider: ComplianceRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: ComplianceRuntimeStatus;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  complianceJustificationImplemented: false;
  complianceScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter ativo.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ComplianceRuntimeCapabilities = {
  provider: ComplianceRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalCompliance: boolean;
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
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  complianceJustificationImplemented: false;
  complianceScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Espelho declarativo (engine) e canônico (S3-02) — informativo. */
  engine?: ComplianceRuntimeEngineCapabilities;
  canonical?: import("./canonical").ComplianceCapabilities;
};

/** Metadados estáveis do provedor (S3-02). */
export type ComplianceRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (S3-02). */
export type ComplianceRuntimeInfo = {
  providerId: ComplianceRuntimeProviderId;
  metadata: ComplianceRuntimeProviderMetadata;
  status: ComplianceRuntimeStatus;
  providerType: "COMPLIANCE_RUNTIME";
  capabilities: ComplianceRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — S3-02. */
export type ComplianceRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — S3-02. */
export type ComplianceRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: ComplianceRuntimeProviderId;
  telemetry: ComplianceRuntimeTelemetry;
  logs?: readonly ComplianceRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * S3-02: sem peers estruturais (scaffolding puro).
 */
export type ComplianceRuntimeEnterpriseDeps = Record<string, unknown>;

/** Opções de resolução do ComplianceRuntimePort. */
export type ComplianceRuntimeProviderOptions = {
  provider?: ComplianceRuntimeProviderId;
  enterpriseDeps?: ComplianceRuntimeEnterpriseDeps;
};

/** Alias S3-02 — resolução do ComplianceRuntimePort (default: `enterprise`). */
export type ComplianceRuntimeOptions = ComplianceRuntimeProviderOptions;

/** Entrada de registro no ComplianceRuntimeRegistry (S3-02). */
export type ComplianceRuntimeRegistration = {
  providerId: ComplianceRuntimeProviderId;
  name: string;
  version: string;
  status: ComplianceRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: ComplianceRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// S3-02 — operações estruturais (openJob / closeJob / submitRequest /
// registerFinding / getResult / stats). Nunca executam identidade real.
// ---------------------------------------------------------------------------

export type OpenComplianceJobInput = ComplianceRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: ComplianceMetadata;
  complianceContext?: ComplianceContext;
};

export type OpenComplianceJobResult = ComplianceRuntimeOperationEnvelope & {
  result?: ComplianceResult;
  job?: ComplianceJob;
};

export type CloseComplianceJobInput = ComplianceRuntimeOperationalControls & {
  jobId: string;
};

export type CloseComplianceJobResult = ComplianceRuntimeOperationEnvelope & {
  result?: ComplianceResult;
  job?: ComplianceJob;
};

export type SubmitComplianceRequestInput = ComplianceRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  findingId?: string;
  metadata?: ComplianceMetadata;
  complianceContext?: ComplianceContext;
};

export type SubmitComplianceRequestResult = ComplianceRuntimeOperationEnvelope & {
  result?: ComplianceResult;
  job?: ComplianceJob;
  request?: ComplianceRequest;
};

export type RegisterComplianceFindingInput = ComplianceRuntimeOperationalControls & {
  findingId?: string;
  jobId?: string;
  requestId?: string;
  complianceType?: import("./canonical").ComplianceTypeKind;
  metadata?: ComplianceMetadata;
  complianceContext?: ComplianceContext;
};

export type RegisterComplianceFindingResult = ComplianceRuntimeOperationEnvelope & {
  result?: ComplianceResult;
  finding?: ComplianceFinding;
};

export type GetComplianceResultInput = ComplianceRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  findingId?: string;
};

export type GetComplianceResultResult = ComplianceRuntimeOperationEnvelope & {
  result?: ComplianceResult;
  job?: ComplianceJob;
  request?: ComplianceRequest;
  finding?: ComplianceFinding;
};

export type ComplianceStatsInput = ComplianceRuntimeOperationalControls & {
  jobId?: string;
};

export type ComplianceStatsResult = ComplianceRuntimeOperationEnvelope & {
  statistics?: ComplianceStatistics;
  result?: ComplianceResult;
};
