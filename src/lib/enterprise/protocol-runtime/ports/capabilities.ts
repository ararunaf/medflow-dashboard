/**
 * ProtocolRuntimeEngineCapabilities — capacidades declarativas (C-07 / ECS-01).
 *
 * Apenas declaração estrutural. Sem SOAP. Sem REST. Sem gRPC. Sem mensageria.
 * Sem HTTP. Sem TLS. Sem autenticação. Sem resolução funcional.
 * Integrações estruturais declaradas como preparadas — sem consumo funcional.
 *
 * PROTOCOL ABSTRACTION (Regra Permanente nº 12).
 */

import type { ProtocolCapabilities } from "./canonical";

export type ProtocolRuntimeEngineCapabilities = {
  supportsPrepareProfile?: boolean;
  supportsGetProfile?: boolean;
  supportsListProfiles?: boolean;
  supportsResolveProtocol?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalProtocolProfile?: boolean;
  supportsProtocolResolver?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesBatchRuntimePort?: boolean;
  usesAuthorizationRuntimePort?: boolean;
  usesOperatorRuntimePort?: boolean;
  usesSOAPRuntimePort?: boolean;
  usesXMLRuntimePort?: boolean;
  usesXMLValidationRuntimePort?: boolean;
  runtimeReady?: true;
  soapImplemented?: false;
  restImplemented?: false;
  grpcImplemented?: false;
  messagingImplemented?: false;
  protocolResolutionImplemented?: false;
  httpImplemented?: false;
  tlsImplemented?: false;
  authenticationImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
};

export function emptyProtocolRuntimeEngineCapabilities(): ProtocolRuntimeEngineCapabilities {
  return {};
}

export function emptyProtocolRuntimeCapabilities(): ProtocolRuntimeEngineCapabilities {
  return emptyProtocolRuntimeEngineCapabilities();
}

export function defineProtocolRuntimeEngineCapabilities(
  capabilities: ProtocolRuntimeEngineCapabilities = {},
): ProtocolRuntimeEngineCapabilities {
  return { ...capabilities };
}

export function defineProtocolRuntimeCapabilities(
  capabilities: ProtocolRuntimeEngineCapabilities = {},
): ProtocolRuntimeEngineCapabilities {
  return defineProtocolRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES: ProtocolRuntimeEngineCapabilities = {
  supportsPrepareProfile: true,
  supportsGetProfile: true,
  supportsListProfiles: true,
  supportsResolveProtocol: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalProtocolProfile: true,
  supportsProtocolResolver: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesBatchRuntimePort: true,
  usesAuthorizationRuntimePort: true,
  usesOperatorRuntimePort: true,
  usesSOAPRuntimePort: true,
  usesXMLRuntimePort: true,
  usesXMLValidationRuntimePort: true,
  runtimeReady: true,
  soapImplemented: false,
  restImplemented: false,
  grpcImplemented: false,
  messagingImplemented: false,
  protocolResolutionImplemented: false,
  httpImplemented: false,
  tlsImplemented: false,
  authenticationImplemented: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
};

export const DEFAULT_PROTOCOL_RUNTIME_CAPABILITIES = DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES: ProtocolRuntimeEngineCapabilities =
  {
    ...DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
  };

export const DEFAULT_MOCK_PROTOCOL_RUNTIME_CAPABILITIES =
  DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES;

export function toProtocolCapabilities(
  capabilities: ProtocolRuntimeEngineCapabilities = DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
): ProtocolCapabilities {
  return {
    kind: "canonical-protocol-capabilities",
    supportsPrepareProfile: capabilities.supportsPrepareProfile === true,
    supportsGetProfile: capabilities.supportsGetProfile === true,
    supportsListProfiles: capabilities.supportsListProfiles === true,
    supportsResolveProtocol: capabilities.supportsResolveProtocol === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalProtocolProfile: capabilities.supportsCanonicalProtocolProfile === true,
    supportsProtocolResolver: capabilities.supportsProtocolResolver === true,
    runtimeReady: true,
    soapImplemented: false,
    restImplemented: false,
    grpcImplemented: false,
    messagingImplemented: false,
    protocolResolutionImplemented: false,
    httpImplemented: false,
    tlsImplemented: false,
    authenticationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}

export function toCanonicalProtocolCapabilities(
  capabilities: ProtocolRuntimeEngineCapabilities = DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
): ProtocolCapabilities {
  return toProtocolCapabilities(capabilities);
}
