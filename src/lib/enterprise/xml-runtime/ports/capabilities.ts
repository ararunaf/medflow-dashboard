/**
 * XMLRuntimeCapabilities — capacidades declarativas (TISS-04).
 *
 * Apenas declaração estrutural. Sem XML real. Sem operadoras. Sem regras ANS.
 */

import type { CanonicalXMLProviderCapabilities } from "./canonical";

export type XMLRuntimeCapabilities = {
  supportsGenerate?: boolean;
  supportsValidate?: boolean;
  supportsCancel?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalResult?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  consumesTISSCatalogPort?: boolean;
  consumesRulePackEnginePort?: boolean;
  implementsRealXml?: false;
  implementsOperatorDispatch?: false;
  implementsAnsValidation?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
};

export function emptyXMLRuntimeCapabilities(): XMLRuntimeCapabilities {
  return {};
}

export function defineXMLRuntimeCapabilities(
  capabilities: XMLRuntimeCapabilities = {},
): XMLRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_XML_RUNTIME_CAPABILITIES: XMLRuntimeCapabilities = {
  supportsGenerate: true,
  supportsValidate: true,
  supportsCancel: true,
  supportsHealth: true,
  supportsCanonicalResult: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  consumesTISSCatalogPort: true,
  consumesRulePackEnginePort: true,
  implementsRealXml: false,
  implementsOperatorDispatch: false,
  implementsAnsValidation: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
};

export const DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES: XMLRuntimeCapabilities = {
  ...DEFAULT_XML_RUNTIME_CAPABILITIES,
};

/** Forma canônica de capacidades do provedor (modelo CanonicalXMLProviderCapabilities). */
export function toCanonicalXMLProviderCapabilities(
  capabilities: XMLRuntimeCapabilities = DEFAULT_XML_RUNTIME_CAPABILITIES,
): CanonicalXMLProviderCapabilities {
  return {
    kind: "canonical-xml-provider-capabilities",
    supportsGenerate: capabilities.supportsGenerate === true,
    supportsValidate: capabilities.supportsValidate === true,
    supportsCancel: capabilities.supportsCancel === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalResult: capabilities.supportsCanonicalResult === true,
    consumesTISSCatalogPort: capabilities.consumesTISSCatalogPort === true,
    consumesRulePackEnginePort: capabilities.consumesRulePackEnginePort === true,
    implementsRealXml: false,
    implementsOperatorDispatch: false,
    implementsAnsValidation: false,
    implementsBusinessRules: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}
