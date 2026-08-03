/**
 * XSDRuntimeCapabilities — capacidades declarativas (TISS-09).
 *
 * Apenas declaração estrutural. Sem XSD oficial. Sem validação XSD real. Sem XML TISS/ANS.
 */

import type { CanonicalXSDCapabilities } from "./canonical";

export type XSDRuntimeCapabilities = {
  supportsPrepare?: boolean;
  supportsGetResult?: boolean;
  supportsListResults?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalXsd?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  runtimeReady?: true;
  officialXsdLoaded?: false;
  realXsdLoaded?: false;
  realValidationAvailable?: false;
  officialNamespacesLoaded?: false;
  officialSchemasLoaded?: false;
  schemaParsingEnabled?: false;
  schemaValidationEnabled?: false;
  implementsOfficialXsd?: false;
  implementsXsdValidation?: false;
  implementsRealXmlValidation?: false;
  implementsOperatorDispatch?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyXSDRuntimeCapabilities(): XSDRuntimeCapabilities {
  return {};
}

export function defineXSDRuntimeCapabilities(
  capabilities: XSDRuntimeCapabilities = {},
): XSDRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_XSD_RUNTIME_CAPABILITIES: XSDRuntimeCapabilities = {
  supportsPrepare: true,
  supportsGetResult: true,
  supportsListResults: true,
  supportsHealth: true,
  supportsCanonicalXsd: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  runtimeReady: true,
  officialXsdLoaded: false,
  realXsdLoaded: false,
  realValidationAvailable: false,
  officialNamespacesLoaded: false,
  officialSchemasLoaded: false,
  schemaParsingEnabled: false,
  schemaValidationEnabled: false,
  implementsOfficialXsd: false,
  implementsXsdValidation: false,
  implementsRealXmlValidation: false,
  implementsOperatorDispatch: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES: XSDRuntimeCapabilities = {
  ...DEFAULT_XSD_RUNTIME_CAPABILITIES,
};

export function toCanonicalXSDCapabilities(
  capabilities: XSDRuntimeCapabilities = DEFAULT_XSD_RUNTIME_CAPABILITIES,
): CanonicalXSDCapabilities {
  return {
    kind: "canonical-xsd-capabilities",
    supportsPrepare: capabilities.supportsPrepare === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsListResults: capabilities.supportsListResults === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalXsd: capabilities.supportsCanonicalXsd === true,
    runtimeReady: true,
    officialXsdLoaded: false,
    realXsdLoaded: false,
    realValidationAvailable: false,
    officialNamespacesLoaded: false,
    officialSchemasLoaded: false,
    schemaParsingEnabled: false,
    schemaValidationEnabled: false,
    implementsOfficialXsd: false,
    implementsXsdValidation: false,
    implementsRealXmlValidation: false,
    implementsOperatorDispatch: false,
    implementsBusinessRules: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
