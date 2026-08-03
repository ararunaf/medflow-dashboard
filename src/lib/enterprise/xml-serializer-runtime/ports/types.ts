/**
 * Tipos vendor-agnósticos do Enterprise XML Serializer Runtime — TISS-06.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort
 *     → Adapter → XML Serializer Store → Canonical XML String
 *
 * Sem XML TISS/ANS real. Sem operadoras. Sem contratos. Sem tenants. Sem XSD.
 */
import type {
  CanonicalXMLSerializeRequest,
  CanonicalXMLSerializeResult,
  CanonicalXMLSerializerProviderCapabilities,
  CanonicalXMLSerializerProviderHealth,
  CanonicalXMLSerializerStatistics,
  CanonicalXMLStructure,
} from "./canonical";
import type { XMLSerializerRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalXMLNode,
  CanonicalXMLSerializeRequest,
  CanonicalXMLSerializeResult,
  CanonicalXMLSerializationStatus,
  CanonicalXMLSerializerMetadata,
  CanonicalXMLSerializerProviderCapabilities,
  CanonicalXMLSerializerProviderHealth,
  CanonicalXMLSerializerStatistics,
  CanonicalXMLStructure,
} from "./canonical";
export type { XMLSerializerRuntimeCapabilities };

/** Provedores / mecanismos do XML Serializer Runtime. */
export type XMLSerializerRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type XMLSerializerRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type XMLSerializerRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type XMLSerializerRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: XMLSerializerRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type XMLSerializerRuntimeHealth = CanonicalXMLSerializerProviderHealth & {
  provider: XMLSerializerRuntimeProviderId;
  status?: XMLSerializerRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type XMLSerializerRuntimePortCapabilities = {
  provider: XMLSerializerRuntimeProviderId;
  adapterId: string;
  engine: XMLSerializerRuntimeCapabilities;
  canonical: CanonicalXMLSerializerProviderCapabilities;
  supportsCanonicalXmlString: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  implementsRealTissXml: false;
  implementsRealAnsXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsXsdValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type XMLSerializerRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type XMLSerializerRuntimeInfo = {
  providerId: XMLSerializerRuntimeProviderId;
  metadata: XMLSerializerRuntimeProviderMetadata;
  status: XMLSerializerRuntimeStatus;
  providerType: "XML_SERIALIZER_RUNTIME";
  capabilities: XMLSerializerRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type XMLSerializerRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type XMLSerializerRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: XMLSerializerRuntimeProviderId;
  telemetry: XMLSerializerRuntimeTelemetry;
  logs?: readonly XMLSerializerRuntimeStructuredLog[];
  simulated?: boolean;
};

export type SerializeCanonicalXMLInput = XMLSerializerRuntimeOperationalControls & {
  request?: CanonicalXMLSerializeRequest;
  serializationId?: string;
  generationId?: string;
  generationResultId?: string;
  documentId?: string;
  structure?: CanonicalXMLStructure;
};

export type SerializeCanonicalXMLResult = XMLSerializerRuntimeOperationEnvelope & {
  result?: CanonicalXMLSerializeResult;
  canonicalXml?: string;
};

export type GetCanonicalXMLSerializeResultInput = XMLSerializerRuntimeOperationalControls & {
  resultId: string;
};

export type GetCanonicalXMLSerializeResultResult = XMLSerializerRuntimeOperationEnvelope & {
  result?: CanonicalXMLSerializeResult;
};

export type ListCanonicalXMLSerializeResultsInput = XMLSerializerRuntimeOperationalControls & {
  status?: string;
};

export type ListCanonicalXMLSerializeResultsResult = XMLSerializerRuntimeOperationEnvelope & {
  results: readonly CanonicalXMLSerializeResult[];
  statistics?: CanonicalXMLSerializerStatistics;
};

/** Opções de resolução do XMLSerializerRuntimePort. */
export type XMLSerializerRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-06).
   */
  provider?: XMLSerializerRuntimeProviderId;
};

/** Entrada de registro no XMLSerializerRuntimeRegistry. */
export type XMLSerializerRuntimeRegistration = {
  providerId: XMLSerializerRuntimeProviderId;
  name: string;
  version: string;
  status: XMLSerializerRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: XMLSerializerRuntimeCapabilities;
  description?: string;
};
