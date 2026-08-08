/**
 * EnterpriseWorkflowMetricsEngine — I-06.
 *
 * Coleta, agregação e consulta de métricas dos workflows Enterprise.
 * Reutiliza exclusivamente EnterpriseWorkflowEngine, EnterpriseWorkflowPipelineEngine,
 * EnterpriseWorkflowStateMachineEngine, EnterpriseWorkflowExecutionEngine e
 * EnterpriseWorkflowMonitoringEngine.
 * Não implementa recovery, retry, notificações, scheduler, filas, eventos,
 * fachada ou auto recuperação.
 */
import { EnterpriseWorkflowEngine } from "../workflow";
import { EnterpriseWorkflowPipelineEngine } from "../pipeline";
import { EnterpriseWorkflowStateMachineEngine } from "../state-machine";
import { EnterpriseWorkflowExecutionEngine } from "../execution";
import { EnterpriseWorkflowMonitoringEngine } from "../monitoring";

export interface WorkflowMetricsCapabilities {
  readonly workflowEngineImplemented: boolean;
  readonly workflowPipelineImplemented: boolean;
  readonly workflowStateMachineImplemented: boolean;
  readonly workflowExecutionImplemented: boolean;
  readonly workflowMonitoringImplemented: boolean;
  readonly workflowMetricsImplemented: boolean;
  readonly workflowRecoveryImplemented: boolean;
  readonly workflowFacadeImplemented: boolean;
}

export const I06_WORKFLOW_METRICS_CAPABILITIES: WorkflowMetricsCapabilities = {
  workflowEngineImplemented: true,
  workflowPipelineImplemented: true,
  workflowStateMachineImplemented: true,
  workflowExecutionImplemented: true,
  workflowMonitoringImplemented: true,
  workflowMetricsImplemented: true,
  workflowRecoveryImplemented: false,
  workflowFacadeImplemented: false,
};

export interface WorkflowMetricRecord {
  readonly metricId: string;
  readonly workflowId: string;
  readonly pipelineId: string;
  readonly executionId: string;
  readonly monitoringId: string;
  readonly metricName: string;
  readonly value: number;
  readonly recordedAt: number;
}

export interface WorkflowMetricResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly record?: WorkflowMetricRecord | null;
}

export interface WorkflowMetricAggregation {
  readonly count: number;
  readonly sum: number;
  readonly avg: number;
  readonly min: number;
  readonly max: number;
}

export interface WorkflowMetricStats {
  readonly total: number;
  readonly byWorkflow: Record<string, WorkflowMetricAggregation>;
  readonly byPipeline: Record<string, WorkflowMetricAggregation>;
  readonly byExecution: Record<string, WorkflowMetricAggregation>;
  readonly byMonitoring: Record<string, WorkflowMetricAggregation>;
}

function emptyAggregation(): WorkflowMetricAggregation {
  return { count: 0, sum: 0, avg: 0, min: Infinity, max: -Infinity };
}

function accumulate(
  aggregation: WorkflowMetricAggregation,
  value: number,
): WorkflowMetricAggregation {
  const count = aggregation.count + 1;
  const sum = aggregation.sum + value;
  const min = aggregation.min === Infinity ? value : Math.min(aggregation.min, value);
  const max = aggregation.max === -Infinity ? value : Math.max(aggregation.max, value);
  const avg = sum / count;
  return { count, sum, avg, min, max };
}

export class EnterpriseWorkflowMetricsEngine {
  private readonly workflowEngine: EnterpriseWorkflowEngine;
  private readonly pipelineEngine: EnterpriseWorkflowPipelineEngine;
  private readonly stateMachineEngine: EnterpriseWorkflowStateMachineEngine;
  private readonly executionEngine: EnterpriseWorkflowExecutionEngine;
  private readonly monitoringEngine: EnterpriseWorkflowMonitoringEngine;
  private readonly metrics = new Map<string, WorkflowMetricRecord>();

  constructor(
    workflowEngine: EnterpriseWorkflowEngine = new EnterpriseWorkflowEngine(),
    pipelineEngine: EnterpriseWorkflowPipelineEngine = new EnterpriseWorkflowPipelineEngine(),
    stateMachineEngine: EnterpriseWorkflowStateMachineEngine = new EnterpriseWorkflowStateMachineEngine(),
    executionEngine: EnterpriseWorkflowExecutionEngine = new EnterpriseWorkflowExecutionEngine(),
    monitoringEngine: EnterpriseWorkflowMonitoringEngine = new EnterpriseWorkflowMonitoringEngine(),
  ) {
    this.workflowEngine = workflowEngine;
    this.pipelineEngine = pipelineEngine;
    this.stateMachineEngine = stateMachineEngine;
    this.executionEngine = executionEngine;
    this.monitoringEngine = monitoringEngine;
  }

  getCapabilities(): WorkflowMetricsCapabilities {
    return I06_WORKFLOW_METRICS_CAPABILITIES;
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

  getMonitoringEngine(): EnterpriseWorkflowMonitoringEngine {
    return this.monitoringEngine;
  }

  register(
    metric: Omit<WorkflowMetricRecord, "recordedAt"> & { readonly recordedAt?: number },
  ): WorkflowMetricResult {
    if (!metric.metricId || metric.metricId.trim() === "") {
      return { ok: false, code: "METRIC_INVALID_ID", message: "metricId is required" };
    }
    if (!metric.workflowId || metric.workflowId.trim() === "") {
      return { ok: false, code: "METRIC_INVALID_WORKFLOW_ID", message: "workflowId is required" };
    }
    if (!metric.pipelineId || metric.pipelineId.trim() === "") {
      return { ok: false, code: "METRIC_INVALID_PIPELINE_ID", message: "pipelineId is required" };
    }
    if (!metric.executionId || metric.executionId.trim() === "") {
      return { ok: false, code: "METRIC_INVALID_EXECUTION_ID", message: "executionId is required" };
    }
    if (!metric.monitoringId || metric.monitoringId.trim() === "") {
      return {
        ok: false,
        code: "METRIC_INVALID_MONITORING_ID",
        message: "monitoringId is required",
      };
    }
    if (!metric.metricName || metric.metricName.trim() === "") {
      return { ok: false, code: "METRIC_INVALID_NAME", message: "metricName is required" };
    }
    if (typeof metric.value !== "number" || Number.isNaN(metric.value)) {
      return { ok: false, code: "METRIC_INVALID_VALUE", message: "value must be a number" };
    }
    if (this.metrics.has(metric.metricId)) {
      return { ok: false, code: "METRIC_ALREADY_EXISTS", message: "metric already exists" };
    }
    if (!this.workflowEngine.get(metric.workflowId)) {
      return {
        ok: false,
        code: "METRIC_UNKNOWN_WORKFLOW",
        message: `workflow ${metric.workflowId} not found`,
      };
    }
    if (!this.pipelineEngine.find(metric.pipelineId)) {
      return {
        ok: false,
        code: "METRIC_UNKNOWN_PIPELINE",
        message: `pipeline ${metric.pipelineId} not found`,
      };
    }
    if (!this.executionEngine.find(metric.executionId)) {
      return {
        ok: false,
        code: "METRIC_UNKNOWN_EXECUTION",
        message: `execution ${metric.executionId} not found`,
      };
    }
    if (!this.monitoringEngine.find(metric.monitoringId)) {
      return {
        ok: false,
        code: "METRIC_UNKNOWN_MONITORING",
        message: `monitoring ${metric.monitoringId} not found`,
      };
    }

    const record: WorkflowMetricRecord = { ...metric, recordedAt: metric.recordedAt ?? Date.now() };
    this.metrics.set(metric.metricId, record);

    return { ok: true, code: "METRIC_REGISTERED", message: "metric registered", record };
  }

  find(metricId: string): WorkflowMetricRecord | null {
    return this.metrics.get(metricId) ?? null;
  }

  listAll(): readonly WorkflowMetricRecord[] {
    return Array.from(this.metrics.values());
  }

  workflowIndicator(workflowId: string): WorkflowMetricAggregation | null {
    return this.aggregateBy((m) => m.workflowId === workflowId);
  }

  pipelineIndicator(pipelineId: string): WorkflowMetricAggregation | null {
    return this.aggregateBy((m) => m.pipelineId === pipelineId);
  }

  executionIndicator(executionId: string): WorkflowMetricAggregation | null {
    return this.aggregateBy((m) => m.executionId === executionId);
  }

  monitoringIndicator(monitoringId: string): WorkflowMetricAggregation | null {
    return this.aggregateBy((m) => m.monitoringId === monitoringId);
  }

  stats(): WorkflowMetricStats {
    const byWorkflow: Record<string, WorkflowMetricAggregation> = {};
    const byPipeline: Record<string, WorkflowMetricAggregation> = {};
    const byExecution: Record<string, WorkflowMetricAggregation> = {};
    const byMonitoring: Record<string, WorkflowMetricAggregation> = {};

    for (const metric of this.metrics.values()) {
      byWorkflow[metric.workflowId] = accumulate(
        byWorkflow[metric.workflowId] ?? emptyAggregation(),
        metric.value,
      );
      byPipeline[metric.pipelineId] = accumulate(
        byPipeline[metric.pipelineId] ?? emptyAggregation(),
        metric.value,
      );
      byExecution[metric.executionId] = accumulate(
        byExecution[metric.executionId] ?? emptyAggregation(),
        metric.value,
      );
      byMonitoring[metric.monitoringId] = accumulate(
        byMonitoring[metric.monitoringId] ?? emptyAggregation(),
        metric.value,
      );
    }

    return { total: this.metrics.size, byWorkflow, byPipeline, byExecution, byMonitoring };
  }

  private aggregateBy(
    predicate: (m: WorkflowMetricRecord) => boolean,
  ): WorkflowMetricAggregation | null {
    let result = emptyAggregation();
    for (const metric of this.metrics.values()) {
      if (predicate(metric)) {
        result = accumulate(result, metric.value);
      }
    }
    if (result.count === 0) return null;
    return result;
  }
}
