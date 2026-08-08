/**
 * EnterpriseWorkflowStateMachineEngine — I-03.
 *
 * Definição, registro, validação e transição de estados de workflows Enterprise.
 * Reutiliza exclusivamente EnterpriseWorkflowEngine e EnterpriseWorkflowPipelineEngine.
 * Não executa workflows, não monitora, não gera métricas, não faz recovery e
 * não cria fachada.
 */
import { EnterpriseWorkflowEngine } from "../workflow";
import { EnterpriseWorkflowPipelineEngine } from "../pipeline";

export interface WorkflowStateMachineCapabilities {
  readonly workflowEngineImplemented: boolean;
  readonly workflowPipelineImplemented: boolean;
  readonly workflowStateMachineImplemented: boolean;
  readonly workflowExecutionImplemented: boolean;
  readonly workflowMonitoringImplemented: boolean;
  readonly workflowMetricsImplemented: boolean;
  readonly workflowRecoveryImplemented: boolean;
  readonly workflowFacadeImplemented: boolean;
}

export const I03_WORKFLOW_STATE_MACHINE_CAPABILITIES: WorkflowStateMachineCapabilities = {
  workflowEngineImplemented: true,
  workflowPipelineImplemented: true,
  workflowStateMachineImplemented: true,
  workflowExecutionImplemented: false,
  workflowMonitoringImplemented: false,
  workflowMetricsImplemented: false,
  workflowRecoveryImplemented: false,
  workflowFacadeImplemented: false,
};

export interface WorkflowState {
  readonly stateId: string;
  readonly name: string;
}

export interface WorkflowTransition {
  readonly from: string;
  readonly to: string;
  readonly transitionId: string;
}

export interface WorkflowStateMachineDefinition {
  readonly stateMachineId: string;
  readonly workflowId?: string;
  readonly pipelineId?: string;
  readonly states: WorkflowState[];
  readonly transitions: WorkflowTransition[];
  readonly initialStateId: string;
}

export interface WorkflowStateMachineResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stateMachine?: WorkflowStateMachineDefinition | null;
}

export interface WorkflowStateMachineStats {
  readonly total: number;
  readonly totalStates: number;
  readonly totalTransitions: number;
  readonly byPipeline: Record<string, number>;
  readonly byWorkflow: Record<string, number>;
}

export class EnterpriseWorkflowStateMachineEngine {
  private readonly workflowEngine: EnterpriseWorkflowEngine;
  private readonly pipelineEngine: EnterpriseWorkflowPipelineEngine;
  private readonly stateMachines = new Map<string, WorkflowStateMachineDefinition>();
  private readonly currentStates = new Map<string, string>();

  constructor(
    workflowEngine: EnterpriseWorkflowEngine = new EnterpriseWorkflowEngine(),
    pipelineEngine: EnterpriseWorkflowPipelineEngine = new EnterpriseWorkflowPipelineEngine(),
  ) {
    this.workflowEngine = workflowEngine;
    this.pipelineEngine = pipelineEngine;
  }

  getCapabilities(): WorkflowStateMachineCapabilities {
    return I03_WORKFLOW_STATE_MACHINE_CAPABILITIES;
  }

  getWorkflowEngine(): EnterpriseWorkflowEngine {
    return this.workflowEngine;
  }

  getPipelineEngine(): EnterpriseWorkflowPipelineEngine {
    return this.pipelineEngine;
  }

  register(stateMachine: WorkflowStateMachineDefinition): WorkflowStateMachineResult {
    if (!stateMachine.stateMachineId || stateMachine.stateMachineId.trim() === "") {
      return { ok: false, code: "STATE_MACHINE_INVALID_ID", message: "stateMachineId is required" };
    }
    if (this.stateMachines.has(stateMachine.stateMachineId)) {
      return {
        ok: false,
        code: "STATE_MACHINE_ALREADY_EXISTS",
        message: `state machine ${stateMachine.stateMachineId} already exists`,
      };
    }
    if (stateMachine.states.length === 0) {
      return {
        ok: false,
        code: "STATE_MACHINE_EMPTY",
        message: "state machine must have at least one state",
      };
    }
    const stateIds = new Set(stateMachine.states.map((s) => s.stateId));
    if (stateIds.size !== stateMachine.states.length) {
      return { ok: false, code: "STATE_MACHINE_DUPLICATE_STATE", message: "duplicate state id" };
    }
    if (!stateIds.has(stateMachine.initialStateId)) {
      return {
        ok: false,
        code: "STATE_MACHINE_INVALID_INITIAL",
        message: "initial state not found",
      };
    }
    for (const transition of stateMachine.transitions) {
      if (!stateIds.has(transition.from) || !stateIds.has(transition.to)) {
        return {
          ok: false,
          code: "STATE_MACHINE_INVALID_TRANSITION",
          message: `transition ${transition.transitionId} references unknown states`,
        };
      }
    }
    if (stateMachine.workflowId && !this.workflowEngine.get(stateMachine.workflowId)) {
      return {
        ok: false,
        code: "STATE_MACHINE_UNKNOWN_WORKFLOW",
        message: `workflow ${stateMachine.workflowId} not found`,
      };
    }
    if (stateMachine.pipelineId && !this.pipelineEngine.find(stateMachine.pipelineId)) {
      return {
        ok: false,
        code: "STATE_MACHINE_UNKNOWN_PIPELINE",
        message: `pipeline ${stateMachine.pipelineId} not found`,
      };
    }
    this.stateMachines.set(stateMachine.stateMachineId, stateMachine);
    this.currentStates.set(stateMachine.stateMachineId, stateMachine.initialStateId);
    return {
      ok: true,
      code: "STATE_MACHINE_REGISTERED",
      message: "state machine registered",
      stateMachine,
    };
  }

  find(stateMachineId: string): WorkflowStateMachineDefinition | null {
    return this.stateMachines.get(stateMachineId) ?? null;
  }

  listAll(): readonly WorkflowStateMachineDefinition[] {
    return Array.from(this.stateMachines.values());
  }

  listStates(stateMachineId: string): readonly WorkflowState[] | null {
    return this.stateMachines.get(stateMachineId)?.states ?? null;
  }

  listTransitions(stateMachineId: string): readonly WorkflowTransition[] | null {
    return this.stateMachines.get(stateMachineId)?.transitions ?? null;
  }

  currentState(stateMachineId: string): string | null {
    const sm = this.stateMachines.get(stateMachineId);
    if (!sm) return null;
    return this.currentStates.get(stateMachineId) ?? sm.initialStateId;
  }

  validateTransition(stateMachineId: string, toStateId: string): boolean {
    const sm = this.stateMachines.get(stateMachineId);
    if (!sm) return false;
    const current = this.currentStates.get(stateMachineId) ?? sm.initialStateId;
    const allowed = sm.transitions.filter((t) => t.from === current && t.to === toStateId);
    return allowed.length > 0;
  }

  transition(stateMachineId: string, toStateId: string): WorkflowStateMachineResult {
    if (!this.validateTransition(stateMachineId, toStateId)) {
      return {
        ok: false,
        code: "STATE_MACHINE_INVALID_TRANSITION",
        message: `transition to ${toStateId} is invalid`,
      };
    }
    const sm = this.stateMachines.get(stateMachineId);
    if (!sm) {
      return {
        ok: false,
        code: "STATE_MACHINE_NOT_FOUND",
        message: `state machine ${stateMachineId} not found`,
      };
    }
    this.currentStates.set(stateMachineId, toStateId);
    return {
      ok: true,
      code: "STATE_MACHINE_TRANSITIONED",
      message: `transitioned to ${toStateId}`,
      stateMachine: sm,
    };
  }

  stats(): WorkflowStateMachineStats {
    let totalStates = 0;
    let totalTransitions = 0;
    const byPipeline: Record<string, number> = {};
    const byWorkflow: Record<string, number> = {};
    for (const sm of this.stateMachines.values()) {
      totalStates += sm.states.length;
      totalTransitions += sm.transitions.length;
      if (sm.pipelineId) {
        byPipeline[sm.pipelineId] = (byPipeline[sm.pipelineId] ?? 0) + 1;
      }
      if (sm.workflowId) {
        byWorkflow[sm.workflowId] = (byWorkflow[sm.workflowId] ?? 0) + 1;
      }
    }
    return {
      total: this.stateMachines.size,
      totalStates,
      totalTransitions,
      byPipeline,
      byWorkflow,
    };
  }
}
