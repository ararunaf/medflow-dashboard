/**
 * Tipos vendor-agnósticos do Enterprise XSD Runtime — TISS-09.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort → XSDRuntimePort
 *     → Adapter → XSD Runtime Store → Canonical XSD Runtime Result
 *
 * Sem XSD oficial. Sem validação XSD real. Sem XML TISS/ANS. Sem operadoras.
 */
import type {
  CanonicalXSDCapabilities,
  CanonicalXSDHealth,
  CanonicalXSDRuntimeRequest,
  CanonicalXSDRuntimeResult,
  CanonicalXSDStatistics,
} from "./canonical";
import type { XSDRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalXSDCapabilities,
  CanonicalXSDHealth,
  CanonicalXSDMetadata,
  CanonicalXSDOperation,
  CanonicalXSDProfile,
  CanonicalXSDReference,
  CanonicalXSDRuntimeRequest,
  CanonicalXSDRuntimeResult,
  CanonicalXSDSchema,
  CanonicalXSDStatistics,
  CanonicalXSDStatus,
  CanonicalXSDVersion,
} from "./canonical";
export type { XSDRuntimeCapabilities };

/** Provedores / mecanismos do XSD Runtime. */
export type XSDRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type XSDRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type XSDRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type XSDRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: XSDRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type XSDRuntimeHealth = CanonicalXSDHealth & {
  provider: XSDRuntimeProviderId;
  status?: XSDRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type XSDRuntimePortCapabilities = {
  provider: XSDRuntimeProviderId;
  adapterId: string;
  engine: XSDRuntimeCapabilities;
  canonical: CanonicalXSDCapabilities;
  supportsCanonicalXsd: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  runtimeReady: true;
  officialXsdLoaded: false;
  realXsdLoaded: false;
  realValidationAvailable: false;
  officialNamespacesLoaded: false;
  officialSchemasLoaded: false;
  schemaParsingEnabled: false;
  schemaValidationEnabled: false;
  implementsOfficialXsd: false;
  implementsXsdValidation: false;
  implementsRealXmlValidation: false;
  implementsOperatorDispatch: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type XSDRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type XSDRuntimeInfo = {
  providerId: XSDRuntimeProviderId;
  metadata: XSDRuntimeProviderMetadata;
  status: XSDRuntimeStatus;
  providerType: "XSD_RUNTIME";
  capabilities: XSDRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type XSDRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type XSDRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: XSDRuntimeProviderId;
  telemetry: XSDRuntimeTelemetry;
  logs?: readonly XSDRuntimeStructuredLog[];
  simulated?: boolean;
};

export type PrepareCanonicalXSDInput = XSDRuntimeOperationalControls & {
  request?: CanonicalXSDRuntimeRequest;
  xsdId?: string;
  name?: string;
  validationResultId?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
};

export type PrepareCanonicalXSDResult = XSDRuntimeOperationEnvelope & {
  result?: CanonicalXSDRuntimeResult;
};

export type GetCanonicalXSDResultInput = XSDRuntimeOperationalControls & {
  resultId: string;
};

export type GetCanonicalXSDResultResult = XSDRuntimeOperationEnvelope & {
  result?: CanonicalXSDRuntimeResult;
};

export type ListCanonicalXSDResultsInput = XSDRuntimeOperationalControls & {
  status?: string;
};

export type ListCanonicalXSDResultsResult = XSDRuntimeOperationEnvelope & {
  results: readonly CanonicalXSDRuntimeResult[];
  statistics?: CanonicalXSDStatistics;
};

/** Opções de resolução do XSDRuntimePort. */
export type XSDRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-09).
   */
  provider?: XSDRuntimeProviderId;
};

/** Entrada de registro no XSDRuntimeRegistry. */
export type XSDRuntimeRegistration = {
  providerId: XSDRuntimeProviderId;
  name: string;
  version: string;
  status: XSDRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: XSDRuntimeCapabilities;
  description?: string;
};
