/**
 * Enterprise Workflow Engine — Ports & Adapters (EPC-05).
 *
 * Fluxo oficial:
 *   Application → WorkflowPort → WorkflowAdapter
 *     → Workflow Store → Workflow Provider
 *
 * Domain/Application NÃO devem importar conceitos clínicos, TISS, OCR, IA,
 * Authorization, Auditoria, Rule Engine ou Persistence de produto.
 *
 * Conceitos nativos únicos:
 * Workflow | Stage | Transition | State | Action | Condition | Event |
 * Trigger | Result | Status | Timeout | History | Checkpoint
 *
 * Papel exclusivo: orquestrar estados e transições.
 */
export type {
  AdvanceWorkflowInput,
  AdvanceWorkflowResult,
  CancelWorkflowInput,
  CancelWorkflowResult,
  GetStateInput,
  GetStateResult,
  GetWorkflowInput,
  GetWorkflowResult,
  ListWorkflowsInput,
  ListWorkflowsResult,
  RegisterWorkflowInput,
  RegisterWorkflowResult,
  RollbackWorkflowInput,
  RollbackWorkflowResult,
  StartWorkflowInput,
  StartWorkflowResult,
  WorkflowAction,
  WorkflowActionKind,
  WorkflowCapabilities,
  WorkflowCheckpoint,
  WorkflowCheckpointId,
  WorkflowCondition,
  WorkflowConditionKind,
  WorkflowDefinition,
  WorkflowEvent,
  WorkflowHealth,
  WorkflowHistoryEntry,
  WorkflowId,
  WorkflowInstanceId,
  WorkflowMetadataRef,
  WorkflowName,
  WorkflowNamespace,
  WorkflowPort,
  WorkflowProviderId,
  WorkflowProviderOptions,
  WorkflowResult,
  WorkflowStage,
  WorkflowStageId,
  WorkflowState,
  WorkflowStatus,
  WorkflowTag,
  WorkflowTimeout,
  WorkflowTransition,
  WorkflowTransitionId,
  WorkflowTrigger,
  WorkflowTriggerKind,
} from "./ports";

export {
  WORKFLOW_ACTION_KINDS,
  WORKFLOW_CONDITION_KINDS,
  WORKFLOW_STATUSES,
  alwaysCondition,
  appendCheckpoint,
  appendHistory,
  createCheckpoint,
  createHistoryEntry,
  defineCondition,
  describeWorkflowGraph,
  evaluateConditionStructurally,
  evaluateConditionsStructurally,
  eventCondition,
  expressionCondition,
  findCheckpoint,
  getInitialStage,
  getStage,
  getTransition,
  isKnownConditionKind,
  isTerminalStage,
  listOutgoingTransitions,
  neverCondition,
  nowIso,
  resolveTransition,
} from "./ports";

export {
  DEFAULT_WORKFLOW_ADAPTER_ID,
  DefaultWorkflowAdapter,
  MockWorkflowAdapter,
  type DefaultWorkflowRuntime,
  type MockWorkflowAdapterOptions,
} from "./adapters";

export {
  DEFAULT_WORKFLOW_STORE_ID,
  DefaultWorkflowStore,
  type DefaultWorkflowStoreOptions,
  type StoredWorkflowDefinition,
  type StoredWorkflowState,
  type WorkflowStore,
} from "./store";

export { createWorkflowPort } from "./providers";

export { getWorkflowHealthSummary, type WorkflowHealthSummary } from "./demo";
