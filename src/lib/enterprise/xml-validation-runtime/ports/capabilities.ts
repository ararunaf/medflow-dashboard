/**
 * XMLValidationRuntimeCapabilities — capacidades declarativas (TISS-08).
 *
 * Apenas declaração estrutural. Sem XSD oficial. Sem validação XSD real. Sem XML TISS/ANS.
 */

import type { CanonicalXMLValidationCapabilities } from "./canonical";

export type XMLValidationRuntimeCapabilities = {
  supportsValidate?: boolean;
  supportsGetResult?: boolean;
  supportsListResults?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalValidation?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  validationEngineReady?: true;
  implementsOfficialXsd?: false;
  implementsXsdValidation?: false;
  implementsRealXmlValidation?: false;
  implementsOfficialTissValidation?: false;
  implementsOfficialAnsValidation?: false;
  implementsOperatorDispatch?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyXMLValidationRuntimeCapabilities(): XMLValidationRuntimeCapabilities {
  return {};
}

export function defineXMLValidationRuntimeCapabilities(
  capabilities: XMLValidationRuntimeCapabilities = {},
): XMLValidationRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES: XMLValidationRuntimeCapabilities = {
  supportsValidate: true,
  supportsGetResult: true,
  supportsListResults: true,
  supportsHealth: true,
  supportsCanonicalValidation: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  validationEngineReady: true,
  implementsOfficialXsd: false,
  implementsXsdValidation: false,
  implementsRealXmlValidation: false,
  implementsOfficialTissValidation: false,
  implementsOfficialAnsValidation: false,
  implementsOperatorDispatch: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES: XMLValidationRuntimeCapabilities = {
  ...DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
};

export function toCanonicalXMLValidationCapabilities(
  capabilities: XMLValidationRuntimeCapabilities = DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
): CanonicalXMLValidationCapabilities {
  return {
    kind: "canonical-xml-validation-capabilities",
    supportsValidate: capabilities.supportsValidate === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsListResults: capabilities.supportsListResults === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalValidation: capabilities.supportsCanonicalValidation === true,
    validationEngineReady: true,
    implementsOfficialXsd: false,
    implementsXsdValidation: false,
    implementsRealXmlValidation: false,
    implementsOfficialTissValidation: false,
    implementsOfficialAnsValidation: false,
    implementsOperatorDispatch: false,
    implementsBusinessRules: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
