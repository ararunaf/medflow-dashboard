/**
 * EnterpriseWorkflowPipelineEngine — I-02.
 *
 * Modelagem, registro, organização e recuperação de pipelines de workflow Enterprise.
 * Reutiliza exclusivamente a EnterpriseWorkflowEngine (I-01).
 * Não executa workflows, não implementa state machine, não monitora, não faz recovery,
 * não implementa métricas e não implementa fachada.
 */
import { EnterpriseWorkflowEngine } from "../workflow";

export interface WorkflowPipelineCapabilities {
  readonly workflowEngineImplemented: boolean;
  readonly workflowPipelineImplemented: boolean;
  readonly workflowStateMachineImplemented: boolean;
  readonly workflowExecutionImplemented: boolean;
  readonly workflowMonitoringImplemented: boolean;
  readonly workflowMetricsImplemented: boolean;
  readonly workflowRecoveryImplemented: boolean;
  readonly workflowFacadeImplemented: boolean;
}

export const I02_WORKFLOW_PIPELINE_CAPABILITIES: WorkflowPipelineCapabilities = {
  workflowEngineImplemented: true,
  workflowPipelineImplemented: true,
  workflowStateMachineImplemented: false,
  workflowExecutionImplemented: false,
  workflowMonitoringImplemented: false,
  workflowMetricsImplemented: false,
  workflowRecoveryImplemented: false,
  workflowFacadeImplemented: false,
};

export interface WorkflowPipeline {
  readonly pipelineId: string;
  readonly name: string;
  readonly description?: string;
  readonly workflowIds: readonly string[];
  readonly stageOrder: readonly string[];
}

export interface WorkflowPipelineResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly pipeline?: WorkflowPipeline | null;
}

export interface WorkflowPipelineStats {
  readonly total: number;
  readonly totalWorkflowAssociations: number;
  readonly pipelinesPerWorkflow: Record<string, number>;
}

export class EnterpriseWorkflowPipelineEngine {
  private readonly workflowEngine: EnterpriseWorkflowEngine;
  private readonly pipelines = new Map<string, WorkflowPipeline>();

  constructor(workflowEngine: EnterpriseWorkflowEngine = new EnterpriseWorkflowEngine()) {
    this.workflowEngine = workflowEngine;
  }

  getCapabilities(): WorkflowPipelineCapabilities {
    return I02_WORKFLOW_PIPELINE_CAPABILITIES;
  }

  getWorkflowEngine(): EnterpriseWorkflowEngine {
    return this.workflowEngine;
  }

  register(
    pipeline: Omit<WorkflowPipeline, "pipelineId"> & { readonly pipelineId: string },
  ): WorkflowPipelineResult {
    if (!pipeline.pipelineId || pipeline.pipelineId.trim() === "") {
      return { ok: false, code: "PIPELINE_INVALID_ID", message: "pipelineId is required" };
    }
    if (!pipeline.name || pipeline.name.trim() === "") {
      return { ok: false, code: "PIPELINE_INVALID_NAME", message: "name is required" };
    }
    if (this.pipelines.has(pipeline.pipelineId)) {
      return {
        ok: false,
        code: "PIPELINE_ALREADY_EXISTS",
        message: `pipeline ${pipeline.pipelineId} already exists`,
      };
    }
    for (const workflowId of pipeline.workflowIds) {
      if (!this.workflowEngine.get(workflowId)) {
        return {
          ok: false,
          code: "PIPELINE_UNKNOWN_WORKFLOW",
          message: `workflow ${workflowId} not found`,
        };
      }
    }
    const created: WorkflowPipeline = { ...pipeline };
    this.pipelines.set(pipeline.pipelineId, created);
    return {
      ok: true,
      code: "PIPELINE_REGISTERED",
      message: "pipeline registered",
      pipeline: created,
    };
  }

  find(pipelineId: string): WorkflowPipeline | null {
    return this.pipelines.get(pipelineId) ?? null;
  }

  listAll(): readonly WorkflowPipeline[] {
    return Array.from(this.pipelines.values());
  }

  associate(pipelineId: string, workflowId: string): WorkflowPipelineResult {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      return { ok: false, code: "PIPELINE_NOT_FOUND", message: `pipeline ${pipelineId} not found` };
    }
    const workflow = this.workflowEngine.get(workflowId);
    if (!workflow) {
      return { ok: false, code: "WORKFLOW_NOT_FOUND", message: `workflow ${workflowId} not found` };
    }
    if (pipeline.workflowIds.includes(workflowId)) {
      return {
        ok: false,
        code: "PIPELINE_WORKFLOW_ALREADY_ASSOCIATED",
        message: `workflow ${workflowId} already associated`,
      };
    }
    const updated: WorkflowPipeline = {
      ...pipeline,
      workflowIds: [...pipeline.workflowIds, workflowId],
    };
    this.pipelines.set(pipelineId, updated);
    return {
      ok: true,
      code: "PIPELINE_WORKFLOW_ASSOCIATED",
      message: "workflow associated",
      pipeline: updated,
    };
  }

  stats(): WorkflowPipelineStats {
    let totalWorkflowAssociations = 0;
    const pipelinesPerWorkflow: Record<string, number> = {};
    for (const pipeline of this.pipelines.values()) {
      for (const workflowId of pipeline.workflowIds) {
        totalWorkflowAssociations += 1;
        pipelinesPerWorkflow[workflowId] = (pipelinesPerWorkflow[workflowId] ?? 0) + 1;
      }
    }
    return { total: this.pipelines.size, totalWorkflowAssociations, pipelinesPerWorkflow };
  }
}
