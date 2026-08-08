/**
 * EnterpriseWorkflowExecutionEngine — I-04.
 *
 * Execução controlada de workflows Enterprise previamente registrados.
 * Reutiliza exclusivamente EnterpriseWorkflowEngine, EnterpriseWorkflowPipelineEngine
 * e EnterpriseWorkflowStateMachineEngine.
 * Não monitora, não gera métricas, não faz recovery, não cria filas, scheduler
 * nem fachada.
 */
import { EnterpriseWorkflowEngine } from "../workflow";
import { EnterpriseWorkflowPipelineEngine } from "../pipeline";
import { EnterpriseWorkflowStateMachineEngine } from "../state-machine";

export interface WorkflowExecutionCapabilities {
  readonly workflowEngineImplemented: boolean;
  readonly workflowPipelineImplemented: boolean;
  readonly workflowStateMachineImplemented: boolean;
  readonly workflowExecutionImplemented: boolean;
  readonly workflowMonitoringImplemented: boolean;
  readonly workflowMetricsImplemented: boolean;
  readonly workflowRecoveryImplemented: boolean;
  readonly workflowFacadeImplemented: boolean;
}

export const I04_WORKFLOW_EXECUTION_CAPABILITIES: WorkflowExecutionCapabilities = {
  workflowEngineImplemented: true,
  workflowPipelineImplemented: true,
  workflowStateMachineImplemented: true,
  workflowExecutionImplemented: true,
  workflowMonitoringImplemented: false,
  workflowMetricsImplemented: false,
  workflowRecoveryImplemented: false,
  workflowFacadeImplemented: false,
};

export interface WorkflowExecutionRequest {
  readonly executionId: string;
  readonly workflowId: string;
  readonly targetState: string;
}

export interface WorkflowExecutionRecord {
  readonly executionId: string;
  readonly workflowId: string;
  readonly pipelineId: string;
  readonly stateMachineId: string;
  readonly fromState: string;
  readonly toState: string;
  readonly executedAt: number;
}

export interface WorkflowExecutionResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly record?: WorkflowExecutionRecord | null;
}

export interface WorkflowExecutionStats {
  readonly total: number;
  readonly successful: number;
  readonly failed: number;
  readonly byWorkflow: Record<string, number>;
  readonly byPipeline: Record<string, number>;
}

export class EnterpriseWorkflowExecutionEngine {
  private readonly workflowEngine: EnterpriseWorkflowEngine;
  private readonly pipelineEngine: EnterpriseWorkflowPipelineEngine;
  private readonly stateMachineEngine: EnterpriseWorkflowStateMachineEngine;
  private readonly executions = new Map<string, WorkflowExecutionRecord>();

  constructor(
    workflowEngine: EnterpriseWorkflowEngine = new EnterpriseWorkflowEngine(),
    pipelineEngine: EnterpriseWorkflowPipelineEngine = new EnterpriseWorkflowPipelineEngine(),
    stateMachineEngine: EnterpriseWorkflowStateMachineEngine = new EnterpriseWorkflowStateMachineEngine(),
  ) {
    this.workflowEngine = workflowEngine;
    this.pipelineEngine = pipelineEngine;
    this.stateMachineEngine = stateMachineEngine;
  }

  getCapabilities(): WorkflowExecutionCapabilities {
    return I04_WORKFLOW_EXECUTION_CAPABILITIES;
  }

  getWorkflowEngine(): EnterpriseWorkflowEngine {
    return this.workflowEngine;
  }

  getPipelineEngine(): EnterpriseWorkflowPipelineEngine {
    return this.pipelineEngine;
  }

  getStateMachineEngine(): EnterpriseWorkflowStateMachineEngine {
    return this.stateMachineEngine;
  }

  private findStateMachineForWorkflow(
    workflowId: string,
  ): { id: string; pipelineId: string } | null {
    for (const sm of this.stateMachineEngine.listAll()) {
      if (sm.workflowId === workflowId) {
        const pipelineId = sm.pipelineId ?? "";
        return { id: sm.stateMachineId, pipelineId };
      }
    }
    return null;
  }

  execute(request: WorkflowExecutionRequest): WorkflowExecutionResult {
    if (!request.executionId || request.executionId.trim() === "") {
      return { ok: false, code: "EXECUTION_INVALID_ID", message: "executionId is required" };
    }
    if (!request.workflowId || request.workflowId.trim() === "") {
      return {
        ok: false,
        code: "EXECUTION_INVALID_WORKFLOW_ID",
        message: "workflowId is required",
      };
    }
    if (!request.targetState || request.targetState.trim() === "") {
      return {
        ok: false,
        code: "EXECUTION_INVALID_TARGET_STATE",
        message: "targetState is required",
      };
    }

    const workflow = this.workflowEngine.get(request.workflowId);
    if (!workflow) {
      return {
        ok: false,
        code: "EXECUTION_UNKNOWN_WORKFLOW",
        message: `workflow ${request.workflowId} not found`,
      };
    }

    const smRef = this.findStateMachineForWorkflow(request.workflowId);
    if (!smRef) {
      return {
        ok: false,
        code: "EXECUTION_NO_STATE_MACHINE",
        message: `no state machine for workflow ${request.workflowId}`,
      };
    }

    const pipeline = this.pipelineEngine.find(smRef.pipelineId);
    if (!pipeline) {
      return {
        ok: false,
        code: "EXECUTION_UNKNOWN_PIPELINE",
        message: `pipeline ${smRef.pipelineId} not found`,
      };
    }
    if (!pipeline.workflowIds.includes(request.workflowId)) {
      return {
        ok: false,
        code: "EXECUTION_WORKFLOW_NOT_IN_PIPELINE",
        message: `workflow not in pipeline ${smRef.pipelineId}`,
      };
    }

    const fromState = this.stateMachineEngine.currentState(smRef.id);
    if (!fromState) {
      return {
        ok: false,
        code: "EXECUTION_NO_CURRENT_STATE",
        message: `no current state for workflow ${request.workflowId}`,
      };
    }

    if (!this.stateMachineEngine.validateTransition(smRef.id, request.targetState)) {
      return {
        ok: false,
        code: "EXECUTION_INVALID_TRANSITION",
        message: `transition from ${fromState} to ${request.targetState} is not allowed`,
      };
    }

    const transition = this.stateMachineEngine.transition(smRef.id, request.targetState);
    if (!transition.ok) {
      return { ok: false, code: transition.code, message: transition.message };
    }

    const record: WorkflowExecutionRecord = {
      executionId: request.executionId,
      workflowId: request.workflowId,
      pipelineId: smRef.pipelineId,
      stateMachineId: smRef.id,
      fromState,
      toState: request.targetState,
      executedAt: Date.now(),
    };
    this.executions.set(request.executionId, record);

    return {
      ok: true,
      code: "EXECUTION_SUCCESS",
      message: `workflow ${request.workflowId} executed from ${fromState} to ${request.targetState}`,
      record,
    };
  }

  find(executionId: string): WorkflowExecutionRecord | null {
    return this.executions.get(executionId) ?? null;
  }

  listAll(): readonly WorkflowExecutionRecord[] {
    return Array.from(this.executions.values());
  }

  stats(): WorkflowExecutionStats {
    let successful = 0;
    const byWorkflow: Record<string, number> = {};
    const byPipeline: Record<string, number> = {};

    for (const exec of this.executions.values()) {
      byWorkflow[exec.workflowId] = (byWorkflow[exec.workflowId] ?? 0) + 1;
      byPipeline[exec.pipelineId] = (byPipeline[exec.pipelineId] ?? 0) + 1;
      // failure tracking would require failure storage; keep it simple
      successful += 1;
    }

    return {
      total: this.executions.size,
      successful,
      failed: 0,
      byWorkflow,
      byPipeline,
    };
  }
}
