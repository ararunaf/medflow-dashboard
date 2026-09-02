/**
 * Tipos vendor-agnósticos do Enterprise Return Runtime — C-08 / ECS-01.
 *
 * Fluxo estrutural (C-08):
 *   Produto → Enterprise Runtime → ReturnRuntimePort
 *     → Adapter → Return Runtime Store → ReturnManifest / ReturnCorrelation /
 *       ReturnStateMachine
 *
 * C-08: infraestrutura canônica estrutural apenas — sem processamento de
 * retorno / sem correlação automática / sem reconciliação / sem parser XML /
 * sem SOAP / sem operadoras / sem banco / sem APIs / sem filas.
 *
 * CORRELATION BEFORE PROCESSING (Regra Permanente nº 14).
 */
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { AuthorizationRuntimePort } from "../../authorization-runtime/ports/authorization-runtime-port";
import type { BatchRuntimePort } from "../../batch-runtime/ports/batch-runtime-port";
import type { OperatorRuntimePort } from "../../operator-runtime/ports/operator-runtime-port";
import type { ProtocolRuntimePort } from "../../protocol-runtime/ports/protocol-runtime-port";
import type { SOAPRuntimePort } from "../../soap-runtime/ports/soap-runtime-port";
import type { XMLRuntimePort } from "../../xml-runtime/ports/xml-runtime-port";
import type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  OperatorCapabilityProfile,
  ProtocolProfile,
  ReturnContext,
  ReturnCorrelation,
  ReturnEnvelope,
  ReturnManifest,
  ReturnMetadata,
  ReturnOrigin,
  ReturnPolicy,
  ReturnState,
  ReturnStateMachine,
  ReturnStatistics,
  ReturnStatus,
  XMLDocument,
} from "./canonical";
import type { ReturnRuntimeEngineCapabilities } from "./capabilities";

export type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  OperatorCapabilityProfile,
  ProtocolProfile,
  ReturnCapabilities,
  ReturnContext,
  ReturnCorrelation,
  ReturnEnvelope,
  ReturnHealth,
  ReturnManifest,
  ReturnMetadata,
  ReturnOrigin,
  ReturnPolicy,
  ReturnRuntimeObservabilityEnvelope,
  ReturnState,
  ReturnStateMachine,
  ReturnStatistics,
  ReturnStatus,
  XMLDocument,
} from "./canonical";
export type { ReturnRuntimeEngineCapabilities };
export { RETURN_CANONICAL_STATES } from "./canonical";

/** Provedores / mecanismos do Return Runtime (adapters do Port). */
export type ReturnRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-08). */
export type ReturnRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-08). */
export type ReturnRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-08). */
export type ReturnRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: ReturnRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Return Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type ReturnRuntimeHealth = {
  ok: boolean;
  provider: ReturnRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: ReturnRuntimeStatus;
  kind?: "canonical-return-health";
  protocolRuntimeOk?: boolean;
  batchRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  storedManifestCount?: number;
  storedContextCount?: number;
  storedCorrelationCount?: number;
  runtimeReady: true;
  returnProcessingImplemented: false;
  automaticCorrelationImplemented: false;
  statusUpdateImplemented: false;
  reconciliationImplemented: false;
  workflowIntegrationImplemented: false;
  xmlParserImplemented: false;
  soapImplemented: false;
  operatorCommunicationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ReturnRuntimeCapabilities = {
  provider: ReturnRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareReturn: boolean;
  supportsGetReturn: boolean;
  supportsListReturns: boolean;
  supportsCorrelateReturn: boolean;
  supportsStats: boolean;
  supportsCanonicalReturnManifest: boolean;
  supportsReturnCorrelation: boolean;
  supportsReturnStateMachine: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesProtocolRuntimePort: boolean;
  usesBatchRuntimePort: boolean;
  usesAuthorizationRuntimePort: boolean;
  usesOperatorRuntimePort: boolean;
  usesSOAPRuntimePort: boolean;
  usesXMLRuntimePort: boolean;
  usesXMLValidationRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  runtimeReady: true;
  returnProcessingImplemented: false;
  automaticCorrelationImplemented: false;
  statusUpdateImplemented: false;
  reconciliationImplemented: false;
  workflowIntegrationImplemented: false;
  xmlParserImplemented: false;
  soapImplemented: false;
  operatorCommunicationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  engine?: ReturnRuntimeEngineCapabilities;
  canonical?: import("./canonical").ReturnCapabilities;
};

export type ReturnRuntimePortCapabilities = ReturnRuntimeCapabilities;

/** Metadados estáveis do provedor (C-08). */
export type ReturnRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-08). */
export type ReturnRuntimeInfo = {
  providerId: ReturnRuntimeProviderId;
  metadata: ReturnRuntimeProviderMetadata;
  status: ReturnRuntimeStatus;
  providerType: "RETURN_RUNTIME";
  capabilities: ReturnRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-08. */
export type ReturnRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-08. */
export type ReturnRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: ReturnRuntimeProviderId;
  telemetry: ReturnRuntimeTelemetry;
  logs?: readonly ReturnRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-08: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type ReturnRuntimeEnterpriseDeps = {
  getProtocolRuntimePort?: () => ProtocolRuntimePort;
  getBatchRuntimePort?: () => BatchRuntimePort;
  getAuthorizationRuntimePort?: () => AuthorizationRuntimePort;
  getOperatorRuntimePort?: () => OperatorRuntimePort;
  getSOAPRuntimePort?: () => SOAPRuntimePort;
  getXMLRuntimePort?: () => XMLRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
};

/** Opções de resolução do ReturnRuntimePort. */
export type ReturnRuntimeProviderOptions = {
  provider?: ReturnRuntimeProviderId;
  enterpriseDeps?: ReturnRuntimeEnterpriseDeps;
};

/** Alias C-08 — resolução do ReturnRuntimePort (default: `enterprise`). */
export type ReturnRuntimeOptions = ReturnRuntimeProviderOptions;

/** Entrada de registro no ReturnRuntimeRegistry (C-08). */
export type ReturnRuntimeRegistration = {
  providerId: ReturnRuntimeProviderId;
  name: string;
  version: string;
  status: ReturnRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: ReturnRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-08 — operações estruturais (prepareReturn / getReturn / listReturns /
// correlateReturn / stats). Nunca processam retorno / nunca correlacionam
// automaticamente / nunca reconciliam / nunca atualizam status / nunca workflow.
// ---------------------------------------------------------------------------

export type PrepareReturnInput = ReturnRuntimeOperationalControls & {
  manifest?: ReturnManifest;
  transactionId?: string;
  batchId?: string;
  operatorId?: string;
  protocolId?: string;
  correlationId?: string;
  receivedAt?: string;
  origin?: ReturnOrigin;
  status?: ReturnStatus;
  state?: ReturnState;
  stateMachine?: ReturnStateMachine;
  metadata?: ReturnMetadata;
  payloadReference?: string;
  processingPolicy?: ReturnPolicy;
  envelope?: ReturnEnvelope;
  correlation?: ReturnCorrelation;
  returnContext?: ReturnContext;
  operatorProfile?: OperatorCapabilityProfile;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  xmlDocument?: XMLDocument;
  auditResult?: AuditResult;
  tags?: readonly string[];
  owner?: string;
};

export type PrepareReturnResult = ReturnRuntimeOperationEnvelope & {
  manifest?: ReturnManifest;
  returnContext?: ReturnContext;
  /** Sempre false — nenhum processamento de retorno executado. */
  returnProcessed?: false;
  returnProcessingImplemented: false;
  automaticCorrelationImplemented: false;
};

export type GetReturnInput = ReturnRuntimeOperationalControls & {
  returnId?: string;
  transactionId?: string;
  contextId?: string;
  correlationId?: string;
};

export type GetReturnResult = ReturnRuntimeOperationEnvelope & {
  manifest?: ReturnManifest;
  returnContext?: ReturnContext;
  correlation?: ReturnCorrelation;
};

export type ListReturnsInput = ReturnRuntimeOperationalControls & {
  state?: ReturnState | string;
  status?: ReturnStatus | string;
};

export type ListReturnsResult = ReturnRuntimeOperationEnvelope & {
  manifests: readonly ReturnManifest[];
  contexts: readonly ReturnContext[];
  correlations: readonly ReturnCorrelation[];
  statistics?: ReturnStatistics;
};

/**
 * Entrada estrutural de correlação (C-08 / RULE_14).
 * Nesta Sprint: envelope estrutural apenas — automaticCorrelationImplemented = false.
 */
export type CorrelateReturnInput = ReturnRuntimeOperationalControls & {
  correlation?: ReturnCorrelation;
  transactionId?: string;
  authorizationId?: string;
  batchId?: string;
  documentId?: string;
  operatorId?: string;
  correlationStrategy?: string;
  correlationConfidence?: number;
  matchedEntities?: readonly string[];
  manifest?: ReturnManifest;
  returnContext?: ReturnContext;
};

export type CorrelateReturnResult = ReturnRuntimeOperationEnvelope & {
  correlation?: ReturnCorrelation;
  manifest?: ReturnManifest;
  returnContext?: ReturnContext;
  /** Sempre false — correlação automática não existe nesta Sprint. */
  correlated?: false;
  automaticCorrelationImplemented: false;
  returnProcessingImplemented: false;
};

export type ReturnStatsInput = ReturnRuntimeOperationalControls & {
  contextId?: string;
};

export type ReturnStatsResult = ReturnRuntimeOperationEnvelope & {
  statistics?: ReturnStatistics;
  manifest?: ReturnManifest;
};
