/**
 * AuthorizationRuntimeEngineCapabilities — capacidades declarativas (C-05 / ECS-01).
 *
 * Apenas declaração estrutural. Sem autorização funcional. Sem elegibilidade.
 * Sem SOAP/XML/REST funcional. Integrações estruturais declaradas como
 * preparadas — sem consumo funcional.
 *
 * AUTHORIZATION STRATEGY PATTERN (Regra Permanente nº 9).
 */

import type { AuthorizationCapabilities } from "./canonical";

export type AuthorizationRuntimeEngineCapabilities = {
  supportsPrepareAuthorization?: boolean;
  supportsGetAuthorization?: boolean;
  supportsListAuthorizations?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalAuthorization?: boolean;
  supportsStrategySelection?: boolean;
  supportsPolicyDrivenAuthorization?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesOperatorRuntimePort?: boolean;
  usesSOAPRuntimePort?: boolean;
  usesXMLRuntimePort?: boolean;
  usesXMLValidationRuntimePort?: boolean;
  usesQualityRuntimePort?: boolean;
  usesAutoFillRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  usesValidationRuntimePort?: boolean;
  runtimeReady?: true;
  authorizationImplemented?: false;
  eligibilityImplemented?: false;
  attachmentAuthorizationImplemented?: false;
  batchAuthorizationImplemented?: false;
  statusPollingImplemented?: false;
  preAuthorizationImplemented?: false;
  soapFunctionalImplemented?: false;
  xmlFunctionalImplemented?: false;
  restImplemented?: false;
  operatorCommunicationImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
};

export function emptyAuthorizationRuntimeEngineCapabilities(): AuthorizationRuntimeEngineCapabilities {
  return {};
}

export function emptyAuthorizationRuntimeCapabilities(): AuthorizationRuntimeEngineCapabilities {
  return emptyAuthorizationRuntimeEngineCapabilities();
}

export function defineAuthorizationRuntimeEngineCapabilities(
  capabilities: AuthorizationRuntimeEngineCapabilities = {},
): AuthorizationRuntimeEngineCapabilities {
  return { ...capabilities };
}

export function defineAuthorizationRuntimeCapabilities(
  capabilities: AuthorizationRuntimeEngineCapabilities = {},
): AuthorizationRuntimeEngineCapabilities {
  return defineAuthorizationRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES: AuthorizationRuntimeEngineCapabilities =
  {
    supportsPrepareAuthorization: true,
    supportsGetAuthorization: true,
    supportsListAuthorizations: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalAuthorization: true,
    supportsStrategySelection: true,
    supportsPolicyDrivenAuthorization: true,
    supportsTimeout: true,
    supportsRetry: true,
    supportsCancellation: true,
    supportsTelemetry: true,
    usesOperatorRuntimePort: true,
    usesSOAPRuntimePort: true,
    usesXMLRuntimePort: true,
    usesXMLValidationRuntimePort: true,
    usesQualityRuntimePort: true,
    usesAutoFillRuntimePort: true,
    usesAuditRuntimePort: true,
    usesValidationRuntimePort: true,
    runtimeReady: true,
    authorizationImplemented: false,
    eligibilityImplemented: false,
    attachmentAuthorizationImplemented: false,
    batchAuthorizationImplemented: false,
    statusPollingImplemented: false,
    preAuthorizationImplemented: false,
    soapFunctionalImplemented: false,
    xmlFunctionalImplemented: false,
    restImplemented: false,
    operatorCommunicationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };

export const DEFAULT_AUTHORIZATION_RUNTIME_CAPABILITIES =
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES: AuthorizationRuntimeEngineCapabilities =
  {
    ...DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  };

export const DEFAULT_MOCK_AUTHORIZATION_RUNTIME_CAPABILITIES =
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES;

export function toAuthorizationCapabilities(
  capabilities: AuthorizationRuntimeEngineCapabilities = DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
): AuthorizationCapabilities {
  return {
    kind: "canonical-authorization-capabilities",
    supportsPrepareAuthorization: capabilities.supportsPrepareAuthorization === true,
    supportsGetAuthorization: capabilities.supportsGetAuthorization === true,
    supportsListAuthorizations: capabilities.supportsListAuthorizations === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalAuthorization: capabilities.supportsCanonicalAuthorization === true,
    supportsStrategySelection: capabilities.supportsStrategySelection === true,
    supportsPolicyDrivenAuthorization: capabilities.supportsPolicyDrivenAuthorization === true,
    runtimeReady: true,
    authorizationImplemented: false,
    eligibilityImplemented: false,
    attachmentAuthorizationImplemented: false,
    batchAuthorizationImplemented: false,
    statusPollingImplemented: false,
    preAuthorizationImplemented: false,
    soapFunctionalImplemented: false,
    xmlFunctionalImplemented: false,
    restImplemented: false,
    operatorCommunicationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}

export function toCanonicalAuthorizationCapabilities(
  capabilities: AuthorizationRuntimeEngineCapabilities = DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
): AuthorizationCapabilities {
  return toAuthorizationCapabilities(capabilities);
}
