/**
 * OperatorRuntimeEngineCapabilities — capacidades declarativas (C-04 / ECS-01).
 *
 * Apenas declaração estrutural. Sem operadoras reais. Sem autenticação.
 * Sem SOAP/XML/REST funcional. Integrações estruturais declaradas como
 * preparadas — sem consumo funcional.
 *
 * OPERATOR CAPABILITY MODEL (Regra Permanente nº 7).
 */

import type { OperatorCapabilities } from "./canonical";

export type OperatorRuntimeEngineCapabilities = {
  supportsPrepareProfile?: boolean;
  supportsGetProfile?: boolean;
  supportsListProfiles?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalOperator?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesSOAPRuntimePort?: boolean;
  usesXMLRuntimePort?: boolean;
  usesXMLValidationRuntimePort?: boolean;
  usesQualityRuntimePort?: boolean;
  usesAutoFillRuntimePort?: boolean;
  usesTISSMappingRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  usesValidationRuntimePort?: boolean;
  runtimeReady?: true;
  operatorImplemented?: false;
  operatorCapabilityProfileImplemented?: false;
  operatorAuthenticationImplemented?: false;
  operatorCommunicationImplemented?: false;
  soapFunctionalImplemented?: false;
  xmlFunctionalImplemented?: false;
  restImplemented?: false;
  authorizationImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
};

export function emptyOperatorRuntimeEngineCapabilities(): OperatorRuntimeEngineCapabilities {
  return {};
}

export function emptyOperatorRuntimeCapabilities(): OperatorRuntimeEngineCapabilities {
  return emptyOperatorRuntimeEngineCapabilities();
}

export function defineOperatorRuntimeEngineCapabilities(
  capabilities: OperatorRuntimeEngineCapabilities = {},
): OperatorRuntimeEngineCapabilities {
  return { ...capabilities };
}

export function defineOperatorRuntimeCapabilities(
  capabilities: OperatorRuntimeEngineCapabilities = {},
): OperatorRuntimeEngineCapabilities {
  return defineOperatorRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES: OperatorRuntimeEngineCapabilities = {
  supportsPrepareProfile: true,
  supportsGetProfile: true,
  supportsListProfiles: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalOperator: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesSOAPRuntimePort: true,
  usesXMLRuntimePort: true,
  usesXMLValidationRuntimePort: true,
  usesQualityRuntimePort: true,
  usesAutoFillRuntimePort: true,
  usesTISSMappingRuntimePort: true,
  usesAuditRuntimePort: true,
  usesValidationRuntimePort: true,
  runtimeReady: true,
  operatorImplemented: false,
  operatorCapabilityProfileImplemented: false,
  operatorAuthenticationImplemented: false,
  operatorCommunicationImplemented: false,
  soapFunctionalImplemented: false,
  xmlFunctionalImplemented: false,
  restImplemented: false,
  authorizationImplemented: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
};

export const DEFAULT_OPERATOR_RUNTIME_CAPABILITIES = DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES: OperatorRuntimeEngineCapabilities =
  {
    ...DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
  };

export const DEFAULT_MOCK_OPERATOR_RUNTIME_CAPABILITIES =
  DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES;

export function toOperatorCapabilities(
  capabilities: OperatorRuntimeEngineCapabilities = DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
): OperatorCapabilities {
  return {
    kind: "canonical-operator-capabilities",
    supportsPrepareProfile: capabilities.supportsPrepareProfile === true,
    supportsGetProfile: capabilities.supportsGetProfile === true,
    supportsListProfiles: capabilities.supportsListProfiles === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalOperator: capabilities.supportsCanonicalOperator === true,
    runtimeReady: true,
    operatorImplemented: false,
    operatorCapabilityProfileImplemented: false,
    operatorAuthenticationImplemented: false,
    operatorCommunicationImplemented: false,
    soapFunctionalImplemented: false,
    xmlFunctionalImplemented: false,
    restImplemented: false,
    authorizationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}

export function toCanonicalOperatorCapabilities(
  capabilities: OperatorRuntimeEngineCapabilities = DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
): OperatorCapabilities {
  return toOperatorCapabilities(capabilities);
}
