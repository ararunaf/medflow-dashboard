/**
 * Tipos vendor-agnósticos do Enterprise SOAP Runtime — C-03 / ECS-01.
 *
 * Fluxo estrutural (C-03):
 *   Produto → Enterprise Runtime → SOAPRuntimePort
 *     → Adapter → SOAP Runtime Store → SOAPResponse
 *
 * C-03: infraestrutura canônica estrutural apenas — sem comunicação SOAP /
 * sem HTTP / sem WSDL / sem TLS / sem certificado / sem autenticação /
 * sem MTOM / sem operadoras / sem banco / sem persistência / sem APIs.
 *
 * TRANSPORT AGNOSTIC (Regra Permanente nº 5).
 */
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { AutoFillRuntimePort } from "../../auto-fill-runtime/ports/auto-fill-runtime-port";
import type { QualityRuntimePort } from "../../quality-runtime/ports/quality-runtime-port";
import type { TISSMappingRuntimePort } from "../../tiss-mapping-runtime/ports/tiss-mapping-runtime-port";
import type { ValidationRuntimePort } from "../../validation-runtime/ports/validation-runtime-port";
import type { XMLRuntimePort } from "../../xml-runtime/ports/xml-runtime-port";
import type {
  AuditResult,
  CanonicalGuide,
  QualityAssessment,
  SOAPContext,
  SOAPRequest,
  SOAPStatistics,
  ValidationResult,
  XMLDocument,
} from "./canonical";
import type { SOAPRuntimeEngineCapabilities } from "./capabilities";

export type {
  AuditResult,
  CanonicalGuide,
  QualityAssessment,
  SOAPCapabilities,
  SOAPBody,
  SOAPContext,
  SOAPEnvelope,
  SOAPFault,
  SOAPHeader,
  SOAPHealth,
  SOAPRequest,
  SOAPResponse,
  SOAPRuntimeObservabilityEnvelope,
  SOAPStatistics,
  SOAPStatus,
  ValidationResult,
  XMLDocument,
} from "./canonical";
export type { SOAPRuntimeEngineCapabilities };

/** Provedores / mecanismos do SOAP Runtime (adapters do Port). */
export type SOAPRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-03). */
export type SOAPRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-03). */
export type SOAPRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-03). */
export type SOAPRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: SOAPRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do SOAP Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type SOAPRuntimeHealth = {
  ok: boolean;
  provider: SOAPRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: SOAPRuntimeStatus;
  kind?: "canonical-soap-health";
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  storedResponseCount?: number;
  storedRequestCount?: number;
  storedContextCount?: number;
  runtimeReady: true;
  soapCommunicationImplemented: false;
  wsdlImplemented: false;
  soapEnvelopeImplemented: false;
  soapFaultImplemented: false;
  certificateImplemented: false;
  tlsImplemented: false;
  mtomImplemented: false;
  compressionImplemented: false;
  retryImplemented: false;
  operatorCommunicationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type SOAPRuntimeCapabilities = {
  provider: SOAPRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepare: boolean;
  supportsGetResponse: boolean;
  supportsListResponses: boolean;
  supportsStats: boolean;
  supportsCanonicalSOAP: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesXMLRuntimePort: boolean;
  usesXMLValidationRuntimePort: boolean;
  usesQualityRuntimePort: boolean;
  usesAutoFillRuntimePort: boolean;
  usesTISSMappingRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  usesValidationRuntimePort: boolean;
  runtimeReady: true;
  soapCommunicationImplemented: false;
  wsdlImplemented: false;
  soapEnvelopeImplemented: false;
  soapFaultImplemented: false;
  certificateImplemented: false;
  tlsImplemented: false;
  mtomImplemented: false;
  compressionImplemented: false;
  retryImplemented: false;
  operatorCommunicationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsHttpEndpoint: false;
  knowsWsdl: false;
  engine?: SOAPRuntimeEngineCapabilities;
  canonical?: import("./canonical").SOAPCapabilities;
};

export type SOAPRuntimePortCapabilities = SOAPRuntimeCapabilities;

/** Metadados estáveis do provedor (C-03). */
export type SOAPRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-03). */
export type SOAPRuntimeInfo = {
  providerId: SOAPRuntimeProviderId;
  metadata: SOAPRuntimeProviderMetadata;
  status: SOAPRuntimeStatus;
  providerType: "SOAP_RUNTIME";
  capabilities: SOAPRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-03. */
export type SOAPRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-03. */
export type SOAPRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: SOAPRuntimeProviderId;
  telemetry: SOAPRuntimeTelemetry;
  logs?: readonly SOAPRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-03: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type SOAPRuntimeEnterpriseDeps = {
  getXMLRuntimePort?: () => XMLRuntimePort;
  getQualityRuntimePort?: () => QualityRuntimePort;
  getAutoFillRuntimePort?: () => AutoFillRuntimePort;
  getTISSMappingRuntimePort?: () => TISSMappingRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
  getValidationRuntimePort?: () => ValidationRuntimePort;
};

/** Opções de resolução do SOAPRuntimePort. */
export type SOAPRuntimeProviderOptions = {
  provider?: SOAPRuntimeProviderId;
  enterpriseDeps?: SOAPRuntimeEnterpriseDeps;
};

/** Alias C-03 — resolução do SOAPRuntimePort (default: `enterprise`). */
export type SOAPRuntimeOptions = SOAPRuntimeProviderOptions;

/** Entrada de registro no SOAPRuntimeRegistry (C-03). */
export type SOAPRuntimeRegistration = {
  providerId: SOAPRuntimeProviderId;
  name: string;
  version: string;
  status: SOAPRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: SOAPRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-03 — operações estruturais (prepare / getResponse / listResponses / stats).
// Nunca executam comunicação SOAP / HTTP / WSDL / TLS / certificado.
// ---------------------------------------------------------------------------

export type PrepareSOAPInput = SOAPRuntimeOperationalControls & {
  request?: SOAPRequest;
  name?: string;
  operation?: string;
  soapContext?: SOAPContext;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
};

export type PrepareSOAPResult = SOAPRuntimeOperationEnvelope & {
  response?: import("./canonical").SOAPResponse;
};

export type GetSOAPResponseInput = SOAPRuntimeOperationalControls & {
  responseId: string;
};

export type GetSOAPResponseResult = SOAPRuntimeOperationEnvelope & {
  response?: import("./canonical").SOAPResponse;
};

export type ListSOAPResponsesInput = SOAPRuntimeOperationalControls & {
  status?: string;
};

export type ListSOAPResponsesResult = SOAPRuntimeOperationEnvelope & {
  responses: readonly import("./canonical").SOAPResponse[];
  statistics?: SOAPStatistics;
};

export type SOAPStatsInput = SOAPRuntimeOperationalControls & {
  contextId?: string;
};

export type SOAPStatsResult = SOAPRuntimeOperationEnvelope & {
  statistics?: SOAPStatistics;
  response?: import("./canonical").SOAPResponse;
};
