/**
 * SOAPRuntimeEngineCapabilities — capacidades declarativas (C-03 / ECS-01).
 *
 * Apenas declaração estrutural. Sem comunicação SOAP. Sem HTTP. Sem WSDL.
 * Sem TLS. Sem certificado. Sem autenticação. Sem MTOM. Integrações
 * estruturais declaradas como preparadas — sem consumo funcional.
 *
 * TRANSPORT AGNOSTIC (Regra Permanente nº 5): especialização de transporte
 * ocorre apenas por Adapters futuros.
 */

import type { SOAPCapabilities } from "./canonical";

export type SOAPRuntimeEngineCapabilities = {
  supportsPrepare?: boolean;
  supportsGetResponse?: boolean;
  supportsListResponses?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalSOAP?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesXMLRuntimePort?: boolean;
  usesXMLValidationRuntimePort?: boolean;
  usesQualityRuntimePort?: boolean;
  usesAutoFillRuntimePort?: boolean;
  usesTISSMappingRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  usesValidationRuntimePort?: boolean;
  runtimeReady?: true;
  soapCommunicationImplemented?: false;
  wsdlImplemented?: false;
  soapEnvelopeImplemented?: false;
  soapFaultImplemented?: false;
  certificateImplemented?: false;
  tlsImplemented?: false;
  mtomImplemented?: false;
  compressionImplemented?: false;
  retryImplemented?: false;
  operatorCommunicationImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsHttpEndpoint?: false;
  knowsWsdl?: false;
};

export function emptySOAPRuntimeEngineCapabilities(): SOAPRuntimeEngineCapabilities {
  return {};
}

export function emptySOAPRuntimeCapabilities(): SOAPRuntimeEngineCapabilities {
  return emptySOAPRuntimeEngineCapabilities();
}

export function defineSOAPRuntimeEngineCapabilities(
  capabilities: SOAPRuntimeEngineCapabilities = {},
): SOAPRuntimeEngineCapabilities {
  return { ...capabilities };
}

export function defineSOAPRuntimeCapabilities(
  capabilities: SOAPRuntimeEngineCapabilities = {},
): SOAPRuntimeEngineCapabilities {
  return defineSOAPRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES: SOAPRuntimeEngineCapabilities = {
  supportsPrepare: true,
  supportsGetResponse: true,
  supportsListResponses: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalSOAP: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesXMLRuntimePort: true,
  usesXMLValidationRuntimePort: true,
  usesQualityRuntimePort: true,
  usesAutoFillRuntimePort: true,
  usesTISSMappingRuntimePort: true,
  usesAuditRuntimePort: true,
  usesValidationRuntimePort: true,
  runtimeReady: true,
  soapCommunicationImplemented: false,
  wsdlImplemented: false,
  soapEnvelopeImplemented: false,
  soapFaultImplemented: false,
  certificateImplemented: false,
  tlsImplemented: false,
  mtomImplemented: false,
  compressionImplemented: false,
  retryImplemented: false,
  operatorCommunicationImplemented: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsHttpEndpoint: false,
  knowsWsdl: false,
};

export const DEFAULT_SOAP_RUNTIME_CAPABILITIES = DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES: SOAPRuntimeEngineCapabilities = {
  ...DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
};

export const DEFAULT_MOCK_SOAP_RUNTIME_CAPABILITIES = DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES;

export function toSOAPCapabilities(
  capabilities: SOAPRuntimeEngineCapabilities = DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
): SOAPCapabilities {
  return {
    kind: "canonical-soap-capabilities",
    supportsPrepare: capabilities.supportsPrepare === true,
    supportsGetResponse: capabilities.supportsGetResponse === true,
    supportsListResponses: capabilities.supportsListResponses === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalSOAP: capabilities.supportsCanonicalSOAP === true,
    runtimeReady: true,
    soapCommunicationImplemented: false,
    wsdlImplemented: false,
    soapEnvelopeImplemented: false,
    soapFaultImplemented: false,
    certificateImplemented: false,
    tlsImplemented: false,
    mtomImplemented: false,
    compressionImplemented: false,
    retryImplemented: false,
    operatorCommunicationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsHttpEndpoint: false,
    knowsWsdl: false,
  };
}

export function toCanonicalSOAPCapabilities(
  capabilities: SOAPRuntimeEngineCapabilities = DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
): SOAPCapabilities {
  return toSOAPCapabilities(capabilities);
}
