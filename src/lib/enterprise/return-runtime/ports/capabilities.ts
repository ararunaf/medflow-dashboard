/**
 * ReturnRuntimeEngineCapabilities — capacidades declarativas (C-08 / ECS-01).
 *
 * Apenas declaração estrutural. Sem processamento de retorno. Sem correlação
 * automática. Sem atualização de status. Sem reconciliação. Sem workflow.
 * Integrações estruturais declaradas como preparadas — sem consumo funcional.
 *
 * CORRELATION BEFORE PROCESSING (Regra Permanente nº 14).
 */

import type { ReturnCapabilities } from "./canonical";

export type ReturnRuntimeEngineCapabilities = {
  supportsPrepareReturn?: boolean;
  supportsGetReturn?: boolean;
  supportsListReturns?: boolean;
  supportsCorrelateReturn?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalReturnManifest?: boolean;
  supportsReturnCorrelation?: boolean;
  supportsReturnStateMachine?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesProtocolRuntimePort?: boolean;
  usesBatchRuntimePort?: boolean;
  usesAuthorizationRuntimePort?: boolean;
  usesOperatorRuntimePort?: boolean;
  usesSOAPRuntimePort?: boolean;
  usesXMLRuntimePort?: boolean;
  usesXMLValidationRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  runtimeReady?: true;
  returnProcessingImplemented?: false;
  automaticCorrelationImplemented?: false;
  statusUpdateImplemented?: false;
  reconciliationImplemented?: false;
  workflowIntegrationImplemented?: false;
  xmlParserImplemented?: false;
  soapImplemented?: false;
  operatorCommunicationImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
};

export function emptyReturnRuntimeEngineCapabilities(): ReturnRuntimeEngineCapabilities {
  return {};
}

export function emptyReturnRuntimeCapabilities(): ReturnRuntimeEngineCapabilities {
  return emptyReturnRuntimeEngineCapabilities();
}

export function defineReturnRuntimeEngineCapabilities(
  capabilities: ReturnRuntimeEngineCapabilities = {},
): ReturnRuntimeEngineCapabilities {
  return { ...capabilities };
}

export function defineReturnRuntimeCapabilities(
  capabilities: ReturnRuntimeEngineCapabilities = {},
): ReturnRuntimeEngineCapabilities {
  return defineReturnRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES: ReturnRuntimeEngineCapabilities = {
  supportsPrepareReturn: true,
  supportsGetReturn: true,
  supportsListReturns: true,
  supportsCorrelateReturn: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalReturnManifest: true,
  supportsReturnCorrelation: true,
  supportsReturnStateMachine: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesProtocolRuntimePort: true,
  usesBatchRuntimePort: true,
  usesAuthorizationRuntimePort: true,
  usesOperatorRuntimePort: true,
  usesSOAPRuntimePort: true,
  usesXMLRuntimePort: true,
  usesXMLValidationRuntimePort: true,
  usesAuditRuntimePort: true,
  runtimeReady: true,
  returnProcessingImplemented: false,
  automaticCorrelationImplemented: false,
  statusUpdateImplemented: false,
  reconciliationImplemented: false,
  workflowIntegrationImplemented: false,
  xmlParserImplemented: false,
  soapImplemented: false,
  operatorCommunicationImplemented: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
};

export const DEFAULT_RETURN_RUNTIME_CAPABILITIES = DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES: ReturnRuntimeEngineCapabilities = {
  ...DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
};

export const DEFAULT_MOCK_RETURN_RUNTIME_CAPABILITIES =
  DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES;

export function toReturnCapabilities(
  capabilities: ReturnRuntimeEngineCapabilities = DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
): ReturnCapabilities {
  return {
    kind: "canonical-return-capabilities",
    supportsPrepareReturn: capabilities.supportsPrepareReturn === true,
    supportsGetReturn: capabilities.supportsGetReturn === true,
    supportsListReturns: capabilities.supportsListReturns === true,
    supportsCorrelateReturn: capabilities.supportsCorrelateReturn === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalReturnManifest: capabilities.supportsCanonicalReturnManifest === true,
    supportsReturnCorrelation: capabilities.supportsReturnCorrelation === true,
    supportsReturnStateMachine: capabilities.supportsReturnStateMachine === true,
    runtimeReady: true,
    returnProcessingImplemented: false,
    automaticCorrelationImplemented: false,
    statusUpdateImplemented: false,
    reconciliationImplemented: false,
    workflowIntegrationImplemented: false,
    xmlParserImplemented: false,
    soapImplemented: false,
    operatorCommunicationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}

export function toCanonicalReturnCapabilities(
  capabilities: ReturnRuntimeEngineCapabilities = DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
): ReturnCapabilities {
  return toReturnCapabilities(capabilities);
}
