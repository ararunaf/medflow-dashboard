/**
 * Tipos vendor-agnósticos do Enterprise Reconciliation Runtime — C-09 / ECS-01.
 *
 * Fluxo estrutural (C-09):
 *   Produto → Enterprise Runtime → ReconciliationRuntimePort
 *     → Adapter → Reconciliation Runtime Store → ReconciliationManifest /
 *       CanonicalReconciliationResult / ReconciliationStateMachine
 *
 * C-09: infraestrutura canônica estrutural apenas — sem reconciliação
 * funcional / sem matching automático / sem resolução de conflitos /
 * sem comparação entre documentos / sem XML / sem SOAP / sem banco /
 * sem APIs / sem filas / sem workflow.
 *
 * RECONCILIATION IS DETERMINISTIC (Regra Permanente nº 16).
 */
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { AuthorizationRuntimePort } from "../../authorization-runtime/ports/authorization-runtime-port";
import type { BatchRuntimePort } from "../../batch-runtime/ports/batch-runtime-port";
import type { OperatorRuntimePort } from "../../operator-runtime/ports/operator-runtime-port";
import type { ProtocolRuntimePort } from "../../protocol-runtime/ports/protocol-runtime-port";
import type { ReturnRuntimePort } from "../../return-runtime/ports/return-runtime-port";
import type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  CanonicalReconciliationResult,
  OperatorCapabilityProfile,
  ProtocolProfile,
  ReconciliationConflict,
  ReconciliationContext,
  ReconciliationCorrelation,
  ReconciliationDifference,
  ReconciliationManifest,
  ReconciliationMetadata,
  ReconciliationPolicy,
  ReconciliationState,
  ReconciliationStateMachine,
  ReconciliationStatistics,
  ReturnManifest,
} from "./canonical";
import type { ReconciliationRuntimeEngineCapabilities } from "./capabilities";

export type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  CanonicalReconciliationResult,
  OperatorCapabilityProfile,
  ProtocolProfile,
  ReconciliationCapabilities,
  ReconciliationConflict,
  ReconciliationContext,
  ReconciliationCorrelation,
  ReconciliationDifference,
  ReconciliationHealth,
  ReconciliationManifest,
  ReconciliationMetadata,
  ReconciliationPolicy,
  ReconciliationRuntimeObservabilityEnvelope,
  ReconciliationState,
  ReconciliationStateMachine,
  ReconciliationStatistics,
  ReturnManifest,
} from "./canonical";
export type { ReconciliationRuntimeEngineCapabilities };
export { RECONCILIATION_CANONICAL_STATES } from "./canonical";

/** Provedores / mecanismos do Reconciliation Runtime (adapters do Port). */
export type ReconciliationRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-09). */
export type ReconciliationRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-09). */
export type ReconciliationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-09). */
export type ReconciliationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: ReconciliationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Reconciliation Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type ReconciliationRuntimeHealth = {
  ok: boolean;
  provider: ReconciliationRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: ReconciliationRuntimeStatus;
  kind?: "canonical-reconciliation-health";
  returnRuntimeOk?: boolean;
  protocolRuntimeOk?: boolean;
  batchRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  /** Workflow Runtime futuro — shape-check apenas quando disponível. */
  workflowRuntimeOk?: boolean;
  storedManifestCount?: number;
  storedContextCount?: number;
  storedCorrelationCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ReconciliationRuntimeCapabilities = {
  provider: ReconciliationRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareReconciliation: boolean;
  supportsGetReconciliation: boolean;
  supportsListReconciliations: boolean;
  supportsCorrelateReconciliation: boolean;
  supportsStats: boolean;
  supportsCanonicalReconciliationManifest: boolean;
  supportsCanonicalReconciliationResult: boolean;
  supportsReconciliationCorrelation: boolean;
  supportsReconciliationStateMachine: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesReturnRuntimePort: boolean;
  usesProtocolRuntimePort: boolean;
  usesBatchRuntimePort: boolean;
  usesAuthorizationRuntimePort: boolean;
  usesOperatorRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  usesWorkflowRuntimePort: boolean;
  runtimeReady: true;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
  engine?: ReconciliationRuntimeEngineCapabilities;
  canonical?: import("./canonical").ReconciliationCapabilities;
};

export type ReconciliationRuntimePortCapabilities = ReconciliationRuntimeCapabilities;

/** Metadados estáveis do provedor (C-09). */
export type ReconciliationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-09). */
export type ReconciliationRuntimeInfo = {
  providerId: ReconciliationRuntimeProviderId;
  metadata: ReconciliationRuntimeProviderMetadata;
  status: ReconciliationRuntimeStatus;
  providerType: "RECONCILIATION_RUNTIME";
  capabilities: ReconciliationRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-09. */
export type ReconciliationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-09. */
export type ReconciliationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: ReconciliationRuntimeProviderId;
  telemetry: ReconciliationRuntimeTelemetry;
  logs?: readonly ReconciliationRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-09: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 * Workflow Runtime: preparação futura (getter opcional).
 */
export type ReconciliationRuntimeEnterpriseDeps = {
  getReturnRuntimePort?: () => ReturnRuntimePort;
  getProtocolRuntimePort?: () => ProtocolRuntimePort;
  getBatchRuntimePort?: () => BatchRuntimePort;
  getAuthorizationRuntimePort?: () => AuthorizationRuntimePort;
  getOperatorRuntimePort?: () => OperatorRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
  /** Workflow Runtime futuro — structural prep only. */
  getWorkflowRuntimePort?: () => { health: () => unknown; capabilities: () => unknown };
};

/** Opções de resolução do ReconciliationRuntimePort. */
export type ReconciliationRuntimeProviderOptions = {
  provider?: ReconciliationRuntimeProviderId;
  enterpriseDeps?: ReconciliationRuntimeEnterpriseDeps;
};

/** Alias C-09 — resolução do ReconciliationRuntimePort (default: `enterprise`). */
export type ReconciliationRuntimeOptions = ReconciliationRuntimeProviderOptions;

/** Entrada de registro no ReconciliationRuntimeRegistry (C-09). */
export type ReconciliationRuntimeRegistration = {
  providerId: ReconciliationRuntimeProviderId;
  name: string;
  version: string;
  status: ReconciliationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: ReconciliationRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-09 — operações estruturais (prepareReconciliation / getReconciliation /
// listReconciliations / correlateReconciliation / stats). Nunca reconciliam /
// nunca fazem matching / nunca resolvem conflitos / nunca workflow.
// ---------------------------------------------------------------------------

export type PrepareReconciliationInput = ReconciliationRuntimeOperationalControls & {
  manifest?: ReconciliationManifest;
  transactionId?: string;
  batchId?: string;
  operatorId?: string;
  correlationId?: string;
  returnId?: string;
  protocolId?: string;
  receivedAt?: string;
  state?: ReconciliationState;
  stateMachine?: ReconciliationStateMachine;
  metadata?: ReconciliationMetadata;
  reconciliationPolicy?: ReconciliationPolicy;
  correlation?: ReconciliationCorrelation;
  result?: CanonicalReconciliationResult;
  reconciliationContext?: ReconciliationContext;
  operatorProfile?: OperatorCapabilityProfile;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  returnManifest?: ReturnManifest;
  auditResult?: AuditResult;
  tags?: readonly string[];
  owner?: string;
};

export type PrepareReconciliationResult = ReconciliationRuntimeOperationEnvelope & {
  manifest?: ReconciliationManifest;
  reconciliationContext?: ReconciliationContext;
  result?: CanonicalReconciliationResult;
  /** Sempre false — nenhuma reconciliação funcional executada. */
  reconciled?: false;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
};

export type GetReconciliationInput = ReconciliationRuntimeOperationalControls & {
  reconciliationId?: string;
  transactionId?: string;
  contextId?: string;
  correlationId?: string;
};

export type GetReconciliationResult = ReconciliationRuntimeOperationEnvelope & {
  manifest?: ReconciliationManifest;
  reconciliationContext?: ReconciliationContext;
  correlation?: ReconciliationCorrelation;
  result?: CanonicalReconciliationResult;
};

export type ListReconciliationsInput = ReconciliationRuntimeOperationalControls & {
  state?: ReconciliationState | string;
};

export type ListReconciliationsResult = ReconciliationRuntimeOperationEnvelope & {
  manifests: readonly ReconciliationManifest[];
  contexts: readonly ReconciliationContext[];
  correlations: readonly ReconciliationCorrelation[];
  results: readonly CanonicalReconciliationResult[];
  statistics?: ReconciliationStatistics;
};

/**
 * Entrada estrutural de correlação (C-09 / RULE_14).
 * Nesta Sprint: envelope estrutural apenas — automaticMatchingImplemented = false.
 */
export type CorrelateReconciliationInput = ReconciliationRuntimeOperationalControls & {
  correlation?: ReconciliationCorrelation;
  transactionId?: string;
  batchId?: string;
  operatorId?: string;
  returnId?: string;
  documentId?: string;
  correlationStrategy?: string;
  correlationConfidence?: number;
  matchedEntities?: readonly string[];
  manifest?: ReconciliationManifest;
  reconciliationContext?: ReconciliationContext;
};

export type CorrelateReconciliationResult = ReconciliationRuntimeOperationEnvelope & {
  correlation?: ReconciliationCorrelation;
  manifest?: ReconciliationManifest;
  reconciliationContext?: ReconciliationContext;
  /** Sempre false — matching automático não existe nesta Sprint. */
  matched?: false;
  automaticMatchingImplemented: false;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  workflowIntegrationImplemented: false;
};

export type ReconciliationStatsInput = ReconciliationRuntimeOperationalControls & {
  contextId?: string;
};

export type ReconciliationStatsResult = ReconciliationRuntimeOperationEnvelope & {
  statistics?: ReconciliationStatistics;
  manifest?: ReconciliationManifest;
};
