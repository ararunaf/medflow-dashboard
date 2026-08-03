/**
 * XMLSerializerRuntimeCapabilities — capacidades declarativas (TISS-06).
 *
 * Apenas declaração estrutural. Sem XML TISS/ANS real. Sem operadoras. Sem XSD.
 */

import type { CanonicalXMLSerializerProviderCapabilities } from "./canonical";

export type XMLSerializerRuntimeCapabilities = {
  supportsSerialize?: boolean;
  supportsGetResult?: boolean;
  supportsListResults?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalXmlString?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  implementsRealTissXml?: false;
  implementsRealAnsXml?: false;
  implementsOperatorDispatch?: false;
  implementsAnsValidation?: false;
  implementsXsdValidation?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyXMLSerializerRuntimeCapabilities(): XMLSerializerRuntimeCapabilities {
  return {};
}

export function defineXMLSerializerRuntimeCapabilities(
  capabilities: XMLSerializerRuntimeCapabilities = {},
): XMLSerializerRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES: XMLSerializerRuntimeCapabilities = {
  supportsSerialize: true,
  supportsGetResult: true,
  supportsListResults: true,
  supportsHealth: true,
  supportsCanonicalXmlString: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  implementsRealTissXml: false,
  implementsRealAnsXml: false,
  implementsOperatorDispatch: false,
  implementsAnsValidation: false,
  implementsXsdValidation: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES: XMLSerializerRuntimeCapabilities = {
  ...DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
};

export function toCanonicalXMLSerializerProviderCapabilities(
  capabilities: XMLSerializerRuntimeCapabilities = DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
): CanonicalXMLSerializerProviderCapabilities {
  return {
    kind: "canonical-xml-serializer-provider-capabilities",
    supportsSerialize: capabilities.supportsSerialize === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsListResults: capabilities.supportsListResults === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalXmlString: capabilities.supportsCanonicalXmlString === true,
    implementsRealTissXml: false,
    implementsRealAnsXml: false,
    implementsOperatorDispatch: false,
    implementsAnsValidation: false,
    implementsXsdValidation: false,
    implementsBusinessRules: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
