/**
 * Modelo de execução estrutural — EPC-05.
 *
 * Workflow → Stages → Transitions → Conditions → Actions → Events
 *
 * Helpers de inspeção/resolução sem lógica de negócio.
 */
import type {
  WorkflowDefinition,
  WorkflowStage,
  WorkflowStageId,
  WorkflowTransition,
  WorkflowTransitionId,
} from "./types";

/** Localiza Stage inicial (flag initial ou primeiro stage). */
export function getInitialStage(workflow: WorkflowDefinition): WorkflowStage | undefined {
  const marked = workflow.stages.find((s) => s.initial === true);
  if (marked) return marked;
  return workflow.stages[0];
}

export function getStage(
  workflow: WorkflowDefinition,
  stageId: WorkflowStageId,
): WorkflowStage | undefined {
  return workflow.stages.find((s) => s.id === stageId);
}

export function getTransition(
  workflow: WorkflowDefinition,
  transitionId: WorkflowTransitionId,
): WorkflowTransition | undefined {
  return workflow.transitions.find((t) => t.id === transitionId);
}

/** Transitions que partem de um Stage. */
export function listOutgoingTransitions(
  workflow: WorkflowDefinition,
  fromStageId: WorkflowStageId,
): readonly WorkflowTransition[] {
  return workflow.transitions.filter((t) => t.fromStageId === fromStageId);
}

/** Resolve transition por id ou por destino a partir do stage atual. */
export function resolveTransition(
  workflow: WorkflowDefinition,
  fromStageId: WorkflowStageId,
  options: { transitionId?: WorkflowTransitionId; toStageId?: WorkflowStageId },
): WorkflowTransition | undefined {
  if (options.transitionId) {
    const byId = getTransition(workflow, options.transitionId);
    if (!byId) return undefined;
    if (byId.fromStageId !== fromStageId) return undefined;
    return byId;
  }
  if (options.toStageId) {
    return listOutgoingTransitions(workflow, fromStageId).find(
      (t) => t.toStageId === options.toStageId,
    );
  }
  return undefined;
}

export function isTerminalStage(stage: WorkflowStage | undefined): boolean {
  return stage?.terminal === true;
}

/** Contagem estrutural do grafo (para health / demo). */
export function describeWorkflowGraph(workflow: WorkflowDefinition): {
  stageCount: number;
  transitionCount: number;
  eventCount: number;
  hasInitial: boolean;
} {
  return {
    stageCount: workflow.stages.length,
    transitionCount: workflow.transitions.length,
    eventCount: workflow.events?.length ?? 0,
    hasInitial: workflow.stages.some((s) => s.initial === true) || workflow.stages.length > 0,
  };
}
