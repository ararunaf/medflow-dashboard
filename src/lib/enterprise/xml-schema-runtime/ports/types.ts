/**
 * Tipos vendor-agnósticos do Enterprise XML Schema Runtime — TISS-07.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → Adapter → XML Schema Store → Canonical XML Schema
 *
 * Sem XSD oficial. Sem validação XSD. Sem XML TISS/ANS. Sem operadoras.
 */
import type {
  CanonicalXMLSchema,
  CanonicalXMLSchemaCapabilities,
  CanonicalXMLSchemaHealth,
  CanonicalXMLSchemaRequest,
  CanonicalXMLSchemaResult,
  CanonicalXMLSchemaStatistics,
} from "./canonical";
import type { XMLSchemaRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalXMLSchema,
  CanonicalXMLSchemaCapabilities,
  CanonicalXMLSchemaHealth,
  CanonicalXMLSchemaMetadata,
  CanonicalXMLSchemaOperation,
  CanonicalXMLSchemaProfile,
  CanonicalXMLSchemaReference,
  CanonicalXMLSchemaRequest,
  CanonicalXMLSchemaResult,
  CanonicalXMLSchemaStatistics,
  CanonicalXMLSchemaStatus,
  CanonicalXMLSchemaVersion,
} from "./canonical";
export type { XMLSchemaRuntimeCapabilities };

/** Provedores / mecanismos do XML Schema Runtime. */
export type XMLSchemaRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type XMLSchemaRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type XMLSchemaRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type XMLSchemaRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: XMLSchemaRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type XMLSchemaRuntimeHealth = CanonicalXMLSchemaHealth & {
  provider: XMLSchemaRuntimeProviderId;
  status?: XMLSchemaRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type XMLSchemaRuntimePortCapabilities = {
  provider: XMLSchemaRuntimeProviderId;
  adapterId: string;
  engine: XMLSchemaRuntimeCapabilities;
  canonical: CanonicalXMLSchemaCapabilities;
  supportsCanonicalSchema: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  implementsOfficialXsd: false;
  implementsXsdValidation: false;
  implementsRealTissXml: false;
  implementsRealAnsXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type XMLSchemaRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type XMLSchemaRuntimeInfo = {
  providerId: XMLSchemaRuntimeProviderId;
  metadata: XMLSchemaRuntimeProviderMetadata;
  status: XMLSchemaRuntimeStatus;
  providerType: "XML_SCHEMA_RUNTIME";
  capabilities: XMLSchemaRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type XMLSchemaRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type XMLSchemaRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: XMLSchemaRuntimeProviderId;
  telemetry: XMLSchemaRuntimeTelemetry;
  logs?: readonly XMLSchemaRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterCanonicalXMLSchemaInput = XMLSchemaRuntimeOperationalControls & {
  request?: CanonicalXMLSchemaRequest;
  schemaId?: string;
  name?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  schema?: CanonicalXMLSchema;
};

export type RegisterCanonicalXMLSchemaResult = XMLSchemaRuntimeOperationEnvelope & {
  result?: CanonicalXMLSchemaResult;
  schema?: CanonicalXMLSchema;
};

export type GetCanonicalXMLSchemaResultInput = XMLSchemaRuntimeOperationalControls & {
  resultId: string;
};

export type GetCanonicalXMLSchemaResultResult = XMLSchemaRuntimeOperationEnvelope & {
  result?: CanonicalXMLSchemaResult;
};

export type ListCanonicalXMLSchemaResultsInput = XMLSchemaRuntimeOperationalControls & {
  status?: string;
};

export type ListCanonicalXMLSchemaResultsResult = XMLSchemaRuntimeOperationEnvelope & {
  results: readonly CanonicalXMLSchemaResult[];
  statistics?: CanonicalXMLSchemaStatistics;
};

/** Opções de resolução do XMLSchemaRuntimePort. */
export type XMLSchemaRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-07).
   */
  provider?: XMLSchemaRuntimeProviderId;
};

/** Entrada de registro no XMLSchemaRuntimeRegistry. */
export type XMLSchemaRuntimeRegistration = {
  providerId: XMLSchemaRuntimeProviderId;
  name: string;
  version: string;
  status: XMLSchemaRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: XMLSchemaRuntimeCapabilities;
  description?: string;
};
