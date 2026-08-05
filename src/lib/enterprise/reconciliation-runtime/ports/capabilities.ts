/**
 * ReconciliationRuntimeEngineCapabilities — capacidades declarativas (C-09 / ECS-01).
 *
 * Apenas declaração estrutural. Sem reconciliação funcional. Sem matching automático.
 * Sem resolução de conflitos. Sem workflow. Integrações estruturais declaradas
 * como preparadas — sem consumo funcional.
 *
 * RECONCILIATION IS DETERMINISTIC (Regra Permanente nº 16).
 */

import type { ReconciliationCapabilities } from "./canonical";

export type ReconciliationRuntimeEngineCapabilities = {
  supportsPrepareReconciliation?: boolean;
  supportsGetReconciliation?: boolean;
  supportsListReconciliations?: boolean;
  supportsCorrelateReconciliation?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalReconciliationManifest?: boolean;
  supportsCanonicalReconciliationResult?: boolean;
  supportsReconciliationCorrelation?: boolean;
  supportsReconciliationStateMachine?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesReturnRuntimePort?: boolean;
  usesProtocolRuntimePort?: boolean;
  usesBatchRuntimePort?: boolean;
  usesAuthorizationRuntimePort?: boolean;
  usesOperatorRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  /** Workflow Runtime futuro — preparação estrutural apenas. */
  usesWorkflowRuntimePort?: boolean;
  runtimeReady?: true;
  reconciliationImplemented?: false;
  conflictResolutionImplemented?: false;
  automaticMatchingImplemented?: false;
  workflowIntegrationImplemented?: false;
};

export function emptyReconciliationRuntimeEngineCapabilities(): ReconciliationRuntimeEngineCapabilities {
  return {};
}

export function emptyReconciliationRuntimeCapabilities(): ReconciliationRuntimeEngineCapabilities {
  return emptyReconciliationRuntimeEngineCapabilities();
}

export function defineReconciliationRuntimeEngineCapabilities(
  capabilities: ReconciliationRuntimeEngineCapabilities = {},
): ReconciliationRuntimeEngineCapabilities {
  return { ...capabilities };
}

export function defineReconciliationRuntimeCapabilities(
  capabilities: ReconciliationRuntimeEngineCapabilities = {},
): ReconciliationRuntimeEngineCapabilities {
  return defineReconciliationRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES: ReconciliationRuntimeEngineCapabilities =
  {
    supportsPrepareReconciliation: true,
    supportsGetReconciliation: true,
    supportsListReconciliations: true,
    supportsCorrelateReconciliation: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalReconciliationManifest: true,
    supportsCanonicalReconciliationResult: true,
    supportsReconciliationCorrelation: true,
    supportsReconciliationStateMachine: true,
    supportsTimeout: true,
    supportsRetry: true,
    supportsCancellation: true,
    supportsTelemetry: true,
    usesReturnRuntimePort: true,
    usesProtocolRuntimePort: true,
    usesBatchRuntimePort: true,
    usesAuthorizationRuntimePort: true,
    usesOperatorRuntimePort: true,
    usesAuditRuntimePort: true,
    usesWorkflowRuntimePort: true,
    runtimeReady: true,
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    automaticMatchingImplemented: false,
    workflowIntegrationImplemented: false,
  };

export const DEFAULT_RECONCILIATION_RUNTIME_CAPABILITIES =
  DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES: ReconciliationRuntimeEngineCapabilities =
  {
    ...DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
  };

export const DEFAULT_MOCK_RECONCILIATION_RUNTIME_CAPABILITIES =
  DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES;

export function toReconciliationCapabilities(
  capabilities: ReconciliationRuntimeEngineCapabilities = DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
): ReconciliationCapabilities {
  return {
    kind: "canonical-reconciliation-capabilities",
    supportsPrepareReconciliation: capabilities.supportsPrepareReconciliation === true,
    supportsGetReconciliation: capabilities.supportsGetReconciliation === true,
    supportsListReconciliations: capabilities.supportsListReconciliations === true,
    supportsCorrelateReconciliation: capabilities.supportsCorrelateReconciliation === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalReconciliationManifest:
      capabilities.supportsCanonicalReconciliationManifest === true,
    supportsCanonicalReconciliationResult:
      capabilities.supportsCanonicalReconciliationResult === true,
    supportsReconciliationCorrelation: capabilities.supportsReconciliationCorrelation === true,
    supportsReconciliationStateMachine: capabilities.supportsReconciliationStateMachine === true,
    runtimeReady: true,
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    automaticMatchingImplemented: false,
    workflowIntegrationImplemented: false,
  };
}

export function toCanonicalReconciliationCapabilities(
  capabilities: ReconciliationRuntimeEngineCapabilities = DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
): ReconciliationCapabilities {
  return toReconciliationCapabilities(capabilities);
}
