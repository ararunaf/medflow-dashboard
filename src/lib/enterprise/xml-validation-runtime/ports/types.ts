/**
 * Tipos vendor-agnósticos do Enterprise XML Validation Runtime — TISS-08.
 *
 * Fluxo oficial:
 *   Produto ? Enterprise Runtime ? TISS Runtime
 *     ? TISSCatalogPort ? RulePackEnginePort
 *     ? XMLRuntimePort ? XMLGenerationRuntimePort
 *     ? XMLSerializerRuntimePort ? XMLSchemaRuntimePort
 *     ? XMLValidationRuntimePort
 *     ? Adapter ? XML Validation Store ? Canonical XML Validation Result
 *
 * Sem XSD oficial. Sem validação XSD real. Sem XML TISS/ANS. Sem operadoras.
 */
import type {
  CanonicalXMLValidationCapabilities,
  CanonicalXMLValidationHealth,
  CanonicalXMLValidationRequest,
  CanonicalXMLValidationResult,
  CanonicalXMLValidationStatistics,
} from "./canonical";
import type { XMLValidationRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalXMLValidationCapabilities,
  CanonicalXMLValidationHealth,
  CanonicalXMLValidationIssue,
  CanonicalXMLValidationMetadata,
  CanonicalXMLValidationOperation,
  CanonicalXMLValidationProfile,
  CanonicalXMLValidationReference,
  CanonicalXMLValidationRequest,
  CanonicalXMLValidationResult,
  CanonicalXMLValidationStatistics,
  CanonicalXMLValidationStatus,
  CanonicalXMLValidationSummary,
  CanonicalXMLValidationVersion,
} from "./canonical";
export type { XMLValidationRuntimeCapabilities };

/** Provedores / mecanismos do XML Validation Runtime. */
export type XMLValidationRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type XMLValidationRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type XMLValidationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type XMLValidationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: XMLValidationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type XMLValidationRuntimeHealth = CanonicalXMLValidationHealth & {
  provider: XMLValidationRuntimeProviderId;
  status?: XMLValidationRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type XMLValidationRuntimePortCapabilities = {
  provider: XMLValidationRuntimeProviderId;
  adapterId: string;
  engine: XMLValidationRuntimeCapabilities;
  canonical: CanonicalXMLValidationCapabilities;
  supportsCanonicalValidation: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  validationEngineReady: true;
  implementsOfficialXsd: false;
  implementsXsdValidation: false;
  implementsRealXmlValidation: false;
  implementsOfficialTissValidation: false;
  implementsOfficialAnsValidation: false;
  implementsOperatorDispatch: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type XMLValidationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type XMLValidationRuntimeInfo = {
  providerId: XMLValidationRuntimeProviderId;
  metadata: XMLValidationRuntimeProviderMetadata;
  status: XMLValidationRuntimeStatus;
  providerType: "XML_VALIDATION_RUNTIME";
  capabilities: XMLValidationRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type XMLValidationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type XMLValidationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: XMLValidationRuntimeProviderId;
  telemetry: XMLValidationRuntimeTelemetry;
  logs?: readonly XMLValidationRuntimeStructuredLog[];
  simulated?: boolean;
};

export type ValidateCanonicalXMLInput = XMLValidationRuntimeOperationalControls & {
  request?: CanonicalXMLValidationRequest;
  validationId?: string;
  name?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
};

export type ValidateCanonicalXMLResult = XMLValidationRuntimeOperationEnvelope & {
  result?: CanonicalXMLValidationResult;
};

export type GetCanonicalXMLValidationResultInput = XMLValidationRuntimeOperationalControls & {
  resultId: string;
};

export type GetCanonicalXMLValidationResultResult = XMLValidationRuntimeOperationEnvelope & {
  result?: CanonicalXMLValidationResult;
};

export type ListCanonicalXMLValidationResultsInput = XMLValidationRuntimeOperationalControls & {
  status?: string;
};

export type ListCanonicalXMLValidationResultsResult = XMLValidationRuntimeOperationEnvelope & {
  results: readonly CanonicalXMLValidationResult[];
  statistics?: CanonicalXMLValidationStatistics;
};

/** Opções de resolução do XMLValidationRuntimePort. */
export type XMLValidationRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-08).
   */
  provider?: XMLValidationRuntimeProviderId;
};

/** Entrada de registro no XMLValidationRuntimeRegistry. */
export type XMLValidationRuntimeRegistration = {
  providerId: XMLValidationRuntimeProviderId;
  name: string;
  version: string;
  status: XMLValidationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: XMLValidationRuntimeCapabilities;
  description?: string;
};
