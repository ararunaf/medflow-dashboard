/**
 * Tipos vendor-agnósticos do Enterprise Namespace Runtime — TISS-10.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort → XSDRuntimePort
 *     → NamespaceRuntimePort
 *     → Adapter → Namespace Runtime Store → Canonical Namespace Runtime Result
 *
 * Sem namespace oficial. Sem namespaces ANS/TISS. Sem XML TISS/ANS. Sem operadoras.
 */
import type {
  CanonicalNamespaceCapabilities,
  CanonicalNamespaceHealth,
  CanonicalNamespaceRuntimeRequest,
  CanonicalNamespaceRuntimeResult,
  CanonicalNamespaceStatistics,
} from "./canonical";
import type { NamespaceRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalNamespaceCapabilities,
  CanonicalNamespaceHealth,
  CanonicalNamespaceMetadata,
  CanonicalNamespaceOperation,
  CanonicalNamespaceProfile,
  CanonicalNamespaceReference,
  CanonicalNamespaceRuntimeRequest,
  CanonicalNamespaceRuntimeResult,
  CanonicalNamespaceDefinition,
  CanonicalNamespaceStatistics,
  CanonicalNamespaceStatus,
  CanonicalNamespaceVersion,
} from "./canonical";
export type { NamespaceRuntimeCapabilities };

/** Provedores / mecanismos do Namespace Runtime. */
export type NamespaceRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type NamespaceRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type NamespaceRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type NamespaceRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: NamespaceRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type NamespaceRuntimeHealth = CanonicalNamespaceHealth & {
  provider: NamespaceRuntimeProviderId;
  status?: NamespaceRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type NamespaceRuntimePortCapabilities = {
  provider: NamespaceRuntimeProviderId;
  adapterId: string;
  engine: NamespaceRuntimeCapabilities;
  canonical: CanonicalNamespaceCapabilities;
  supportsCanonicalNamespace: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  runtimeReady: true;
  officialNamespacesLoaded: false;
  realNamespacesLoaded: false;
  namespaceResolutionEnabled: false;
  namespaceValidationEnabled: false;
  officialAnsNamespacesLoaded: false;
  officialTissNamespacesLoaded: false;
  implementsOfficialNamespaces: false;
  implementsNamespaceValidation: false;
  implementsRealNamespaceResolution: false;
  implementsOperatorDispatch: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type NamespaceRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type NamespaceRuntimeInfo = {
  providerId: NamespaceRuntimeProviderId;
  metadata: NamespaceRuntimeProviderMetadata;
  status: NamespaceRuntimeStatus;
  providerType: "NAMESPACE_RUNTIME";
  capabilities: NamespaceRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type NamespaceRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type NamespaceRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: NamespaceRuntimeProviderId;
  telemetry: NamespaceRuntimeTelemetry;
  logs?: readonly NamespaceRuntimeStructuredLog[];
  simulated?: boolean;
};

export type PrepareCanonicalNamespaceInput = NamespaceRuntimeOperationalControls & {
  request?: CanonicalNamespaceRuntimeRequest;
  namespaceId?: string;
  name?: string;
  xsdResultId?: string;
  validationResultId?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
};

export type PrepareCanonicalNamespaceResult = NamespaceRuntimeOperationEnvelope & {
  result?: CanonicalNamespaceRuntimeResult;
};

export type GetCanonicalNamespaceResultInput = NamespaceRuntimeOperationalControls & {
  resultId: string;
};

export type GetCanonicalNamespaceResultResult = NamespaceRuntimeOperationEnvelope & {
  result?: CanonicalNamespaceRuntimeResult;
};

export type ListCanonicalNamespaceResultsInput = NamespaceRuntimeOperationalControls & {
  status?: string;
};

export type ListCanonicalNamespaceResultsResult = NamespaceRuntimeOperationEnvelope & {
  results: readonly CanonicalNamespaceRuntimeResult[];
  statistics?: CanonicalNamespaceStatistics;
};

/** Opções de resolução do NamespaceRuntimePort. */
export type NamespaceRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-10).
   */
  provider?: NamespaceRuntimeProviderId;
};

/** Entrada de registro no NamespaceRuntimeRegistry. */
export type NamespaceRuntimeRegistration = {
  providerId: NamespaceRuntimeProviderId;
  name: string;
  version: string;
  status: NamespaceRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: NamespaceRuntimeCapabilities;
  description?: string;
};
