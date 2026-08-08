/**
 * EnterpriseWorkflowRecoveryEngine — I-07.
 *
 * Gerenciamento estrutural de políticas e ações de recuperação de workflows.
 * Reutiliza exclusivamente as engines EnterpriseWorkflowEngine,
 * EnterpriseWorkflowPipelineEngine, EnterpriseWorkflowStateMachineEngine,
 * EnterpriseWorkflowExecutionEngine, EnterpriseWorkflowMonitoringEngine e
 * EnterpriseWorkflowMetricsEngine.
 * Não executa workflows, não altera estados diretamente, não monitora,
 * não calcula métricas, não acessa Blocos A-H.
 */
import { EnterpriseWorkflowEngine } from "../workflow";
import { EnterpriseWorkflowPipelineEngine } from "../pipeline";
import { EnterpriseWorkflowStateMachineEngine } from "../state-machine";
import { EnterpriseWorkflowExecutionEngine } from "../execution";
import { EnterpriseWorkflowMonitoringEngine } from "../monitoring";
import { EnterpriseWorkflowMetricsEngine } from "../metrics";

export interface WorkflowRecoveryCapabilities {
  readonly workflowEngineImplemented: boolean;
  readonly workflowPipelineImplemented: boolean;
  readonly workflowStateMachineImplemented: boolean;
  readonly workflowExecutionImplemented: boolean;
  readonly workflowMonitoringImplemented: boolean;
  readonly workflowMetricsImplemented: boolean;
  readonly workflowRecoveryImplemented: boolean;
  readonly workflowFacadeImplemented: boolean;
}

export const I07_WORKFLOW_RECOVERY_CAPABILITIES: WorkflowRecoveryCapabilities = {
  workflowEngineImplemented: true,
  workflowPipelineImplemented: true,
  workflowStateMachineImplemented: true,
  workflowExecutionImplemented: true,
  workflowMonitoringImplemented: true,
  workflowMetricsImplemented: true,
  workflowRecoveryImplemented: true,
  workflowFacadeImplemented: false,
};

export type RecoveryMode = "manual" | "auto";

export interface WorkflowRecoveryPolicy {
  readonly policyId: string;
  readonly name: string;
  readonly description: string;
  readonly mode: RecoveryMode;
  readonly workflowIds: readonly string[];
  readonly maxAttempts?: number;
}

export interface WorkflowRecoveryResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly record?: WorkflowRecoveryAction | null;
}

export interface WorkflowRecoveryAction {
  readonly actionId: string;
  readonly policyId: string;
  readonly executionId: string;
  readonly workflowId: string;
  readonly mode: RecoveryMode;
  readonly executedAt: number;
  readonly status: "simulated" | "completed";
}

export interface WorkflowRecoveryStats {
  readonly totalPolicies: number;
  readonly totalActions: number;
  readonly byPolicy: Record<string, number>;
  readonly byMode: Record<RecoveryMode, number>;
}

export class EnterpriseWorkflowRecoveryEngine {
  private readonly workflowEngine: EnterpriseWorkflowEngine;
  private readonly pipelineEngine: EnterpriseWorkflowPipelineEngine;
  private readonly stateMachineEngine: EnterpriseWorkflowStateMachineEngine;
  private readonly executionEngine: EnterpriseWorkflowExecutionEngine;
  private readonly monitoringEngine: EnterpriseWorkflowMonitoringEngine;
  private readonly metricsEngine: EnterpriseWorkflowMetricsEngine;
  private readonly policies = new Map<string, WorkflowRecoveryPolicy>();
  private readonly actions = new Map<string, WorkflowRecoveryAction>();

  constructor(
    workflowEngine: EnterpriseWorkflowEngine = new EnterpriseWorkflowEngine(),
    pipelineEngine: EnterpriseWorkflowPipelineEngine = new EnterpriseWorkflowPipelineEngine(),
    stateMachineEngine: EnterpriseWorkflowStateMachineEngine = new EnterpriseWorkflowStateMachineEngine(),
    executionEngine: EnterpriseWorkflowExecutionEngine = new EnterpriseWorkflowExecutionEngine(),
    monitoringEngine: EnterpriseWorkflowMonitoringEngine = new EnterpriseWorkflowMonitoringEngine(),
    metricsEngine: EnterpriseWorkflowMetricsEngine = new EnterpriseWorkflowMetricsEngine(),
  ) {
    this.workflowEngine = workflowEngine;
    this.pipelineEngine = pipelineEngine;
    this.stateMachineEngine = stateMachineEngine;
    this.executionEngine = executionEngine;
    this.monitoringEngine = monitoringEngine;
    this.metricsEngine = metricsEngine;
  }

  getCapabilities(): WorkflowRecoveryCapabilities {
    return I07_WORKFLOW_RECOVERY_CAPABILITIES;
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

  getMetricsEngine(): EnterpriseWorkflowMetricsEngine {
    return this.metricsEngine;
  }

  register(policy: WorkflowRecoveryPolicy): WorkflowRecoveryResult {
    if (!policy.policyId || policy.policyId.trim() === "") {
      return { ok: false, code: "RECOVERY_INVALID_POLICY_ID", message: "policyId is required" };
    }
    if (!policy.name || policy.name.trim() === "") {
      return { ok: false, code: "RECOVERY_INVALID_NAME", message: "name is required" };
    }
    if (this.policies.has(policy.policyId)) {
      return { ok: false, code: "RECOVERY_POLICY_EXISTS", message: "policy already exists" };
    }
    for (const workflowId of policy.workflowIds) {
      if (!this.workflowEngine.get(workflowId)) {
        return {
          ok: false,
          code: "RECOVERY_UNKNOWN_WORKFLOW",
          message: `workflow ${workflowId} not found`,
        };
      }
    }
    this.policies.set(policy.policyId, policy);
    return { ok: true, code: "RECOVERY_POLICY_REGISTERED", message: "recovery policy registered" };
  }

  find(policyId: string): WorkflowRecoveryPolicy | null {
    return this.policies.get(policyId) ?? null;
  }

  listAll(): readonly WorkflowRecoveryPolicy[] {
    return Array.from(this.policies.values());
  }

  associate(policyId: string, workflowId: string): WorkflowRecoveryResult {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return {
        ok: false,
        code: "RECOVERY_POLICY_NOT_FOUND",
        message: `policy ${policyId} not found`,
      };
    }
    if (!this.workflowEngine.get(workflowId)) {
      return {
        ok: false,
        code: "RECOVERY_UNKNOWN_WORKFLOW",
        message: `workflow ${workflowId} not found`,
      };
    }
    if (policy.workflowIds.includes(workflowId)) {
      return {
        ok: true,
        code: "RECOVERY_ASSOCIATION_EXISTS",
        message: "workflow already associated",
      };
    }
    const updated: WorkflowRecoveryPolicy = {
      ...policy,
      workflowIds: [...policy.workflowIds, workflowId],
    };
    this.policies.set(policyId, updated);
    return {
      ok: true,
      code: "RECOVERY_ASSOCIATED",
      message: `workflow ${workflowId} associated to ${policyId}`,
    };
  }

  recover(actionId: string, executionId: string, mode: RecoveryMode): WorkflowRecoveryResult {
    if (!actionId || actionId.trim() === "") {
      return { ok: false, code: "RECOVERY_INVALID_ACTION_ID", message: "actionId is required" };
    }
    if (!executionId || executionId.trim() === "") {
      return {
        ok: false,
        code: "RECOVERY_INVALID_EXECUTION_ID",
        message: "executionId is required",
      };
    }
    if (this.actions.has(actionId)) {
      return { ok: false, code: "RECOVERY_ACTION_EXISTS", message: "action already exists" };
    }
    const execution = this.executionEngine.find(executionId);
    if (!execution) {
      return {
        ok: false,
        code: "RECOVERY_UNKNOWN_EXECUTION",
        message: `execution ${executionId} not found`,
      };
    }
    const policy = this.findPolicyByWorkflow(execution.workflowId);
    if (!policy) {
      return {
        ok: false,
        code: "RECOVERY_NO_POLICY",
        message: `no recovery policy for workflow ${execution.workflowId}`,
      };
    }
    const record: WorkflowRecoveryAction = {
      actionId,
      policyId: policy.policyId,
      executionId,
      workflowId: execution.workflowId,
      mode,
      executedAt: Date.now(),
      status: mode === "manual" ? "completed" : "simulated",
    };
    this.actions.set(actionId, record);
    return {
      ok: true,
      code: "RECOVERY_ACTION_EXECUTED",
      message: `recovery ${mode} recorded for ${executionId}`,
      record,
    };
  }

  manual(actionId: string, executionId: string): WorkflowRecoveryResult {
    return this.recover(actionId, executionId, "manual");
  }

  automatic(actionId: string, executionId: string): WorkflowRecoveryResult {
    return this.recover(actionId, executionId, "auto");
  }

  stats(): WorkflowRecoveryStats {
    const byPolicy: Record<string, number> = {};
    const byMode: Record<RecoveryMode, number> = { manual: 0, auto: 0 };
    for (const action of this.actions.values()) {
      byPolicy[action.policyId] = (byPolicy[action.policyId] ?? 0) + 1;
      byMode[action.mode] = (byMode[action.mode] ?? 0) + 1;
    }
    return { totalPolicies: this.policies.size, totalActions: this.actions.size, byPolicy, byMode };
  }

  private findPolicyByWorkflow(workflowId: string): WorkflowRecoveryPolicy | undefined {
    for (const policy of this.policies.values()) {
      if (policy.workflowIds.includes(workflowId)) {
        return policy;
      }
    }
    return undefined;
  }
}
