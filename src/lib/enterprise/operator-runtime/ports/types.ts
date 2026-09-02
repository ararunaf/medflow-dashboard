/**
 * Tipos vendor-agnósticos do Enterprise Operator Runtime — C-04 / ECS-01.
 *
 * Fluxo estrutural (C-04):
 *   Produto → Enterprise Runtime → OperatorRuntimePort
 *     → Adapter → Operator Runtime Store → OperatorCapabilityProfile
 *
 * C-04: infraestrutura canônica estrutural apenas — sem operadoras reais /
 * sem lógica condicional por operadora / sem autenticação / sem SOAP/XML/REST
 * funcional / sem banco / sem persistência / sem APIs.
 *
 * OPERATOR CAPABILITY MODEL (Regra Permanente nº 7).
 */
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { AutoFillRuntimePort } from "../../auto-fill-runtime/ports/auto-fill-runtime-port";
import type { QualityRuntimePort } from "../../quality-runtime/ports/quality-runtime-port";
import type { SOAPRuntimePort } from "../../soap-runtime/ports/soap-runtime-port";
import type { TISSMappingRuntimePort } from "../../tiss-mapping-runtime/ports/tiss-mapping-runtime-port";
import type { ValidationRuntimePort } from "../../validation-runtime/ports/validation-runtime-port";
import type { XMLRuntimePort } from "../../xml-runtime/ports/xml-runtime-port";
import type {
  AuditResult,
  CanonicalGuide,
  OperatorCapabilityProfile,
  OperatorContext,
  OperatorRequest,
  OperatorStatistics,
  QualityAssessment,
  ValidationResult,
  XMLDocument,
} from "./canonical";
import type { OperatorRuntimeEngineCapabilities } from "./capabilities";

export type {
  AuditResult,
  CanonicalGuide,
  OperatorCapabilities,
  OperatorCapabilityProfile,
  OperatorContext,
  OperatorFeatures,
  OperatorHealth,
  OperatorMetadata,
  OperatorRequest,
  OperatorResponse,
  OperatorRestrictions,
  OperatorRuntimeObservabilityEnvelope,
  OperatorStatistics,
  OperatorStatus,
  QualityAssessment,
  ValidationResult,
  XMLDocument,
} from "./canonical";
export type { OperatorRuntimeEngineCapabilities };

/** Provedores / mecanismos do Operator Runtime (adapters do Port). */
export type OperatorRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-04). */
export type OperatorRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-04). */
export type OperatorRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-04). */
export type OperatorRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: OperatorRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Operator Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type OperatorRuntimeHealth = {
  ok: boolean;
  provider: OperatorRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: OperatorRuntimeStatus;
  kind?: "canonical-operator-health";
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  storedProfileCount?: number;
  storedResponseCount?: number;
  storedRequestCount?: number;
  storedContextCount?: number;
  runtimeReady: true;
  operatorImplemented: false;
  operatorCapabilityProfileImplemented: false;
  operatorAuthenticationImplemented: false;
  operatorCommunicationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  authorizationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type OperatorRuntimeCapabilities = {
  provider: OperatorRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareProfile: boolean;
  supportsGetProfile: boolean;
  supportsListProfiles: boolean;
  supportsStats: boolean;
  supportsCanonicalOperator: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesSOAPRuntimePort: boolean;
  usesXMLRuntimePort: boolean;
  usesXMLValidationRuntimePort: boolean;
  usesQualityRuntimePort: boolean;
  usesAutoFillRuntimePort: boolean;
  usesTISSMappingRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  usesValidationRuntimePort: boolean;
  runtimeReady: true;
  operatorImplemented: false;
  operatorCapabilityProfileImplemented: false;
  operatorAuthenticationImplemented: false;
  operatorCommunicationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  authorizationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  engine?: OperatorRuntimeEngineCapabilities;
  canonical?: import("./canonical").OperatorCapabilities;
};

export type OperatorRuntimePortCapabilities = OperatorRuntimeCapabilities;

/** Metadados estáveis do provedor (C-04). */
export type OperatorRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-04). */
export type OperatorRuntimeInfo = {
  providerId: OperatorRuntimeProviderId;
  metadata: OperatorRuntimeProviderMetadata;
  status: OperatorRuntimeStatus;
  providerType: "OPERATOR_RUNTIME";
  capabilities: OperatorRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-04. */
export type OperatorRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-04. */
export type OperatorRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: OperatorRuntimeProviderId;
  telemetry: OperatorRuntimeTelemetry;
  logs?: readonly OperatorRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-04: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type OperatorRuntimeEnterpriseDeps = {
  getSOAPRuntimePort?: () => SOAPRuntimePort;
  getXMLRuntimePort?: () => XMLRuntimePort;
  getQualityRuntimePort?: () => QualityRuntimePort;
  getAutoFillRuntimePort?: () => AutoFillRuntimePort;
  getTISSMappingRuntimePort?: () => TISSMappingRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
  getValidationRuntimePort?: () => ValidationRuntimePort;
};

/** Opções de resolução do OperatorRuntimePort. */
export type OperatorRuntimeProviderOptions = {
  provider?: OperatorRuntimeProviderId;
  enterpriseDeps?: OperatorRuntimeEnterpriseDeps;
};

/** Alias C-04 — resolução do OperatorRuntimePort (default: `enterprise`). */
export type OperatorRuntimeOptions = OperatorRuntimeProviderOptions;

/** Entrada de registro no OperatorRuntimeRegistry (C-04). */
export type OperatorRuntimeRegistration = {
  providerId: OperatorRuntimeProviderId;
  name: string;
  version: string;
  status: OperatorRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: OperatorRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-04 — operações estruturais (prepareProfile / getProfile / listProfiles / stats).
// Nunca resolvem operadoras reais / nunca autenticam / nunca comunicam.
// ---------------------------------------------------------------------------

export type PrepareOperatorProfileInput = OperatorRuntimeOperationalControls & {
  request?: OperatorRequest;
  name?: string;
  operation?: string;
  operatorContext?: OperatorContext;
  capabilityProfile?: OperatorCapabilityProfile;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
};

export type PrepareOperatorProfileResult = OperatorRuntimeOperationEnvelope & {
  response?: import("./canonical").OperatorResponse;
};

export type GetOperatorProfileInput = OperatorRuntimeOperationalControls & {
  responseId?: string;
  profileId?: string;
};

export type GetOperatorProfileResult = OperatorRuntimeOperationEnvelope & {
  response?: import("./canonical").OperatorResponse;
  profile?: OperatorCapabilityProfile;
};

export type ListOperatorProfilesInput = OperatorRuntimeOperationalControls & {
  status?: string;
};

export type ListOperatorProfilesResult = OperatorRuntimeOperationEnvelope & {
  responses: readonly import("./canonical").OperatorResponse[];
  profiles: readonly OperatorCapabilityProfile[];
  statistics?: OperatorStatistics;
};

export type OperatorStatsInput = OperatorRuntimeOperationalControls & {
  contextId?: string;
};

export type OperatorStatsResult = OperatorRuntimeOperationEnvelope & {
  statistics?: OperatorStatistics;
  response?: import("./canonical").OperatorResponse;
};
