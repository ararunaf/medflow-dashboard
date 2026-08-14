/**
 * Tipos vendor-agnósticos do Enterprise Tenant Runtime — S3-02.
 *
 * S3-02: infraestrutura canônica estrutural apenas — sem identidade real /
 * sem criptografia / sem assinatura digital / sem cadeia de custódia /
 * sem Key Vault / sem HSM / sem SIEM / sem OpenTelemetry / sem LGPD /
 * sem autenticação / sem autorização.
 */
import type {
  TenantContext,
  TenantFinding,
  TenantJob,
  TenantMetadata,
  TenantRequest,
  TenantResult,
  TenantStatistics,
} from "./canonical";
import type { TenantRuntimeEngineCapabilities } from "./capabilities";

export type {
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
  TenantScore,
  TenantStatistics,
  TenantStatus,
  TenantSummary,
  TenantTypeContract,
  TenantTypeKind,
  BusinessTenant,
  CanonicalTenantOperation,
  ClinicalTenant,
  ComplianceTenant,
  FinancialTenant,
  FutureTenantTypeContract,
  OperatorTenant,
  QualityTenant,
  TechnicalTenant,
  TISSTenant,
} from "./canonical";
export type { TenantRuntimeEngineCapabilities };

/** Provedores / mecanismos do Tenant Runtime (adapters do Port). */
export type TenantRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";

/** Status operacional declarado no registry (S3-02). */
export type TenantRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (S3-02). */
export type TenantRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (S3-02). */
export type TenantRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: TenantRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Tenant Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type TenantRuntimeHealth = {
  ok: boolean;
  provider: TenantRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: TenantRuntimeStatus;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  tenantEngineImplemented: false;
  businessRulesImplemented: false;
  tissTenantImplemented: false;
  operatorTenantImplemented: false;
  automaticTenantImplemented: false;
  tenantSuggestionsImplemented: false;
  tenantJustificationImplemented: false;
  tenantScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter ativo.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type TenantRuntimeCapabilities = {
  provider: TenantRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsCanonicalTenant: boolean;
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
  tenantEngineImplemented: false;
  businessRulesImplemented: false;
  tissTenantImplemented: false;
  operatorTenantImplemented: false;
  automaticTenantImplemented: false;
  tenantSuggestionsImplemented: false;
  tenantJustificationImplemented: false;
  tenantScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Espelho declarativo (engine) e canônico (S3-02) — informativo. */
  engine?: TenantRuntimeEngineCapabilities;
  canonical?: import("./canonical").TenantCapabilities;
};

/** Metadados estáveis do provedor (S3-02). */
export type TenantRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (S3-02). */
export type TenantRuntimeInfo = {
  providerId: TenantRuntimeProviderId;
  metadata: TenantRuntimeProviderMetadata;
  status: TenantRuntimeStatus;
  providerType: "TENANT_RUNTIME";
  capabilities: TenantRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — S3-02. */
export type TenantRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — S3-02. */
export type TenantRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: TenantRuntimeProviderId;
  telemetry: TenantRuntimeTelemetry;
  logs?: readonly TenantRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * S3-02: sem peers estruturais (scaffolding puro).
 */
export type TenantRuntimeEnterpriseDeps = Record<string, unknown>;

/** Opções de resolução do TenantRuntimePort. */
export type TenantRuntimeProviderOptions = {
  provider?: TenantRuntimeProviderId;
  enterpriseDeps?: TenantRuntimeEnterpriseDeps;
};

/** Alias S3-02 — resolução do TenantRuntimePort (default: `enterprise`). */
export type TenantRuntimeOptions = TenantRuntimeProviderOptions;

/** Entrada de registro no TenantRuntimeRegistry (S3-02). */
export type TenantRuntimeRegistration = {
  providerId: TenantRuntimeProviderId;
  name: string;
  version: string;
  status: TenantRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: TenantRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// S3-02 — operações estruturais (openJob / closeJob / submitRequest /
// registerFinding / getResult / stats). Nunca executam identidade real.
// ---------------------------------------------------------------------------

export type OpenTenantJobInput = TenantRuntimeOperationalControls & {
  jobId?: string;
  correlationId?: string | null;
  metadata?: TenantMetadata;
  tenantContext?: TenantContext;
};

export type OpenTenantJobResult = TenantRuntimeOperationEnvelope & {
  result?: TenantResult;
  job?: TenantJob;
};

export type CloseTenantJobInput = TenantRuntimeOperationalControls & {
  jobId: string;
};

export type CloseTenantJobResult = TenantRuntimeOperationEnvelope & {
  result?: TenantResult;
  job?: TenantJob;
};

export type SubmitTenantRequestInput = TenantRuntimeOperationalControls & {
  jobId?: string;
  requestId?: string;
  findingId?: string;
  metadata?: TenantMetadata;
  tenantContext?: TenantContext;
};

export type SubmitTenantRequestResult = TenantRuntimeOperationEnvelope & {
  result?: TenantResult;
  job?: TenantJob;
  request?: TenantRequest;
};

export type RegisterTenantFindingInput = TenantRuntimeOperationalControls & {
  findingId?: string;
  jobId?: string;
  requestId?: string;
  tenantType?: import("./canonical").TenantTypeKind;
  metadata?: TenantMetadata;
  tenantContext?: TenantContext;
};

export type RegisterTenantFindingResult = TenantRuntimeOperationEnvelope & {
  result?: TenantResult;
  finding?: TenantFinding;
};

export type GetTenantResultInput = TenantRuntimeOperationalControls & {
  requestId?: string;
  jobId?: string;
  findingId?: string;
};

export type GetTenantResultResult = TenantRuntimeOperationEnvelope & {
  result?: TenantResult;
  job?: TenantJob;
  request?: TenantRequest;
  finding?: TenantFinding;
};

export type TenantStatsInput = TenantRuntimeOperationalControls & {
  jobId?: string;
};

export type TenantStatsResult = TenantRuntimeOperationEnvelope & {
  statistics?: TenantStatistics;
  result?: TenantResult;
};
