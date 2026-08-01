/**
 * Ports — Execution State Machine Foundation (EPC-24 Sprint 04).
 */
export type { ExecutionStateMachinePort } from "./execution-state-machine-port";

export type {
  CreateStateMachineInput,
  CreateStateMachineResult,
  ExecutionLifecycle,
  ExecutionState,
  ExecutionStateCapabilities,
  ExecutionStateDefinition,
  ExecutionStateHistory,
  ExecutionStateMachineHealth,
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
} from "./types";

export {
  EXECUTION_STATE_DEFINITIONS,
  STRUCTURAL_STATE_CAPABILITY,
  STRUCTURAL_TRANSITION_EDGES,
  buildStructuralTransitionRules,
  getExecutionStateDefinition,
  isStructuralTransitionAllowed,
  isTerminalExecutionStatus,
} from "./models";

export {
  createHistoryId,
  createStateId,
  createStateMachineId,
  createTransitionId,
  createTransitionRuleId,
  resetAllExecutionStateMachineIdSequences,
  resetHistoryIdSequence,
  resetStateIdSequence,
  resetStateMachineIdSequence,
  resetTransitionIdSequence,
  resetTransitionRuleIdSequence,
} from "./identity";
