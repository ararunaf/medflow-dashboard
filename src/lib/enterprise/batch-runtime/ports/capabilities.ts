/**
 * BatchRuntimeEngineCapabilities — capacidades declarativas (C-06 / ECS-01).
 *
 * Apenas declaração estrutural. Sem processamento em lote. Sem filas.
 * Sem workers. Sem retry funcional. Sem scheduler. Sem paralelismo.
 * Integrações estruturais declaradas como preparadas — sem consumo funcional.
 *
 * STATE MACHINE FIRST (Regra Permanente nº 11).
 */

import type { BatchCapabilities } from "./canonical";

export type BatchRuntimeEngineCapabilities = {
  supportsPrepareBatch?: boolean;
  supportsGetBatch?: boolean;
  supportsListBatches?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalBatchManifest?: boolean;
  supportsBatchStateMachine?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesAuthorizationRuntimePort?: boolean;
  usesOperatorRuntimePort?: boolean;
  usesSOAPRuntimePort?: boolean;
  usesXMLRuntimePort?: boolean;
  usesXMLValidationRuntimePort?: boolean;
  usesQualityRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  runtimeReady?: true;
  batchProcessingImplemented?: false;
  parallelExecutionImplemented?: false;
  retryImplemented?: false;
  schedulerImplemented?: false;
  workerImplemented?: false;
  queueImplemented?: false;
  soapFunctionalImplemented?: false;
  xmlFunctionalImplemented?: false;
  operatorCommunicationImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
};

export function emptyBatchRuntimeEngineCapabilities(): BatchRuntimeEngineCapabilities {
  return {};
}

export function emptyBatchRuntimeCapabilities(): BatchRuntimeEngineCapabilities {
  return emptyBatchRuntimeEngineCapabilities();
}

export function defineBatchRuntimeEngineCapabilities(
  capabilities: BatchRuntimeEngineCapabilities = {},
): BatchRuntimeEngineCapabilities {
  return { ...capabilities };
}

export function defineBatchRuntimeCapabilities(
  capabilities: BatchRuntimeEngineCapabilities = {},
): BatchRuntimeEngineCapabilities {
  return defineBatchRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES: BatchRuntimeEngineCapabilities = {
  supportsPrepareBatch: true,
  supportsGetBatch: true,
  supportsListBatches: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalBatchManifest: true,
  supportsBatchStateMachine: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesAuthorizationRuntimePort: true,
  usesOperatorRuntimePort: true,
  usesSOAPRuntimePort: true,
  usesXMLRuntimePort: true,
  usesXMLValidationRuntimePort: true,
  usesQualityRuntimePort: true,
  usesAuditRuntimePort: true,
  runtimeReady: true,
  batchProcessingImplemented: false,
  parallelExecutionImplemented: false,
  retryImplemented: false,
  schedulerImplemented: false,
  workerImplemented: false,
  queueImplemented: false,
  soapFunctionalImplemented: false,
  xmlFunctionalImplemented: false,
  operatorCommunicationImplemented: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
};

export const DEFAULT_BATCH_RUNTIME_CAPABILITIES = DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES: BatchRuntimeEngineCapabilities = {
  ...DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
};

export const DEFAULT_MOCK_BATCH_RUNTIME_CAPABILITIES =
  DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES;

export function toBatchCapabilities(
  capabilities: BatchRuntimeEngineCapabilities = DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
): BatchCapabilities {
  return {
    kind: "canonical-batch-capabilities",
    supportsPrepareBatch: capabilities.supportsPrepareBatch === true,
    supportsGetBatch: capabilities.supportsGetBatch === true,
    supportsListBatches: capabilities.supportsListBatches === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalBatchManifest: capabilities.supportsCanonicalBatchManifest === true,
    supportsBatchStateMachine: capabilities.supportsBatchStateMachine === true,
    runtimeReady: true,
    batchProcessingImplemented: false,
    parallelExecutionImplemented: false,
    retryImplemented: false,
    schedulerImplemented: false,
    workerImplemented: false,
    queueImplemented: false,
    soapFunctionalImplemented: false,
    xmlFunctionalImplemented: false,
    operatorCommunicationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}

export function toCanonicalBatchCapabilities(
  capabilities: BatchRuntimeEngineCapabilities = DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
): BatchCapabilities {
  return toBatchCapabilities(capabilities);
}
