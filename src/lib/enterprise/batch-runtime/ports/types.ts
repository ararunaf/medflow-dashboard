/**
 * Tipos vendor-agnósticos do Enterprise Batch Runtime — C-06 / ECS-01.
 *
 * Fluxo estrutural (C-06):
 *   Produto → Enterprise Runtime → BatchRuntimePort
 *     → Adapter → Batch Runtime Store → BatchManifest / BatchStateMachine
 *
 * C-06: infraestrutura canônica estrutural apenas — sem processamento em lote /
 * sem filas / sem workers / sem retry funcional / sem scheduler / sem paralelismo /
 * sem SOAP/XML funcional / sem banco / sem persistência / sem APIs.
 *
 * STATE MACHINE FIRST (Regra Permanente nº 11).
 */
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { AuthorizationRuntimePort } from "../../authorization-runtime/ports/authorization-runtime-port";
import type { OperatorRuntimePort } from "../../operator-runtime/ports/operator-runtime-port";
import type { QualityRuntimePort } from "../../quality-runtime/ports/quality-runtime-port";
import type { SOAPRuntimePort } from "../../soap-runtime/ports/soap-runtime-port";
import type { XMLRuntimePort } from "../../xml-runtime/ports/xml-runtime-port";
import type { XMLValidationRuntimePort } from "../../xml-validation-runtime/ports/xml-validation-runtime-port";
import type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchContext,
  BatchDocument,
  BatchManifest,
  BatchPolicy,
  BatchPriority,
  BatchState,
  BatchStateMachine,
  BatchStatistics,
  OperatorCapabilityProfile,
  QualityAssessment,
  XMLDocument,
  XMLValidationResult,
} from "./canonical";
import type { BatchRuntimeEngineCapabilities } from "./capabilities";

export type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchCapabilities,
  BatchContext,
  BatchDocument,
  BatchHealth,
  BatchManifest,
  BatchMetadata,
  BatchPolicy,
  BatchPriority,
  BatchRuntimeObservabilityEnvelope,
  BatchState,
  BatchStateMachine,
  BatchStatistics,
  OperatorCapabilityProfile,
  QualityAssessment,
  XMLDocument,
  XMLValidationResult,
} from "./canonical";
export type { BatchRuntimeEngineCapabilities };
export { BATCH_CANONICAL_STATES } from "./canonical";

/** Provedores / mecanismos do Batch Runtime (adapters do Port). */
export type BatchRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-06). */
export type BatchRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-06). */
export type BatchRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-06). */
export type BatchRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: BatchRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Batch Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type BatchRuntimeHealth = {
  ok: boolean;
  provider: BatchRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: BatchRuntimeStatus;
  kind?: "canonical-batch-health";
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  storedManifestCount?: number;
  storedDocumentCount?: number;
  storedContextCount?: number;
  runtimeReady: true;
  batchProcessingImplemented: false;
  parallelExecutionImplemented: false;
  retryImplemented: false;
  schedulerImplemented: false;
  workerImplemented: false;
  queueImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  operatorCommunicationImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type BatchRuntimeCapabilities = {
  provider: BatchRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareBatch: boolean;
  supportsGetBatch: boolean;
  supportsListBatches: boolean;
  supportsStats: boolean;
  supportsCanonicalBatchManifest: boolean;
  supportsBatchStateMachine: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesAuthorizationRuntimePort: boolean;
  usesOperatorRuntimePort: boolean;
  usesSOAPRuntimePort: boolean;
  usesXMLRuntimePort: boolean;
  usesXMLValidationRuntimePort: boolean;
  usesQualityRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  runtimeReady: true;
  batchProcessingImplemented: false;
  parallelExecutionImplemented: false;
  retryImplemented: false;
  schedulerImplemented: false;
  workerImplemented: false;
  queueImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  operatorCommunicationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  engine?: BatchRuntimeEngineCapabilities;
  canonical?: import("./canonical").BatchCapabilities;
};

export type BatchRuntimePortCapabilities = BatchRuntimeCapabilities;

/** Metadados estáveis do provedor (C-06). */
export type BatchRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-06). */
export type BatchRuntimeInfo = {
  providerId: BatchRuntimeProviderId;
  metadata: BatchRuntimeProviderMetadata;
  status: BatchRuntimeStatus;
  providerType: "BATCH_RUNTIME";
  capabilities: BatchRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-06. */
export type BatchRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-06. */
export type BatchRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: BatchRuntimeProviderId;
  telemetry: BatchRuntimeTelemetry;
  logs?: readonly BatchRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-06: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type BatchRuntimeEnterpriseDeps = {
  getAuthorizationRuntimePort?: () => AuthorizationRuntimePort;
  getOperatorRuntimePort?: () => OperatorRuntimePort;
  getSOAPRuntimePort?: () => SOAPRuntimePort;
  getXMLRuntimePort?: () => XMLRuntimePort;
  getXMLValidationRuntimePort?: () => XMLValidationRuntimePort;
  getQualityRuntimePort?: () => QualityRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
};

/** Opções de resolução do BatchRuntimePort. */
export type BatchRuntimeProviderOptions = {
  provider?: BatchRuntimeProviderId;
  enterpriseDeps?: BatchRuntimeEnterpriseDeps;
};

/** Alias C-06 — resolução do BatchRuntimePort (default: `enterprise`). */
export type BatchRuntimeOptions = BatchRuntimeProviderOptions;

/** Entrada de registro no BatchRuntimeRegistry (C-06). */
export type BatchRuntimeRegistration = {
  providerId: BatchRuntimeProviderId;
  name: string;
  version: string;
  status: BatchRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: BatchRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-06 — operações estruturais (prepareBatch / getBatch / listBatches / stats).
// Nunca processam lote / nunca enfileiram / nunca enviam / nunca workers.
// ---------------------------------------------------------------------------

export type PrepareBatchInput = BatchRuntimeOperationalControls & {
  manifest?: BatchManifest;
  batchName?: string;
  documents?: readonly BatchDocument[];
  operatorProfile?: OperatorCapabilityProfile;
  submissionStrategy?: string;
  priority?: BatchPriority;
  state?: BatchState;
  stateMachine?: BatchStateMachine;
  dependencies?: import("./canonical").BatchDependencies;
  retryPolicy?: BatchPolicy;
  requestedExecutionTime?: string;
  owner?: string;
  tags?: readonly string[];
  batchContext?: BatchContext;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  qualityAssessment?: QualityAssessment;
  auditResult?: AuditResult;
};

export type PrepareBatchResult = BatchRuntimeOperationEnvelope & {
  manifest?: BatchManifest;
  batchContext?: BatchContext;
  /** Sempre false — nenhum processamento de lote executado. */
  batchProcessed?: false;
};

export type GetBatchInput = BatchRuntimeOperationalControls & {
  batchId?: string;
  contextId?: string;
};

export type GetBatchResult = BatchRuntimeOperationEnvelope & {
  manifest?: BatchManifest;
  batchContext?: BatchContext;
};

export type ListBatchesInput = BatchRuntimeOperationalControls & {
  state?: BatchState | string;
};

export type ListBatchesResult = BatchRuntimeOperationEnvelope & {
  manifests: readonly BatchManifest[];
  contexts: readonly BatchContext[];
  statistics?: BatchStatistics;
};

export type BatchStatsInput = BatchRuntimeOperationalControls & {
  contextId?: string;
};

export type BatchStatsResult = BatchRuntimeOperationEnvelope & {
  statistics?: BatchStatistics;
  manifest?: BatchManifest;
};
