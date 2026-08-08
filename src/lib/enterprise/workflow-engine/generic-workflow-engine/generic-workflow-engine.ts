/**
 * GenericWorkflowEngine — I-08 (Enterprise Workflow Facade).
 *
 * Fachada pura que expõe as engines I-01 a I-07 sem implementar lógica de negócio.
 * Reutiliza exclusivamente EnterpriseWorkflowEngine, EnterpriseWorkflowPipelineEngine,
 * EnterpriseWorkflowStateMachineEngine, EnterpriseWorkflowExecutionEngine,
 * EnterpriseWorkflowMonitoringEngine, EnterpriseWorkflowMetricsEngine e
 * EnterpriseWorkflowRecoveryEngine.
 */
import { EnterpriseWorkflowEngine } from "../workflow";
import { EnterpriseWorkflowPipelineEngine } from "../pipeline";
import { EnterpriseWorkflowStateMachineEngine } from "../state-machine";
import { EnterpriseWorkflowExecutionEngine } from "../execution";
import { EnterpriseWorkflowMonitoringEngine } from "../monitoring";
import { EnterpriseWorkflowMetricsEngine } from "../metrics";
import { EnterpriseWorkflowRecoveryEngine } from "../recovery";

export interface GenericWorkflowCapabilities {
  readonly workflowEngineImplemented: boolean;
  readonly workflowPipelineImplemented: boolean;
  readonly workflowStateMachineImplemented: boolean;
  readonly workflowExecutionImplemented: boolean;
  readonly workflowMonitoringImplemented: boolean;
  readonly workflowMetricsImplemented: boolean;
  readonly workflowRecoveryImplemented: boolean;
  readonly workflowFacadeImplemented: boolean;
}

export const I08_GENERIC_WORKFLOW_CAPABILITIES: GenericWorkflowCapabilities = {
  workflowEngineImplemented: true,
  workflowPipelineImplemented: true,
  workflowStateMachineImplemented: true,
  workflowExecutionImplemented: true,
  workflowMonitoringImplemented: true,
  workflowMetricsImplemented: true,
  workflowRecoveryImplemented: true,
  workflowFacadeImplemented: true,
};

export class GenericWorkflowEngine {
  readonly workflow: EnterpriseWorkflowEngine;
  readonly pipeline: EnterpriseWorkflowPipelineEngine;
  readonly stateMachine: EnterpriseWorkflowStateMachineEngine;
  readonly execution: EnterpriseWorkflowExecutionEngine;
  readonly monitoring: EnterpriseWorkflowMonitoringEngine;
  readonly metrics: EnterpriseWorkflowMetricsEngine;
  readonly recovery: EnterpriseWorkflowRecoveryEngine;

  constructor(
    workflow: EnterpriseWorkflowEngine = new EnterpriseWorkflowEngine(),
    pipeline: EnterpriseWorkflowPipelineEngine = new EnterpriseWorkflowPipelineEngine(),
    stateMachine: EnterpriseWorkflowStateMachineEngine = new EnterpriseWorkflowStateMachineEngine(),
    execution: EnterpriseWorkflowExecutionEngine = new EnterpriseWorkflowExecutionEngine(),
    monitoring: EnterpriseWorkflowMonitoringEngine = new EnterpriseWorkflowMonitoringEngine(),
    metrics: EnterpriseWorkflowMetricsEngine = new EnterpriseWorkflowMetricsEngine(),
    recovery: EnterpriseWorkflowRecoveryEngine = new EnterpriseWorkflowRecoveryEngine(),
  ) {
    this.workflow = workflow;
    this.pipeline = pipeline;
    this.stateMachine = stateMachine;
    this.execution = execution;
    this.monitoring = monitoring;
    this.metrics = metrics;
    this.recovery = recovery;
  }

  getCapabilities(): GenericWorkflowCapabilities {
    return I08_GENERIC_WORKFLOW_CAPABILITIES;
  }
}
