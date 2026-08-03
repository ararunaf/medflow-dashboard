/**
 * XMLGenerationRuntimeCapabilities — capacidades declarativas (TISS-05).
 *
 * Apenas declaração estrutural. Sem XML real. Sem operadoras. Sem regras ANS.
 */

import type { CanonicalXMLGenerationProviderCapabilities } from "./canonical";

export type XMLGenerationRuntimeCapabilities = {
  supportsGenerate?: boolean;
  supportsGetResult?: boolean;
  supportsListResults?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalStructure?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  implementsRealXml?: false;
  implementsOperatorDispatch?: false;
  implementsAnsValidation?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
};

export function emptyXMLGenerationRuntimeCapabilities(): XMLGenerationRuntimeCapabilities {
  return {};
}

export function defineXMLGenerationRuntimeCapabilities(
  capabilities: XMLGenerationRuntimeCapabilities = {},
): XMLGenerationRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES: XMLGenerationRuntimeCapabilities = {
  supportsGenerate: true,
  supportsGetResult: true,
  supportsListResults: true,
  supportsHealth: true,
  supportsCanonicalStructure: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  implementsRealXml: false,
  implementsOperatorDispatch: false,
  implementsAnsValidation: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
};

export const DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES: XMLGenerationRuntimeCapabilities = {
  ...DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
};

export function toCanonicalXMLGenerationProviderCapabilities(
  capabilities: XMLGenerationRuntimeCapabilities = DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
): CanonicalXMLGenerationProviderCapabilities {
  return {
    kind: "canonical-xml-generation-provider-capabilities",
    supportsGenerate: capabilities.supportsGenerate === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsListResults: capabilities.supportsListResults === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalStructure: capabilities.supportsCanonicalStructure === true,
    implementsRealXml: false,
    implementsOperatorDispatch: false,
    implementsAnsValidation: false,
    implementsBusinessRules: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}
