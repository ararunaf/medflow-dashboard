/**
 * EnterpriseWorkflowMonitoringEngine — I-05.
 *
 * Monitoramento de execuções de workflows Enterprise.
 * Reutiliza exclusivamente EnterpriseWorkflowEngine, EnterpriseWorkflowPipelineEngine,
 * EnterpriseWorkflowStateMachineEngine e EnterpriseWorkflowExecutionEngine.
 * Não implementa métricas avançadas, recovery, retry, scheduler, filas, eventos,
 * notificações nem fachada.
 */
import { EnterpriseWorkflowEngine } from "../workflow";
import { EnterpriseWorkflowPipelineEngine } from "../pipeline";
import { EnterpriseWorkflowStateMachineEngine } from "../state-machine";
import { EnterpriseWorkflowExecutionEngine } from "../execution";

export interface WorkflowMonitoringCapabilities {
  readonly workflowEngineImplemented: boolean;
  readonly workflowPipelineImplemented: boolean;
  readonly workflowStateMachineImplemented: boolean;
  readonly workflowExecutionImplemented: boolean;
  readonly workflowMonitoringImplemented: boolean;
  readonly workflowMetricsImplemented: boolean;
  readonly workflowRecoveryImplemented: boolean;
  readonly workflowFacadeImplemented: boolean;
}

export const I05_WORKFLOW_MONITORING_CAPABILITIES: WorkflowMonitoringCapabilities = {
  workflowEngineImplemented: true,
  workflowPipelineImplemented: true,
  workflowStateMachineImplemented: true,
  workflowExecutionImplemented: true,
  workflowMonitoringImplemented: true,
  workflowMetricsImplemented: false,
  workflowRecoveryImplemented: false,
  workflowFacadeImplemented: false,
};

export type WorkflowMonitoringStatus = "pending" | "running" | "completed" | "failed";

export interface WorkflowMonitoringRecord {
  readonly monitoringId: string;
  readonly executionId: string;
  readonly workflowId: string;
  readonly pipelineId: string;
  readonly status: WorkflowMonitoringStatus;
  readonly startedAt: number;
  readonly updatedAt: number;
}

export interface WorkflowMonitoringResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly record?: WorkflowMonitoringRecord | null;
}

export interface WorkflowMonitoringStats {
  readonly total: number;
  readonly byStatus: Record<WorkflowMonitoringStatus, number>;
  readonly byWorkflow: Record<string, number>;
  readonly byPipeline: Record<string, number>;
}

export class EnterpriseWorkflowMonitoringEngine {
  private readonly workflowEngine: EnterpriseWorkflowEngine;
  private readonly pipelineEngine: EnterpriseWorkflowPipelineEngine;
  private readonly stateMachineEngine: EnterpriseWorkflowStateMachineEngine;
  private readonly executionEngine: EnterpriseWorkflowExecutionEngine;
  private readonly monitorings = new Map<string, WorkflowMonitoringRecord>();

  constructor(
    workflowEngine: EnterpriseWorkflowEngine = new EnterpriseWorkflowEngine(),
    pipelineEngine: EnterpriseWorkflowPipelineEngine = new EnterpriseWorkflowPipelineEngine(),
    stateMachineEngine: EnterpriseWorkflowStateMachineEngine = new EnterpriseWorkflowStateMachineEngine(),
    executionEngine: EnterpriseWorkflowExecutionEngine = new EnterpriseWorkflowExecutionEngine(),
  ) {
    this.workflowEngine = workflowEngine;
    this.pipelineEngine = pipelineEngine;
    this.stateMachineEngine = stateMachineEngine;
    this.executionEngine = executionEngine;
  }

  getCapabilities(): WorkflowMonitoringCapabilities {
    return I05_WORKFLOW_MONITORING_CAPABILITIES;
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

  getExecutionEngine(): EnterpriseWorkflowExecutionEngine {
    return this.executionEngine;
  }

  register(
    monitoring: Omit<WorkflowMonitoringRecord, "startedAt" | "updatedAt"> & {
      readonly startedAt?: number;
      readonly updatedAt?: number;
    },
  ): WorkflowMonitoringResult {
    if (!monitoring.monitoringId || monitoring.monitoringId.trim() === "") {
      return { ok: false, code: "MONITORING_INVALID_ID", message: "monitoringId is required" };
    }
    if (!monitoring.executionId || monitoring.executionId.trim() === "") {
      return {
        ok: false,
        code: "MONITORING_INVALID_EXECUTION_ID",
        message: "executionId is required",
      };
    }
    if (!monitoring.workflowId || monitoring.workflowId.trim() === "") {
      return {
        ok: false,
        code: "MONITORING_INVALID_WORKFLOW_ID",
        message: "workflowId is required",
      };
    }
    if (!monitoring.pipelineId || monitoring.pipelineId.trim() === "") {
      return {
        ok: false,
        code: "MONITORING_INVALID_PIPELINE_ID",
        message: "pipelineId is required",
      };
    }
    if (this.monitorings.has(monitoring.monitoringId)) {
      return { ok: false, code: "MONITORING_ALREADY_EXISTS", message: "monitoring already exists" };
    }
    if (!this.workflowEngine.get(monitoring.workflowId)) {
      return {
        ok: false,
        code: "MONITORING_UNKNOWN_WORKFLOW",
        message: `workflow ${monitoring.workflowId} not found`,
      };
    }
    if (!this.pipelineEngine.find(monitoring.pipelineId)) {
      return {
        ok: false,
        code: "MONITORING_UNKNOWN_PIPELINE",
        message: `pipeline ${monitoring.pipelineId} not found`,
      };
    }
    if (!this.executionEngine.find(monitoring.executionId)) {
      return {
        ok: false,
        code: "MONITORING_UNKNOWN_EXECUTION",
        message: `execution ${monitoring.executionId} not found`,
      };
    }

    const now = Date.now();
    const record: WorkflowMonitoringRecord = {
      ...monitoring,
      startedAt: monitoring.startedAt ?? now,
      updatedAt: monitoring.updatedAt ?? now,
    };
    this.monitorings.set(monitoring.monitoringId, record);

    return { ok: true, code: "MONITORING_REGISTERED", message: "monitoring registered", record };
  }

  find(monitoringId: string): WorkflowMonitoringRecord | null {
    return this.monitorings.get(monitoringId) ?? null;
  }

  listAll(): readonly WorkflowMonitoringRecord[] {
    return Array.from(this.monitorings.values());
  }

  trackStatus(monitoringId: string, status: WorkflowMonitoringStatus): WorkflowMonitoringResult {
    const record = this.monitorings.get(monitoringId);
    if (!record) {
      return {
        ok: false,
        code: "MONITORING_NOT_FOUND",
        message: `monitoring ${monitoringId} not found`,
      };
    }
    const updated: WorkflowMonitoringRecord = { ...record, status, updatedAt: Date.now() };
    this.monitorings.set(monitoringId, updated);
    return {
      ok: true,
      code: "MONITORING_STATUS_UPDATED",
      message: `status updated to ${status}`,
      record: updated,
    };
  }

  getExecutionStatus(monitoringId: string): WorkflowMonitoringStatus | null {
    return this.monitorings.get(monitoringId)?.status ?? null;
  }

  getMonitoredExecution(
    monitoringId: string,
  ): { monitoring: WorkflowMonitoringRecord; executionId: string } | null {
    const monitoring = this.monitorings.get(monitoringId);
    if (!monitoring) return null;
    return { monitoring, executionId: monitoring.executionId };
  }

  stats(): WorkflowMonitoringStats {
    const byStatus: Record<WorkflowMonitoringStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };
    const byWorkflow: Record<string, number> = {};
    const byPipeline: Record<string, number> = {};
    for (const m of this.monitorings.values()) {
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
      byWorkflow[m.workflowId] = (byWorkflow[m.workflowId] ?? 0) + 1;
      byPipeline[m.pipelineId] = (byPipeline[m.pipelineId] ?? 0) + 1;
    }
    return { total: this.monitorings.size, byStatus, byWorkflow, byPipeline };
  }
}
