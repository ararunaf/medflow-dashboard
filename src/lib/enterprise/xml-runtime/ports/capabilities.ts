/**
 * XMLRuntimeCapabilities — capacidades declarativas (TISS-04 + D-01).
 *
 * D-01: parserImplemented = true (única capacidade funcional).
 * Demais capacidades funcionais: false.
 * Sem XSD / SOAP / TISS / Operadoras / XPath / Schema Validation.
 */

import type { CanonicalXMLProviderCapabilities } from "./canonical";

export type XMLRuntimeCapabilities = {
  supportsGenerate?: boolean;
  supportsValidate?: boolean;
  supportsCancel?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalResult?: boolean;
  supportsParse?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  consumesTISSCatalogPort?: boolean;
  consumesRulePackEnginePort?: boolean;
  consumesXMLGenerationRuntimePort?: boolean;
  /** D-01 — parser XML funcional. */
  parserImplemented?: true;
  xsdImplemented?: false;
  xmlValidationImplemented?: false;
  schemaImplemented?: false;
  xpathImplemented?: false;
  soapImplemented?: false;
  tissKnowledgeImplemented?: false;
  operatorKnowledgeImplemented?: false;
  httpImplemented?: false;
  batchImplemented?: false;
  workflowImplemented?: false;
  returnImplemented?: false;
  reconciliationImplemented?: false;
  authorizationImplemented?: false;
  persistenceImplemented?: false;
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
  supportsParse: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  consumesTISSCatalogPort: true,
  consumesRulePackEnginePort: true,
  consumesXMLGenerationRuntimePort: true,
  parserImplemented: true,
  xsdImplemented: false,
  xmlValidationImplemented: false,
  schemaImplemented: false,
  xpathImplemented: false,
  soapImplemented: false,
  tissKnowledgeImplemented: false,
  operatorKnowledgeImplemented: false,
  httpImplemented: false,
  batchImplemented: false,
  workflowImplemented: false,
  returnImplemented: false,
  reconciliationImplemented: false,
  authorizationImplemented: false,
  persistenceImplemented: false,
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
    supportsParse: capabilities.supportsParse === true,
    consumesTISSCatalogPort: capabilities.consumesTISSCatalogPort === true,
    consumesRulePackEnginePort: capabilities.consumesRulePackEnginePort === true,
    consumesXMLGenerationRuntimePort: capabilities.consumesXMLGenerationRuntimePort === true,
    parserImplemented: true,
    xsdImplemented: false,
    xmlValidationImplemented: false,
    schemaImplemented: false,
    xpathImplemented: false,
    soapImplemented: false,
    tissKnowledgeImplemented: false,
    operatorKnowledgeImplemented: false,
    httpImplemented: false,
    batchImplemented: false,
    workflowImplemented: false,
    returnImplemented: false,
    reconciliationImplemented: false,
    authorizationImplemented: false,
    persistenceImplemented: false,
    implementsRealXml: false,
    implementsOperatorDispatch: false,
    implementsAnsValidation: false,
    implementsBusinessRules: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}
