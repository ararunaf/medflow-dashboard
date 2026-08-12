/**
 * Tipos vendor-agnósticos do Enterprise Protocol Runtime — C-07 / ECS-01.
 *
 * Fluxo estrutural (C-07):
 *   Produto → Enterprise Runtime → ProtocolRuntimePort
 *     → Adapter → Protocol Runtime Store → ProtocolProfile / ProtocolResolver
 *
 * C-07: infraestrutura canônica estrutural apenas — sem SOAP / sem REST /
 * sem gRPC / sem mensageria / sem HTTP / sem TLS / sem autenticação /
 * sem APIs / sem banco / sem resolução funcional de protocolos.
 *
 * PROTOCOL ABSTRACTION (Regra Permanente nº 12).
 */
import type { AuthorizationRuntimePort } from "../../authorization-runtime/ports/authorization-runtime-port";
import type { BatchRuntimePort } from "../../batch-runtime/ports/batch-runtime-port";
import type { OperatorRuntimePort } from "../../operator-runtime/ports/operator-runtime-port";
import type { SOAPRuntimePort } from "../../soap-runtime/ports/soap-runtime-port";
import type { XMLRuntimePort } from "../../xml-runtime/ports/xml-runtime-port";
import type { XMLValidationRuntimePort } from "../../xml-validation-runtime/ports/xml-validation-runtime-port";
import type {
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  OperatorCapabilityProfile,
  ProtocolContext,
  ProtocolMetadata,
  ProtocolProfile,
  ProtocolResolver,
  ProtocolState,
  ProtocolStatistics,
  XMLDocument,
  XMLValidationResult,
} from "./canonical";
import type { ProtocolRuntimeEngineCapabilities } from "./capabilities";

export type {
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  OperatorCapabilityProfile,
  ProtocolCapabilities,
  ProtocolContext,
  ProtocolHealth,
  ProtocolMetadata,
  ProtocolProfile,
  ProtocolResolver,
  ProtocolRuntimeObservabilityEnvelope,
  ProtocolState,
  ProtocolStatistics,
  XMLDocument,
  XMLValidationResult,
} from "./canonical";
export type { ProtocolRuntimeEngineCapabilities };
export { PROTOCOL_CANONICAL_STATES } from "./canonical";

/** Provedores / mecanismos do Protocol Runtime (adapters do Port). */
export type ProtocolRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";

/** Status operacional declarado no registry (C-07). */
export type ProtocolRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-07). */
export type ProtocolRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-07). */
export type ProtocolRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: ProtocolRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Protocol Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type ProtocolRuntimeHealth = {
  ok: boolean;
  provider: ProtocolRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: ProtocolRuntimeStatus;
  kind?: "canonical-protocol-health";
  batchRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  storedProfileCount?: number;
  storedContextCount?: number;
  storedResolverCount?: number;
  runtimeReady: true;
  soapImplemented: false;
  restImplemented: false;
  grpcImplemented: false;
  messagingImplemented: false;
  protocolResolutionImplemented: false;
  httpImplemented: false;
  tlsImplemented: false;
  authenticationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ProtocolRuntimeCapabilities = {
  provider: ProtocolRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareProfile: boolean;
  supportsGetProfile: boolean;
  supportsListProfiles: boolean;
  supportsResolveProtocol: boolean;
  supportsStats: boolean;
  supportsCanonicalProtocolProfile: boolean;
  supportsProtocolResolver: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesBatchRuntimePort: boolean;
  usesAuthorizationRuntimePort: boolean;
  usesOperatorRuntimePort: boolean;
  usesSOAPRuntimePort: boolean;
  usesXMLRuntimePort: boolean;
  usesXMLValidationRuntimePort: boolean;
  runtimeReady: true;
  soapImplemented: false;
  restImplemented: false;
  grpcImplemented: false;
  messagingImplemented: false;
  protocolResolutionImplemented: false;
  httpImplemented: false;
  tlsImplemented: false;
  authenticationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  engine?: ProtocolRuntimeEngineCapabilities;
  canonical?: import("./canonical").ProtocolCapabilities;
};

export type ProtocolRuntimePortCapabilities = ProtocolRuntimeCapabilities;

/** Metadados estáveis do provedor (C-07). */
export type ProtocolRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-07). */
export type ProtocolRuntimeInfo = {
  providerId: ProtocolRuntimeProviderId;
  metadata: ProtocolRuntimeProviderMetadata;
  status: ProtocolRuntimeStatus;
  providerType: "PROTOCOL_RUNTIME";
  capabilities: ProtocolRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-07. */
export type ProtocolRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-07. */
export type ProtocolRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: ProtocolRuntimeProviderId;
  telemetry: ProtocolRuntimeTelemetry;
  logs?: readonly ProtocolRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-07: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type ProtocolRuntimeEnterpriseDeps = {
  getBatchRuntimePort?: () => BatchRuntimePort;
  getAuthorizationRuntimePort?: () => AuthorizationRuntimePort;
  getOperatorRuntimePort?: () => OperatorRuntimePort;
  getSOAPRuntimePort?: () => SOAPRuntimePort;
  getXMLRuntimePort?: () => XMLRuntimePort;
  getXMLValidationRuntimePort?: () => XMLValidationRuntimePort;
};

/** Opções de resolução do ProtocolRuntimePort. */
export type ProtocolRuntimeProviderOptions = {
  provider?: ProtocolRuntimeProviderId;
  enterpriseDeps?: ProtocolRuntimeEnterpriseDeps;
};

/** Alias C-07 — resolução do ProtocolRuntimePort (default: `enterprise`). */
export type ProtocolRuntimeOptions = ProtocolRuntimeProviderOptions;

/** Entrada de registro no ProtocolRuntimeRegistry (C-07). */
export type ProtocolRuntimeRegistration = {
  providerId: ProtocolRuntimeProviderId;
  name: string;
  version: string;
  status: ProtocolRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: ProtocolRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-07 — operações estruturais (prepareProfile / getProfile / listProfiles /
// resolveProtocol / stats). Nunca selecionam protocolo / nunca SOAP/REST/gRPC /
// nunca mensageria / nunca HTTP / nunca TLS.
// ---------------------------------------------------------------------------

export type PrepareProtocolProfileInput = ProtocolRuntimeOperationalControls & {
  profile?: ProtocolProfile;
  profileName?: string;
  abstractProtocolRef?: string;
  state?: ProtocolState;
  requiredCapabilities?: import("./canonical").ProtocolCapabilities;
  operatorCapabilityProfile?: OperatorCapabilityProfile;
  metadata?: ProtocolMetadata;
  tags?: readonly string[];
  owner?: string;
  protocolContext?: ProtocolContext;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  batchManifest?: BatchManifest;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
};

export type PrepareProtocolProfileResult = ProtocolRuntimeOperationEnvelope & {
  profile?: ProtocolProfile;
  protocolContext?: ProtocolContext;
  /** Sempre false — nenhuma resolução de protocolo executada. */
  protocolResolved?: false;
};

export type GetProtocolProfileInput = ProtocolRuntimeOperationalControls & {
  profileId?: string;
  contextId?: string;
};

export type GetProtocolProfileResult = ProtocolRuntimeOperationEnvelope & {
  profile?: ProtocolProfile;
  protocolContext?: ProtocolContext;
};

export type ListProtocolProfilesInput = ProtocolRuntimeOperationalControls & {
  state?: ProtocolState | string;
};

export type ListProtocolProfilesResult = ProtocolRuntimeOperationEnvelope & {
  profiles: readonly ProtocolProfile[];
  contexts: readonly ProtocolContext[];
  statistics?: ProtocolStatistics;
};

/**
 * Entrada estrutural de resolução (C-07 / PROTOCOL RESOLUTION).
 * Futuro: OperatorCapabilityProfile + ProtocolCapabilities.
 * Nesta Sprint: envelope estrutural apenas — protocolResolutionImplemented = false.
 */
export type ResolveProtocolInput = ProtocolRuntimeOperationalControls & {
  resolver?: ProtocolResolver;
  operatorCapabilityProfile?: OperatorCapabilityProfile;
  protocolCapabilities?: import("./canonical").ProtocolCapabilities;
  profile?: ProtocolProfile;
  protocolContext?: ProtocolContext;
};

export type ResolveProtocolResult = ProtocolRuntimeOperationEnvelope & {
  resolver?: ProtocolResolver;
  profile?: ProtocolProfile;
  protocolContext?: ProtocolContext;
  /** Sempre false — resolução funcional não existe nesta Sprint. */
  protocolResolved?: false;
  protocolResolutionImplemented: false;
};

export type ProtocolStatsInput = ProtocolRuntimeOperationalControls & {
  contextId?: string;
};

export type ProtocolStatsResult = ProtocolRuntimeOperationEnvelope & {
  statistics?: ProtocolStatistics;
  profile?: ProtocolProfile;
};
