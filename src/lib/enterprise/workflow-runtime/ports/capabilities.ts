/**
 * WorkflowRuntimeEngineCapabilities — capacidades declarativas (C-10 / ECS-01).
 *
 * Apenas declaração estrutural. Sem workflow funcional. Sem BPM.
 * Sem decisão automática. Sem execução de runtime. Integrações estruturais
 * declaradas como preparadas — sem consumo funcional (RULE_18).
 *
 * WORKFLOW IS PURE ORCHESTRATION (Regra Permanente nº 18).
 */

import type { WorkflowCapabilities } from "./canonical";

export type WorkflowRuntimeEngineCapabilities = {
  supportsPrepareWorkflowExecution?: boolean;
  supportsGetWorkflowExecution?: boolean;
  supportsListWorkflowExecutions?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalWorkflowManifest?: boolean;
  supportsCanonicalWorkflowExecutionResult?: boolean;
  supportsWorkflowStateMachine?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesReconciliationRuntimePort?: boolean;
  usesReturnRuntimePort?: boolean;
  usesAuthorizationRuntimePort?: boolean;
  usesOperatorRuntimePort?: boolean;
  usesProtocolRuntimePort?: boolean;
  usesBatchRuntimePort?: boolean;
  usesSOAPRuntimePort?: boolean;
  usesXMLRuntimePort?: boolean;
  usesXMLValidationRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  runtimeReady?: true;
  workflowImplemented?: false;
  workflowExecutionImplemented?: false;
  automaticDecisionImplemented?: false;
  runtimeExecutionImplemented?: false;
};

export function emptyWorkflowRuntimeEngineCapabilities(): WorkflowRuntimeEngineCapabilities {
  return {};
}

export function emptyWorkflowRuntimeCapabilities(): WorkflowRuntimeEngineCapabilities {
  return emptyWorkflowRuntimeEngineCapabilities();
}

export function defineWorkflowRuntimeEngineCapabilities(
  capabilities: WorkflowRuntimeEngineCapabilities = {},
): WorkflowRuntimeEngineCapabilities {
  return { ...capabilities };
}

export function defineWorkflowRuntimeCapabilities(
  capabilities: WorkflowRuntimeEngineCapabilities = {},
): WorkflowRuntimeEngineCapabilities {
  return defineWorkflowRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES: WorkflowRuntimeEngineCapabilities = {
  supportsPrepareWorkflowExecution: true,
  supportsGetWorkflowExecution: true,
  supportsListWorkflowExecutions: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalWorkflowManifest: true,
  supportsCanonicalWorkflowExecutionResult: true,
  supportsWorkflowStateMachine: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesReconciliationRuntimePort: true,
  usesReturnRuntimePort: true,
  usesAuthorizationRuntimePort: true,
  usesOperatorRuntimePort: true,
  usesProtocolRuntimePort: true,
  usesBatchRuntimePort: true,
  usesSOAPRuntimePort: true,
  usesXMLRuntimePort: true,
  usesXMLValidationRuntimePort: true,
  usesAuditRuntimePort: true,
  runtimeReady: true,
  workflowImplemented: false,
  workflowExecutionImplemented: false,
  automaticDecisionImplemented: false,
  runtimeExecutionImplemented: false,
};

export const DEFAULT_WORKFLOW_RUNTIME_CAPABILITIES = DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES: WorkflowRuntimeEngineCapabilities =
  {
    ...DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
  };

export const DEFAULT_MOCK_WORKFLOW_RUNTIME_CAPABILITIES =
  DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES;

export function toWorkflowCapabilities(
  capabilities: WorkflowRuntimeEngineCapabilities = DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
): WorkflowCapabilities {
  return {
    kind: "canonical-workflow-capabilities",
    supportsPrepareWorkflowExecution: capabilities.supportsPrepareWorkflowExecution === true,
    supportsGetWorkflowExecution: capabilities.supportsGetWorkflowExecution === true,
    supportsListWorkflowExecutions: capabilities.supportsListWorkflowExecutions === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalWorkflowManifest: capabilities.supportsCanonicalWorkflowManifest === true,
    supportsCanonicalWorkflowExecutionResult:
      capabilities.supportsCanonicalWorkflowExecutionResult === true,
    supportsWorkflowStateMachine: capabilities.supportsWorkflowStateMachine === true,
    runtimeReady: true,
    workflowImplemented: false,
    workflowExecutionImplemented: false,
    automaticDecisionImplemented: false,
    runtimeExecutionImplemented: false,
  };
}

export function toCanonicalWorkflowCapabilities(
  capabilities: WorkflowRuntimeEngineCapabilities = DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
): WorkflowCapabilities {
  return toWorkflowCapabilities(capabilities);
}
