/**
 * Tipos vendor-agnósticos do Enterprise Authorization Runtime — C-05 / ECS-01.
 *
 * Fluxo estrutural (C-05):
 *   Produto → Enterprise Runtime → AuthorizationRuntimePort
 *     → Adapter → Authorization Runtime Store → AuthorizationStrategy / AuthorizationPolicy
 *
 * C-05: infraestrutura canônica estrutural apenas — sem autorização funcional /
 * sem elegibilidade / sem integração com operadoras / sem SOAP/XML/REST
 * funcional / sem autenticação / sem banco / sem persistência / sem APIs.
 *
 * AUTHORIZATION STRATEGY PATTERN (Regra Permanente nº 9).
 * POLICY-DRIVEN AUTHORIZATION — OperatorCapabilityProfile + AuthorizationPolicy.
 */
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { AutoFillRuntimePort } from "../../auto-fill-runtime/ports/auto-fill-runtime-port";
import type { OperatorRuntimePort } from "../../operator-runtime/ports/operator-runtime-port";
import type { QualityRuntimePort } from "../../quality-runtime/ports/quality-runtime-port";
import type { SOAPRuntimePort } from "../../soap-runtime/ports/soap-runtime-port";
import type { ValidationRuntimePort } from "../../validation-runtime/ports/validation-runtime-port";
import type { XMLRuntimePort } from "../../xml-runtime/ports/xml-runtime-port";
import type { XMLValidationRuntimePort } from "../../xml-validation-runtime/ports/xml-validation-runtime-port";
import type {
  AuditResult,
  AuthorizationContext,
  AuthorizationPolicy,
  AuthorizationRequest,
  AuthorizationStatistics,
  AuthorizationStrategy,
  CanonicalGuide,
  OperatorCapabilityProfile,
  QualityAssessment,
  ValidationResult,
  XMLDocument,
  XMLValidationResult,
} from "./canonical";
import type { AuthorizationRuntimeEngineCapabilities } from "./capabilities";

export type {
  AuditResult,
  AuthorizationCapabilities,
  AuthorizationContext,
  AuthorizationHealth,
  AuthorizationMetadata,
  AuthorizationPolicy,
  AuthorizationRequest,
  AuthorizationResponse,
  AuthorizationRuntimeObservabilityEnvelope,
  AuthorizationStatistics,
  AuthorizationStatus,
  AuthorizationStrategy,
  AuthorizationStrategyKind,
  CanonicalGuide,
  OperatorCapabilityProfile,
  QualityAssessment,
  ValidationResult,
  XMLDocument,
  XMLValidationResult,
} from "./canonical";
export type { AuthorizationRuntimeEngineCapabilities };

/** Provedores / mecanismos do Authorization Runtime (adapters do Port). */
export type AuthorizationRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-05). */
export type AuthorizationRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-05). */
export type AuthorizationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-05). */
export type AuthorizationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: AuthorizationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Authorization Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type AuthorizationRuntimeHealth = {
  ok: boolean;
  provider: AuthorizationRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: AuthorizationRuntimeStatus;
  kind?: "canonical-authorization-health";
  operatorRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  storedStrategyCount?: number;
  storedPolicyCount?: number;
  storedResponseCount?: number;
  storedRequestCount?: number;
  storedContextCount?: number;
  runtimeReady: true;
  authorizationImplemented: false;
  eligibilityImplemented: false;
  attachmentAuthorizationImplemented: false;
  batchAuthorizationImplemented: false;
  statusPollingImplemented: false;
  preAuthorizationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  operatorCommunicationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AuthorizationRuntimeCapabilities = {
  provider: AuthorizationRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareAuthorization: boolean;
  supportsGetAuthorization: boolean;
  supportsListAuthorizations: boolean;
  supportsStats: boolean;
  supportsCanonicalAuthorization: boolean;
  supportsStrategySelection: boolean;
  supportsPolicyDrivenAuthorization: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesOperatorRuntimePort: boolean;
  usesSOAPRuntimePort: boolean;
  usesXMLRuntimePort: boolean;
  usesXMLValidationRuntimePort: boolean;
  usesQualityRuntimePort: boolean;
  usesAutoFillRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  usesValidationRuntimePort: boolean;
  runtimeReady: true;
  authorizationImplemented: false;
  eligibilityImplemented: false;
  attachmentAuthorizationImplemented: false;
  batchAuthorizationImplemented: false;
  statusPollingImplemented: false;
  preAuthorizationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  operatorCommunicationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  engine?: AuthorizationRuntimeEngineCapabilities;
  canonical?: import("./canonical").AuthorizationCapabilities;
};

export type AuthorizationRuntimePortCapabilities = AuthorizationRuntimeCapabilities;

/** Metadados estáveis do provedor (C-05). */
export type AuthorizationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-05). */
export type AuthorizationRuntimeInfo = {
  providerId: AuthorizationRuntimeProviderId;
  metadata: AuthorizationRuntimeProviderMetadata;
  status: AuthorizationRuntimeStatus;
  providerType: "AUTHORIZATION_RUNTIME";
  capabilities: AuthorizationRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-05. */
export type AuthorizationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-05. */
export type AuthorizationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: AuthorizationRuntimeProviderId;
  telemetry: AuthorizationRuntimeTelemetry;
  logs?: readonly AuthorizationRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-05: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type AuthorizationRuntimeEnterpriseDeps = {
  getOperatorRuntimePort?: () => OperatorRuntimePort;
  getSOAPRuntimePort?: () => SOAPRuntimePort;
  getXMLRuntimePort?: () => XMLRuntimePort;
  getXMLValidationRuntimePort?: () => XMLValidationRuntimePort;
  getQualityRuntimePort?: () => QualityRuntimePort;
  getAutoFillRuntimePort?: () => AutoFillRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
  getValidationRuntimePort?: () => ValidationRuntimePort;
};

/** Opções de resolução do AuthorizationRuntimePort. */
export type AuthorizationRuntimeProviderOptions = {
  provider?: AuthorizationRuntimeProviderId;
  enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;
};

/** Alias C-05 — resolução do AuthorizationRuntimePort (default: `enterprise`). */
export type AuthorizationRuntimeOptions = AuthorizationRuntimeProviderOptions;

/** Entrada de registro no AuthorizationRuntimeRegistry (C-05). */
export type AuthorizationRuntimeRegistration = {
  providerId: AuthorizationRuntimeProviderId;
  name: string;
  version: string;
  status: AuthorizationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: AuthorizationRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-05 — operações estruturais (prepareAuthorization / getAuthorization /
// listAuthorizations / stats). Nunca autorizam / nunca elegibilidade /
// nunca comunicam com operadoras / nunca SOAP/XML funcional.
// ---------------------------------------------------------------------------

export type PrepareAuthorizationInput = AuthorizationRuntimeOperationalControls & {
  request?: AuthorizationRequest;
  name?: string;
  operation?: string;
  authorizationContext?: AuthorizationContext;
  strategy?: AuthorizationStrategy;
  policy?: AuthorizationPolicy;
  capabilityProfile?: OperatorCapabilityProfile;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
};

export type PrepareAuthorizationResult = AuthorizationRuntimeOperationEnvelope & {
  response?: import("./canonical").AuthorizationResponse;
};

export type GetAuthorizationInput = AuthorizationRuntimeOperationalControls & {
  responseId?: string;
  strategyId?: string;
  policyId?: string;
};

export type GetAuthorizationResult = AuthorizationRuntimeOperationEnvelope & {
  response?: import("./canonical").AuthorizationResponse;
  strategy?: AuthorizationStrategy;
  policy?: AuthorizationPolicy;
};

export type ListAuthorizationsInput = AuthorizationRuntimeOperationalControls & {
  status?: string;
};

export type ListAuthorizationsResult = AuthorizationRuntimeOperationEnvelope & {
  responses: readonly import("./canonical").AuthorizationResponse[];
  strategies: readonly AuthorizationStrategy[];
  policies: readonly AuthorizationPolicy[];
  statistics?: AuthorizationStatistics;
};

export type AuthorizationStatsInput = AuthorizationRuntimeOperationalControls & {
  contextId?: string;
};

export type AuthorizationStatsResult = AuthorizationRuntimeOperationEnvelope & {
  statistics?: AuthorizationStatistics;
  response?: import("./canonical").AuthorizationResponse;
};
