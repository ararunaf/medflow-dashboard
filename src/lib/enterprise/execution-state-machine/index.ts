/**
 * Enterprise Execution State Machine Foundation — Ports & Adapters (EPC-24 Sprint 04).
 *
 * Fluxo oficial:
 *   Application → ExecutionStateMachinePort → ExecutionStateMachineAdapter
 *     → ExecutionStateMachineStore → ExecutionStateMachineFactory
 *     → ExecutionStateMachineProvider
 *
 * A State Machine NÃO executa OCR, IA, Mapping ou regras.
 * Apenas representa e controla o ciclo de vida estrutural da execução.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution State Machine
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 04: ciclo de vida estrutural apenas.
 * Nenhuma etapa é executada. Nenhuma Engine é invocada.
 */
export type {
  CreateStateMachineInput,
  CreateStateMachineResult,
  ExecutionLifecycle,
  ExecutionState,
  ExecutionStateCapabilities,
  ExecutionStateDefinition,
  ExecutionStateHistory,
  ExecutionStateMachineHealth,
  ExecutionStateMachinePort,
  ExecutionStateMachinePortCapabilities,
  ExecutionStateMachineProviderId,
  ExecutionStateMachineProviderOptions,
  ExecutionStateMetadata,
  ExecutionStateRecordKind,
  ExecutionStateTransition,
  ExecutionStatus,
  ExecutionTransitionResult,
  ExecutionTransitionRule,
  GetCurrentStateInput,
  GetCurrentStateResult,
  GetHistoryInput,
  GetHistoryResult,
  TerminalExecutionStatus,
  TransitionInput,
  TransitionResult,
} from "./ports";

export {
  EXECUTION_STATE_DEFINITIONS,
  STRUCTURAL_STATE_CAPABILITY,
  STRUCTURAL_TRANSITION_EDGES,
  buildStructuralTransitionRules,
  createHistoryId,
  createStateId,
  createStateMachineId,
  createTransitionId,
  createTransitionRuleId,
  getExecutionStateDefinition,
  isStructuralTransitionAllowed,
  isTerminalExecutionStatus,
  resetAllExecutionStateMachineIdSequences,
  resetHistoryIdSequence,
  resetStateIdSequence,
  resetStateMachineIdSequence,
  resetTransitionIdSequence,
  resetTransitionRuleIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_STATE_MACHINE_ADAPTER_ID,
  DEFAULT_EXECUTION_STATE_MACHINE_VERSION,
  DefaultExecutionStateMachineAdapter,
  MOCK_EXECUTION_STATE_MACHINE_ADAPTER_ID,
  MOCK_EXECUTION_STATE_MACHINE_VERSION,
  MockExecutionStateMachineAdapter,
  type DefaultExecutionStateMachineRuntime,
  type MockExecutionStateMachineAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_STATE_MACHINE_STORE_ID,
  DefaultExecutionStateMachineStore,
  type DefaultExecutionStateMachineStoreOptions,
  type ExecutionStateMachineStore,
  type StoredExecutionLifecycle,
} from "./store";

export {
  ExecutionStateMachineFactory,
  createExecutionStateMachineFactory,
  type ExecutionStateMachineFactoryOptions,
} from "./factory";

export { createExecutionStateMachinePort } from "./providers";

export {
  getExecutionStateMachineHealthSummary,
  type ExecutionStateMachineHealthSummary,
} from "./demo";
