/**
 * Tipos vendor-agnósticos do Enterprise XML Generation Runtime — TISS-05.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → Adapter → XML Generation Store → Canonical XML Result
 *
 * Sem geração XML real. Sem operadoras. Sem contratos. Sem tenants.
 */
import type {
  CanonicalXMLGenerationProviderCapabilities,
  CanonicalXMLGenerationProviderHealth,
  CanonicalXMLGenerationStatistics,
  CanonicalXMLRequest,
  CanonicalXMLResult,
  CanonicalXMLStructure,
} from "./canonical";
import type { XMLGenerationRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalXMLGenerationProviderCapabilities,
  CanonicalXMLGenerationProviderHealth,
  CanonicalXMLGenerationStatistics,
  CanonicalXMLGenerationStatus,
  CanonicalXMLMetadata,
  CanonicalXMLNode,
  CanonicalXMLRequest,
  CanonicalXMLResult,
  CanonicalXMLStructure,
} from "./canonical";
export type { XMLGenerationRuntimeCapabilities };

/** Provedores / mecanismos do XML Generation Runtime. */
export type XMLGenerationRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type XMLGenerationRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type XMLGenerationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type XMLGenerationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: XMLGenerationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type XMLGenerationRuntimeHealth = CanonicalXMLGenerationProviderHealth & {
  provider: XMLGenerationRuntimeProviderId;
  status?: XMLGenerationRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type XMLGenerationRuntimePortCapabilities = {
  provider: XMLGenerationRuntimeProviderId;
  adapterId: string;
  engine: XMLGenerationRuntimeCapabilities;
  canonical: CanonicalXMLGenerationProviderCapabilities;
  supportsCanonicalStructure: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  implementsRealXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};

/** Metadados estáveis do provedor. */
export type XMLGenerationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type XMLGenerationRuntimeInfo = {
  providerId: XMLGenerationRuntimeProviderId;
  metadata: XMLGenerationRuntimeProviderMetadata;
  status: XMLGenerationRuntimeStatus;
  providerType: "XML_GENERATION_RUNTIME";
  capabilities: XMLGenerationRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type XMLGenerationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type XMLGenerationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: XMLGenerationRuntimeProviderId;
  telemetry: XMLGenerationRuntimeTelemetry;
  logs?: readonly XMLGenerationRuntimeStructuredLog[];
  simulated?: boolean;
};

export type GenerateCanonicalXMLInput = XMLGenerationRuntimeOperationalControls & {
  request?: CanonicalXMLRequest;
  generationId?: string;
  documentId?: string;
  catalogId?: string;
  catalogConsumed?: boolean;
  rulePackExecutionId?: string;
  rulePackCode?: string;
  rulePackConsumed?: boolean;
};

export type GenerateCanonicalXMLResult = XMLGenerationRuntimeOperationEnvelope & {
  result?: CanonicalXMLResult;
  structure?: CanonicalXMLStructure;
};

export type GetCanonicalXMLResultInput = XMLGenerationRuntimeOperationalControls & {
  resultId: string;
};

export type GetCanonicalXMLResultResult = XMLGenerationRuntimeOperationEnvelope & {
  result?: CanonicalXMLResult;
};

export type ListCanonicalXMLResultsInput = XMLGenerationRuntimeOperationalControls & {
  status?: string;
};

export type ListCanonicalXMLResultsResult = XMLGenerationRuntimeOperationEnvelope & {
  results: readonly CanonicalXMLResult[];
  statistics?: CanonicalXMLGenerationStatistics;
};

/** Opções de resolução do XMLGenerationRuntimePort. */
export type XMLGenerationRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-05).
   */
  provider?: XMLGenerationRuntimeProviderId;
};

/** Entrada de registro no XMLGenerationRuntimeRegistry. */
export type XMLGenerationRuntimeRegistration = {
  providerId: XMLGenerationRuntimeProviderId;
  name: string;
  version: string;
  status: XMLGenerationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: XMLGenerationRuntimeCapabilities;
  description?: string;
};
