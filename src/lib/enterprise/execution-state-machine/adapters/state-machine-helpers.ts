/**
 * Helpers internos da Execution State Machine (EPC-24 Sprint 04).
 *
 * Somente criação / transição estrutural / metadados in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras de negócio. Sem execução de etapas.
 */
import {
  createHistoryId,
  createStateId,
  createTransitionId,
  createTransitionRuleId,
} from "../ports/identity";
import {
  EXECUTION_STATE_DEFINITIONS,
  STRUCTURAL_STATE_CAPABILITY,
  buildStructuralTransitionRules,
  getExecutionStateDefinition,
  isStructuralTransitionAllowed,
  type ExecutionLifecycle,
  type ExecutionState,
  type ExecutionStateHistory,
  type ExecutionStateMetadata,
  type ExecutionStateTransition,
  type ExecutionStatus,
} from "../ports/models";
import type {
  CreateStateMachineInput,
  ExecutionStateMachinePortCapabilities,
  TransitionInput,
} from "../ports/types";
import type { ExecutionStateMachineStore } from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionStateMachinePortCapabilities, "provider"> {
  return {
    adapterId,
    supportsCreateStateMachine: true,
    supportsTransition: true,
    supportsGetCurrentState: true,
    supportsGetHistory: true,
    supportsHealth: true,
    supportsCapabilities: true,
    structuralLifecycleOnly: true,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsTissRules: false,
    implementsMapping: false,
    implementsValidation: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpWorkersQueues: false,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
  };
}

export function buildLifecycle(
  input: CreateStateMachineInput,
  stateMachineId: string,
  stamp: string,
  factories?: {
    createStateId?: () => string;
    createHistoryId?: () => string;
    createTransitionRuleId?: () => string;
  },
): ExecutionLifecycle {
  const stateId = factories?.createStateId ?? createStateId;
  const histId = factories?.createHistoryId ?? createHistoryId;
  const ruleId = factories?.createTransitionRuleId ?? createTransitionRuleId;

  const initialStatus: ExecutionStatus = input.initialStatus ?? "Created";
  const definition = getExecutionStateDefinition(initialStatus);

  const metadata: ExecutionStateMetadata = {
    kind: "execution-state-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    startedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  const currentState: ExecutionState = {
    kind: "execution-state",
    id: stateId(),
    stateMachineId,
    executionId: input.executionId,
    status: initialStatus,
    definition,
    metadata,
    occurredAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
  };

  const history: ExecutionStateHistory = {
    kind: "execution-state-history",
    id: histId(),
    stateMachineId,
    executionId: input.executionId,
    transitions: [],
    entryCount: 0,
    createdAt: stamp,
    updatedAt: stamp,
  };

  return {
    kind: "execution-lifecycle",
    id: stateMachineId,
    stateMachineId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    currentState,
    history,
    metadata,
    capability: STRUCTURAL_STATE_CAPABILITY,
    definitions: EXECUTION_STATE_DEFINITIONS,
    transitionRules: buildStructuralTransitionRules(ruleId),
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
  };
}

export function applyTransition(
  lifecycle: ExecutionLifecycle,
  input: TransitionInput,
  stamp: string,
  factories?: {
    createStateId?: () => string;
    createTransitionId?: () => string;
  },
):
  | { ok: true; lifecycle: ExecutionLifecycle; transition: ExecutionStateTransition }
  | { ok: false; code: string; message: string; from: ExecutionStatus; to: ExecutionStatus } {
  const from = lifecycle.currentState.status;
  const to = input.to;

  if (from === to) {
    return {
      ok: false,
      code: "same_state",
      message: `already in structural state ${from}`,
      from,
      to,
    };
  }

  if (!isStructuralTransitionAllowed(from, to)) {
    return {
      ok: false,
      code: "transition_not_allowed",
      message: `structural transition ${from} → ${to} is not allowed`,
      from,
      to,
    };
  }

  const stateId = factories?.createStateId ?? createStateId;
  const transitionId = factories?.createTransitionId ?? createTransitionId;
  const definition = getExecutionStateDefinition(to);

  const transition: ExecutionStateTransition = {
    kind: "execution-state-transition",
    id: transitionId(),
    stateMachineId: lifecycle.stateMachineId,
    executionId: lifecycle.executionId,
    from,
    to,
    occurredAt: stamp,
    reason: input.reason,
    notes: input.notes ?? `Structural transition ${from} → ${to} — no engines invoked`,
    attributes: input.attributes,
  };

  const metadata: ExecutionStateMetadata = {
    ...lifecycle.metadata,
    updatedAt: stamp,
    finishedAt:
      to === "Completed" || to === "Cancelled" || to === "Failed"
        ? stamp
        : lifecycle.metadata.finishedAt,
  };

  const currentState: ExecutionState = {
    kind: "execution-state",
    id: stateId(),
    stateMachineId: lifecycle.stateMachineId,
    executionId: lifecycle.executionId,
    status: to,
    definition,
    metadata,
    occurredAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
  };

  const transitions = [...lifecycle.history.transitions, transition];
  const history: ExecutionStateHistory = {
    ...lifecycle.history,
    transitions,
    entryCount: transitions.length,
    updatedAt: stamp,
  };

  return {
    ok: true,
    transition,
    lifecycle: {
      ...lifecycle,
      currentState,
      history,
      metadata,
      enginesInvoked: false,
      stagesExecuted: false,
      processingPerformed: false,
    },
  };
}

export function persistLifecycle(
  store: ExecutionStateMachineStore,
  lifecycle: ExecutionLifecycle,
): void {
  store.setLifecycle({ lifecycle });
}
