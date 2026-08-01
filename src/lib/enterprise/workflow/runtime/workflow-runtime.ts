/**
 * Runtime estrutural de execução — EPC-05.
 *
 * Operações puras sobre definição + estado.
 * Sem Rule Engine, sem side-effects de negócio, sem Persistence.
 */
import { evaluateConditionsStructurally } from "../ports/conditions";
import { getInitialStage, getStage, isTerminalStage, resolveTransition } from "../ports/execution";
import {
  appendCheckpoint,
  appendHistory,
  createCheckpoint,
  createHistoryEntry,
  findCheckpoint,
  nowIso,
} from "../ports/history";
import type {
  AdvanceWorkflowInput,
  AdvanceWorkflowResult,
  CancelWorkflowInput,
  CancelWorkflowResult,
  RollbackWorkflowInput,
  RollbackWorkflowResult,
  StartWorkflowInput,
  StartWorkflowResult,
  WorkflowDefinition,
  WorkflowState,
  WorkflowStatus,
} from "../ports/types";

let instanceSeq = 0;

function nextInstanceId(): string {
  instanceSeq += 1;
  return `wf-inst-${Date.now()}-${instanceSeq}`;
}

function mergeContext(
  base: Readonly<Record<string, unknown>> | undefined,
  patch: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> | undefined {
  if (!base && !patch) return undefined;
  return { ...(base ?? {}), ...(patch ?? {}) };
}

export function startWorkflowInstance(
  workflow: WorkflowDefinition,
  input: StartWorkflowInput,
): StartWorkflowResult {
  const initial = getInitialStage(workflow);
  if (!initial) {
    return { ok: false, code: "no_initial_stage", message: "workflow has no stages" };
  }

  const at = nowIso();
  const instanceId = input.instanceId ?? nextInstanceId();
  const status: WorkflowStatus = "active";
  const checkpoint = createCheckpoint({
    stageId: initial.id,
    status,
    label: "start",
  });
  const history = [
    createHistoryEntry({
      kind: "start",
      toStageId: initial.id,
      status,
      message: "workflow started",
      checkpointId: checkpoint.id,
    }),
    createHistoryEntry({
      kind: "checkpoint",
      toStageId: initial.id,
      status,
      checkpointId: checkpoint.id,
      message: "start checkpoint",
    }),
  ];

  const state: WorkflowState = {
    instanceId,
    workflowId: workflow.id,
    currentStageId: initial.id,
    status,
    startedAt: at,
    updatedAt: at,
    history,
    checkpoints: [checkpoint],
    context: input.context,
    metadataRef: input.metadataRef,
    tags: input.tags,
  };

  return { ok: true, state, message: "started", code: "started" };
}

export function advanceWorkflowInstance(
  workflow: WorkflowDefinition,
  state: WorkflowState,
  input: AdvanceWorkflowInput,
): AdvanceWorkflowResult {
  if (state.status === "cancelled" || state.status === "completed") {
    return {
      ok: false,
      code: "terminal_state",
      message: `cannot advance from status ${state.status}`,
      state,
    };
  }

  const transition = resolveTransition(workflow, state.currentStageId, {
    transitionId: input.transitionId,
    toStageId: input.toStageId,
  });

  if (!transition) {
    return {
      ok: false,
      code: "invalid_transition",
      message: "transition not found from current stage",
      state,
    };
  }

  const conditionsOk = evaluateConditionsStructurally(transition.conditions, {
    eventName: input.eventName,
  });
  if (!conditionsOk) {
    return {
      ok: false,
      code: "condition_failed",
      message: "structural conditions not satisfied",
      state,
    };
  }

  const target = getStage(workflow, transition.toStageId);
  if (!target) {
    return {
      ok: false,
      code: "unknown_stage",
      message: `target stage ${transition.toStageId} not found`,
      state,
    };
  }

  const at = nowIso();
  let checkpoints = state.checkpoints;
  let history = state.history;

  if (input.checkpoint) {
    const ckpt = createCheckpoint({
      stageId: state.currentStageId,
      status: state.status,
      label: input.checkpointLabel ?? "pre-advance",
    });
    checkpoints = appendCheckpoint(checkpoints, ckpt);
    history = appendHistory(
      history,
      createHistoryEntry({
        kind: "checkpoint",
        fromStageId: state.currentStageId,
        status: state.status,
        checkpointId: ckpt.id,
        message: ckpt.label,
      }),
    );
  }

  const nextStatus: WorkflowStatus = isTerminalStage(target) ? "completed" : "active";

  history = appendHistory(
    history,
    createHistoryEntry({
      kind: "advance",
      fromStageId: state.currentStageId,
      toStageId: target.id,
      transitionId: transition.id,
      status: nextStatus,
      eventName: input.eventName,
      message: transition.name,
    }),
  );

  // Actions estruturais: apenas registradas no history (sem side-effects de negócio).
  for (const action of transition.actions ?? []) {
    history = appendHistory(
      history,
      createHistoryEntry({
        kind: "action",
        fromStageId: state.currentStageId,
        toStageId: target.id,
        transitionId: transition.id,
        actionName: action.name ?? action.kind,
        status: nextStatus,
        message: `action:${action.kind}`,
        payload: action.payload,
      }),
    );
  }

  const next: WorkflowState = {
    ...state,
    currentStageId: target.id,
    status: nextStatus,
    updatedAt: at,
    history,
    checkpoints,
    context: mergeContext(state.context, input.context),
  };

  return { ok: true, state: next, message: "advanced", code: "advanced" };
}

export function rollbackWorkflowInstance(
  state: WorkflowState,
  input: RollbackWorkflowInput,
): RollbackWorkflowResult {
  if (state.status === "cancelled") {
    return {
      ok: false,
      code: "cancelled",
      message: "cannot rollback a cancelled instance",
      state,
    };
  }

  const checkpoint = findCheckpoint(state.checkpoints, input.checkpointId);
  if (!checkpoint) {
    return {
      ok: false,
      code: "checkpoint_not_found",
      message: "no checkpoint available for rollback",
      state,
    };
  }

  const at = nowIso();
  const history = appendHistory(
    state.history,
    createHistoryEntry({
      kind: "rollback",
      fromStageId: state.currentStageId,
      toStageId: checkpoint.stageId,
      checkpointId: checkpoint.id,
      status: "rolled_back",
      message: "rolled back to checkpoint",
    }),
  );

  // Restaura status do checkpoint; se terminal/completed, volta a active para permitir reexecução.
  let restoredStatus: WorkflowStatus = checkpoint.status;
  if (
    restoredStatus === "completed" ||
    restoredStatus === "rolled_back" ||
    restoredStatus === "cancelled"
  ) {
    restoredStatus = "active";
  }

  const next: WorkflowState = {
    ...state,
    currentStageId: checkpoint.stageId,
    status: restoredStatus,
    updatedAt: at,
    history,
  };

  return { ok: true, state: next, message: "rolled_back", code: "rolled_back" };
}

export function cancelWorkflowInstance(
  state: WorkflowState,
  input: CancelWorkflowInput,
): CancelWorkflowResult {
  if (state.status === "cancelled") {
    return { ok: true, state, message: "already cancelled", code: "already_cancelled" };
  }
  if (state.status === "completed") {
    return {
      ok: false,
      code: "completed",
      message: "cannot cancel a completed instance",
      state,
    };
  }

  const at = nowIso();
  const history = appendHistory(
    state.history,
    createHistoryEntry({
      kind: "cancel",
      fromStageId: state.currentStageId,
      status: "cancelled",
      message: input.message ?? "cancelled",
    }),
  );

  const next: WorkflowState = {
    ...state,
    status: "cancelled",
    updatedAt: at,
    history,
  };

  return { ok: true, state: next, message: "cancelled", code: "cancelled" };
}
