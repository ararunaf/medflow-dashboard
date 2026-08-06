/**
 * XMLSchemaRuntimeCapabilities — capacidades declarativas (TISS-07).
 *
 * Apenas declaração estrutural. Sem XSD oficial. Sem validação XSD. Sem XML TISS/ANS.
 */

import type { CanonicalXMLSchemaCapabilities } from "./canonical";

export type XMLSchemaRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsSelect?: boolean;
  supportsGetResult?: boolean;
  supportsListResults?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalSchema?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  /** D-03 — Schema Selection funcional. */
  schemaSelectionImplemented?: boolean;
  implementsOfficialXsd?: false;
  implementsXsdValidation?: false;
  implementsRealTissXml?: false;
  implementsRealAnsXml?: false;
  implementsOperatorDispatch?: false;
  implementsAnsValidation?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyXMLSchemaRuntimeCapabilities(): XMLSchemaRuntimeCapabilities {
  return {};
}

export function defineXMLSchemaRuntimeCapabilities(
  capabilities: XMLSchemaRuntimeCapabilities = {},
): XMLSchemaRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES: XMLSchemaRuntimeCapabilities = {
  supportsRegister: true,
  supportsSelect: true,
  supportsGetResult: true,
  supportsListResults: true,
  supportsHealth: true,
  supportsCanonicalSchema: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  schemaSelectionImplemented: true,
  implementsOfficialXsd: false,
  implementsXsdValidation: false,
  implementsRealTissXml: false,
  implementsRealAnsXml: false,
  implementsOperatorDispatch: false,
  implementsAnsValidation: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES: XMLSchemaRuntimeCapabilities = {
  ...DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
};

export function toCanonicalXMLSchemaCapabilities(
  capabilities: XMLSchemaRuntimeCapabilities = DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
): CanonicalXMLSchemaCapabilities {
  return {
    kind: "canonical-xml-schema-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsSelect: capabilities.supportsSelect === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsListResults: capabilities.supportsListResults === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalSchema: capabilities.supportsCanonicalSchema === true,
    schemaSelectionImplemented: capabilities.schemaSelectionImplemented === true,
    implementsOfficialXsd: false,
    implementsXsdValidation: false,
    implementsRealTissXml: false,
    implementsRealAnsXml: false,
    implementsOperatorDispatch: false,
    implementsAnsValidation: false,
    implementsBusinessRules: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
