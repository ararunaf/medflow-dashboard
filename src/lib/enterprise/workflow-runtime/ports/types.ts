/**
 * Tipos vendor-agnósticos do Enterprise Corporate Workflow Runtime — C-10 / ECS-01.
 *
 * Fluxo estrutural (C-10):
 *   Produto → Enterprise Runtime → WorkflowRuntimePort
 *     → Adapter → Workflow Runtime Store → WorkflowManifest /
 *       WorkflowExecutionResult / WorkflowStateMachine
 *
 * C-10: infraestrutura canônica estrutural apenas — sem workflow funcional /
 * sem BPM / sem decisão automática / sem execução de runtime / sem filas /
 * sem workers / sem scheduler / sem XML / sem SOAP / sem banco / sem APIs.
 *
 * WORKFLOW IS PURE ORCHESTRATION (Regra Permanente nº 18): o Workflow Runtime
 * exclusivamente orquestra; nunca valida XML, nunca reconcilia, nunca autoriza,
 * nunca gera SOAP, nunca fala com operadoras, nunca processa lotes, nunca roda
 * IA, e nunca implementa regras de domínio.
 */
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { AuthorizationRuntimePort } from "../../authorization-runtime/ports/authorization-runtime-port";
import type { BatchRuntimePort } from "../../batch-runtime/ports/batch-runtime-port";
import type { OperatorRuntimePort } from "../../operator-runtime/ports/operator-runtime-port";
import type { ProtocolRuntimePort } from "../../protocol-runtime/ports/protocol-runtime-port";
import type { ReconciliationRuntimePort } from "../../reconciliation-runtime/ports/reconciliation-runtime-port";
import type { ReturnRuntimePort } from "../../return-runtime/ports/return-runtime-port";
import type { SOAPRuntimePort } from "../../soap-runtime/ports/soap-runtime-port";
import type { XMLRuntimePort } from "../../xml-runtime/ports/xml-runtime-port";
import type { XMLValidationRuntimePort } from "../../xml-validation-runtime/ports/xml-validation-runtime-port";
import type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  CanonicalReconciliationResult,
  OperatorCapabilityProfile,
  ProtocolProfile,
  ReturnManifest,
  WorkflowCapabilities,
  WorkflowContext,
  WorkflowExecution,
  WorkflowExecutionMetadata,
  WorkflowExecutionPolicy,
  WorkflowExecutionResult,
  WorkflowExecutionStatistics,
  WorkflowHealth,
  WorkflowManifest,
  WorkflowRuntimeObservabilityEnvelope,
  WorkflowSoapEnvelopeRef,
  WorkflowState,
  WorkflowStateMachine,
  WorkflowXmlDocumentRef,
  WorkflowXmlValidationRef,
} from "./canonical";
import type { WorkflowRuntimeEngineCapabilities } from "./capabilities";

export type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  CanonicalReconciliationResult,
  OperatorCapabilityProfile,
  ProtocolProfile,
  ReturnManifest,
  WorkflowCapabilities,
  WorkflowContext,
  WorkflowExecution,
  WorkflowExecutionMetadata,
  WorkflowExecutionPolicy,
  WorkflowExecutionResult,
  WorkflowExecutionStatistics,
  WorkflowHealth,
  WorkflowManifest,
  WorkflowRuntimeObservabilityEnvelope,
  WorkflowSoapEnvelopeRef,
  WorkflowState,
  WorkflowStateMachine,
  WorkflowXmlDocumentRef,
  WorkflowXmlValidationRef,
} from "./canonical";
export type { WorkflowRuntimeEngineCapabilities };
export { WORKFLOW_CANONICAL_STATES } from "./canonical";

/** Provedores / mecanismos do Workflow Runtime (adapters do Port). */
export type WorkflowRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-10). */
export type WorkflowRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-10). */
export type WorkflowRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-10). */
export type WorkflowRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: WorkflowRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do Workflow Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 */
export type WorkflowRuntimeHealth = {
  ok: boolean;
  provider: WorkflowRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: WorkflowRuntimeStatus;
  kind?: "canonical-workflow-health";
  reconciliationRuntimeOk?: boolean;
  returnRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  protocolRuntimeOk?: boolean;
  batchRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  storedManifestCount?: number;
  storedContextCount?: number;
  storedExecutionCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  workflowImplemented: false;
  workflowExecutionImplemented: false;
  automaticDecisionImplemented: false;
  runtimeExecutionImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type WorkflowRuntimeCapabilities = {
  provider: WorkflowRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsPrepareWorkflowExecution: boolean;
  supportsGetWorkflowExecution: boolean;
  supportsListWorkflowExecutions: boolean;
  supportsStats: boolean;
  supportsCanonicalWorkflowManifest: boolean;
  supportsCanonicalWorkflowExecutionResult: boolean;
  supportsWorkflowStateMachine: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesReconciliationRuntimePort: boolean;
  usesReturnRuntimePort: boolean;
  usesAuthorizationRuntimePort: boolean;
  usesOperatorRuntimePort: boolean;
  usesProtocolRuntimePort: boolean;
  usesBatchRuntimePort: boolean;
  usesSOAPRuntimePort: boolean;
  usesXMLRuntimePort: boolean;
  usesXMLValidationRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  runtimeReady: true;
  workflowImplemented: false;
  workflowExecutionImplemented: false;
  automaticDecisionImplemented: false;
  runtimeExecutionImplemented: false;
  engine?: WorkflowRuntimeEngineCapabilities;
  canonical?: import("./canonical").WorkflowCapabilities;
};

export type WorkflowRuntimePortCapabilities = WorkflowRuntimeCapabilities;

/** Metadados estáveis do provedor (C-10). */
export type WorkflowRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-10). */
export type WorkflowRuntimeInfo = {
  providerId: WorkflowRuntimeProviderId;
  metadata: WorkflowRuntimeProviderMetadata;
  status: WorkflowRuntimeStatus;
  providerType: "WORKFLOW_RUNTIME";
  capabilities: WorkflowRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-10. */
export type WorkflowRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-10. */
export type WorkflowRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: WorkflowRuntimeProviderId;
  telemetry: WorkflowRuntimeTelemetry;
  logs?: readonly WorkflowRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-10: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 * RULE_18 — o Workflow Runtime NUNCA consome estes Ports funcionalmente;
 * apenas verifica a forma (health + capabilities) quando disponíveis.
 */
export type WorkflowRuntimeEnterpriseDeps = {
  getReconciliationRuntimePort?: () => ReconciliationRuntimePort;
  getReturnRuntimePort?: () => ReturnRuntimePort;
  getAuthorizationRuntimePort?: () => AuthorizationRuntimePort;
  getOperatorRuntimePort?: () => OperatorRuntimePort;
  getProtocolRuntimePort?: () => ProtocolRuntimePort;
  getBatchRuntimePort?: () => BatchRuntimePort;
  getSOAPRuntimePort?: () => SOAPRuntimePort;
  getXMLRuntimePort?: () => XMLRuntimePort;
  getXMLValidationRuntimePort?: () => XMLValidationRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
};

/** Opções de resolução do WorkflowRuntimePort. */
export type WorkflowRuntimeProviderOptions = {
  provider?: WorkflowRuntimeProviderId;
  enterpriseDeps?: WorkflowRuntimeEnterpriseDeps;
};

/** Alias C-10 — resolução do WorkflowRuntimePort (default: `enterprise`). */
export type WorkflowRuntimeOptions = WorkflowRuntimeProviderOptions;

/** Entrada de registro no WorkflowRuntimeRegistry (C-10). */
export type WorkflowRuntimeRegistration = {
  providerId: WorkflowRuntimeProviderId;
  name: string;
  version: string;
  status: WorkflowRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: WorkflowRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-10 — operações estruturais (prepareWorkflowExecution / getWorkflowExecution /
// listWorkflowExecutions / stats). Nunca orquestram de fato / nunca decidem
// automaticamente / nunca executam workflow / nunca fazem BPM.
// ---------------------------------------------------------------------------

export type PrepareWorkflowExecutionInput = WorkflowRuntimeOperationalControls & {
  manifest?: WorkflowManifest;
  workflowId?: string;
  transactionId?: string;
  correlationId?: string;
  state?: WorkflowState;
  stateMachine?: WorkflowStateMachine;
  metadata?: WorkflowExecutionMetadata;
  executionPolicy?: WorkflowExecutionPolicy;
  execution?: WorkflowExecution;
  result?: WorkflowExecutionResult;
  workflowContext?: WorkflowContext;
  reconciliationResult?: CanonicalReconciliationResult;
  returnManifest?: ReturnManifest;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  operatorProfile?: OperatorCapabilityProfile;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  soapEnvelope?: WorkflowSoapEnvelopeRef;
  xmlDocument?: WorkflowXmlDocumentRef;
  xmlValidationResult?: WorkflowXmlValidationRef;
  auditResult?: AuditResult;
  tags?: readonly string[];
  owner?: string;
};

export type PrepareWorkflowExecutionResult = WorkflowRuntimeOperationEnvelope & {
  manifest?: WorkflowManifest;
  workflowContext?: WorkflowContext;
  execution?: WorkflowExecution;
  result?: WorkflowExecutionResult;
  /** Sempre false — nenhuma execução funcional de workflow. */
  executed: false;
  workflowImplemented: false;
  workflowExecutionImplemented: false;
  automaticDecisionImplemented: false;
  runtimeExecutionImplemented: false;
};

export type GetWorkflowExecutionInput = WorkflowRuntimeOperationalControls & {
  workflowExecutionId?: string;
  transactionId?: string;
  contextId?: string;
  correlationId?: string;
};

export type GetWorkflowExecutionResult = WorkflowRuntimeOperationEnvelope & {
  manifest?: WorkflowManifest;
  workflowContext?: WorkflowContext;
  execution?: WorkflowExecution;
  result?: WorkflowExecutionResult;
};

export type ListWorkflowExecutionsInput = WorkflowRuntimeOperationalControls & {
  state?: WorkflowState | string;
};

export type ListWorkflowExecutionsResult = WorkflowRuntimeOperationEnvelope & {
  manifests: readonly WorkflowManifest[];
  contexts: readonly WorkflowContext[];
  executions: readonly WorkflowExecution[];
  results: readonly WorkflowExecutionResult[];
  statistics?: WorkflowExecutionStatistics;
};

export type WorkflowStatsInput = WorkflowRuntimeOperationalControls & {
  contextId?: string;
};

export type WorkflowStatsResult = WorkflowRuntimeOperationEnvelope & {
  statistics?: WorkflowExecutionStatistics;
  manifest?: WorkflowManifest;
};
