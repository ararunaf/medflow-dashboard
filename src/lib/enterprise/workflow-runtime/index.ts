/**
 * Enterprise Corporate Workflow Runtime — C-10 / ECS-01.
 *
 * Fluxo estrutural oficial (C-10):
 *   Produto → Enterprise Runtime → WorkflowRuntimePort
 *     → DefaultWorkflowRuntimeAdapter / EnterpriseWorkflowRuntimeAdapter /
 *       MockWorkflowRuntimeAdapter
 *     → InMemoryWorkflowRuntimeStore → WorkflowManifest /
 *       WorkflowExecution / WorkflowExecutionResult / WorkflowStateMachine
 *
 * C-10: infraestrutura canônica de Workflow Runtime Foundation.
 *
 * WORKFLOW IS PURE ORCHESTRATION (Regra Permanente nº 18): o Workflow Runtime
 * exclusivamente orquestra o envelope estrutural — nunca valida XML, nunca
 * reconcilia, nunca autoriza, nunca gera SOAP, nunca fala com operadoras,
 * nunca processa lotes, nunca roda IA, e nunca implementa regras de domínio.
 *
 * Sem workflow funcional. Sem BPM. Sem decisão automática. Sem execução de
 * runtime. Sem filas. Sem workers. Sem scheduler. Sem XML. Sem SOAP.
 * Sem banco. Sem APIs. Sem processamento assíncrono funcional.
 *
 * Contratos oficiais:
 *   WorkflowContext · WorkflowManifest · WorkflowExecution ·
 *   WorkflowExecutionResult · WorkflowExecutionStatistics ·
 *   WorkflowExecutionMetadata · WorkflowExecutionPolicy · WorkflowState ·
 *   WorkflowStateMachine · WorkflowHealth
 *   + envelope RULE_04 (metadados estruturais apenas).
 *
 * Dependências ReconciliationRuntime/ReturnRuntime/AuthorizationRuntime/
 * OperatorRuntime/ProtocolRuntime/BatchRuntime/SOAPRuntime/XMLRuntime/
 * XMLValidationRuntime/AuditRuntime preparadas — sem consumo funcional
 * (shape-check apenas em health()).
 */
export type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  CanonicalReconciliationResult,
  GetWorkflowExecutionInput,
  GetWorkflowExecutionResult,
  ListWorkflowExecutionsInput,
  ListWorkflowExecutionsResult,
  OperatorCapabilityProfile,
  PrepareWorkflowExecutionInput,
  PrepareWorkflowExecutionResult,
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
  WorkflowRuntimeCapabilities,
  WorkflowRuntimeEngineCapabilities,
  WorkflowRuntimeEnterpriseDeps,
  WorkflowRuntimeHealth,
  WorkflowRuntimeInfo,
  WorkflowRuntimeObservabilityEnvelope,
  WorkflowRuntimeOperationalControls,
  WorkflowRuntimeOperationEnvelope,
  WorkflowRuntimeOptions,
  WorkflowRuntimePort,
  WorkflowRuntimePortCapabilities,
  WorkflowRuntimeProviderId,
  WorkflowRuntimeProviderMetadata,
  WorkflowRuntimeProviderOptions,
  WorkflowRuntimeRegistration,
  WorkflowRuntimeStatus,
  WorkflowRuntimeStructuredLog,
  WorkflowRuntimeTelemetry,
  WorkflowSoapEnvelopeRef,
  WorkflowState,
  WorkflowStateMachine,
  WorkflowStatsInput,
  WorkflowStatsResult,
  WorkflowXmlDocumentRef,
  WorkflowXmlValidationRef,
} from "./ports";

export {
  WORKFLOW_CANONICAL_STATES,
  WORKFLOW_RUNTIME_IDENTITY,
  DEFAULT_MOCK_WORKFLOW_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_WORKFLOW_RUNTIME_CAPABILITIES,
  DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
  createEmptyWorkflowCapabilities,
  createEmptyWorkflowExecution,
  createEmptyWorkflowExecutionPolicy,
  createEmptyWorkflowExecutionResult,
  createEmptyWorkflowManifest,
  createEmptyWorkflowStateMachine,
  createWorkflowContextId,
  createWorkflowExecutionId,
  createWorkflowExecutionResultId,
  createWorkflowManifestId,
  createWorkflowRuntimeRequestId,
  defineWorkflowRuntimeCapabilities,
  defineWorkflowRuntimeEngineCapabilities,
  emptyWorkflowRuntimeCapabilities,
  emptyWorkflowRuntimeEngineCapabilities,
  resetAllWorkflowRuntimeIdSequences,
  resetWorkflowRuntimeIdSequences,
  toCanonicalWorkflowCapabilities,
  toWorkflowCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_WORKFLOW_RUNTIME_VERSION,
  DEFAULT_WORKFLOW_RUNTIME_ADAPTER_ID,
  DEFAULT_WORKFLOW_RUNTIME_VERSION,
  DefaultWorkflowRuntimeAdapter,
  EnterpriseWorkflowRuntimeAdapter,
  MOCK_WORKFLOW_RUNTIME_ADAPTER_ID,
  MockWorkflowRuntimeAdapter,
  type DefaultWorkflowRuntimeAdapterOptions,
  type MockWorkflowRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_WORKFLOW_RUNTIME_STORE_ID,
  InMemoryWorkflowRuntimeStore,
  type InMemoryWorkflowRuntimeStoreOptions,
  type StoredWorkflowContext,
  type StoredWorkflowExecution,
  type StoredWorkflowExecutionResult,
  type StoredWorkflowManifest,
  type WorkflowRuntimeStore,
} from "./store";

export {
  WorkflowRuntimeFactory,
  createWorkflowRuntimeFactory,
  type WorkflowRuntimeFactoryOptions,
} from "./factory/workflow-runtime-factory";

export {
  BUILTIN_WORKFLOW_RUNTIME_PROVIDER_COUNT,
  WorkflowRuntimeRegistry,
  createDefaultWorkflowRuntimeRegistry,
  type WorkflowRuntimeRegistrySnapshot,
} from "./registry/workflow-runtime-registry";

export {
  WorkflowRuntimeProvider,
  createWorkflowRuntimePort,
  getWorkflowRuntimeFactory,
  getWorkflowRuntimePort,
} from "./providers";

export { getWorkflowRuntimeHealthSummary, type WorkflowRuntimeHealthSummary } from "./demo";
