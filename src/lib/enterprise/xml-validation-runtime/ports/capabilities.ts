/**
 * XMLValidationRuntimeEngineCapabilities — capacidades declarativas (C-02 / D-02).
 *
 * D-02: xsdValidationImplemented = true (única capability funcional).
 * Demais capacidades funcionais: false.
 * Sem XPath / Transformation / SOAP / TISS / Operadoras / Auto Repair.
 */

import type { XMLValidationCapabilities } from "./canonical";

export type XMLValidationRuntimeEngineCapabilities = {
  supportsValidate?: boolean;
  supportsGetResult?: boolean;
  supportsListResults?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalValidation?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesXMLTISSRuntimePort?: boolean;
  usesQualityRuntimePort?: boolean;
  usesAutoFillRuntimePort?: boolean;
  usesTISSMappingRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  usesValidationRuntimePort?: boolean;
  usesDocumentExtractionRuntimePort?: boolean;
  usesDocumentClassificationRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesAIOrchestrationRuntimePort?: boolean;
  validationEngineReady?: true;
  runtimeReady?: true;
  xmlValidationImplemented?: false;
  /** D-02 — XSD Validation funcional. */
  xsdValidationImplemented?: true;
  /** D-04 — Namespace Validation funcional. */
  namespaceValidationImplemented?: true;
  schemaSelectionImplemented?: false;
  /** D-05 — Version Validation funcional. */
  versionValidationImplemented?: true;
  /** D-06 — Business Validation funcional. */
  businessValidationImplemented?: true;
  /** D-07 — Operator Validation funcional. */
  operatorValidationImplemented?: true;
  /** D-08 — XML Repair funcional. */
  xmlRepairImplemented?: true;
  automaticCorrectionImplemented?: false;
  validationReportImplemented?: false;
  /** Compat TISS-08. */
  implementsOfficialXsd?: false;
  /** D-02 — mesma capability que xsdValidationImplemented. */
  implementsXsdValidation?: true;
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

export function emptyXMLValidationRuntimeEngineCapabilities(): XMLValidationRuntimeEngineCapabilities {
  return {};
}

/** Alias TISS-08 — engine capabilities helpers. */
export function emptyXMLValidationRuntimeCapabilities(): XMLValidationRuntimeEngineCapabilities {
  return emptyXMLValidationRuntimeEngineCapabilities();
}

export function defineXMLValidationRuntimeEngineCapabilities(
  capabilities: XMLValidationRuntimeEngineCapabilities = {},
): XMLValidationRuntimeEngineCapabilities {
  return { ...capabilities };
}

/** Alias TISS-08. */
export function defineXMLValidationRuntimeCapabilities(
  capabilities: XMLValidationRuntimeEngineCapabilities = {},
): XMLValidationRuntimeEngineCapabilities {
  return defineXMLValidationRuntimeEngineCapabilities(capabilities);
}

export const DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES: XMLValidationRuntimeEngineCapabilities =
  {
    supportsValidate: true,
    supportsGetResult: true,
    supportsListResults: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalValidation: true,
    supportsTimeout: true,
    supportsRetry: true,
    supportsCancellation: true,
    supportsTelemetry: true,
    usesXMLTISSRuntimePort: true,
    usesQualityRuntimePort: true,
    usesAutoFillRuntimePort: true,
    usesTISSMappingRuntimePort: true,
    usesAuditRuntimePort: true,
    usesValidationRuntimePort: true,
    usesDocumentExtractionRuntimePort: true,
    usesDocumentClassificationRuntimePort: true,
    usesOCRRuntimePort: true,
    usesAIOrchestrationRuntimePort: true,
    validationEngineReady: true,
    runtimeReady: true,
    xmlValidationImplemented: false,
    xsdValidationImplemented: true,
    namespaceValidationImplemented: true,
    schemaSelectionImplemented: false,
    versionValidationImplemented: true,
    businessValidationImplemented: true,
    operatorValidationImplemented: true,
    xmlRepairImplemented: true,
    automaticCorrectionImplemented: false,
    validationReportImplemented: false,
    implementsOfficialXsd: false,
    implementsXsdValidation: true,
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

/** Alias TISS-08. */
export const DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES =
  DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES;

export const DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES: XMLValidationRuntimeEngineCapabilities =
  {
    ...DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  };

/** Alias TISS-08. */
export const DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES =
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES;

export function toXMLValidationCapabilities(
  capabilities: XMLValidationRuntimeEngineCapabilities = DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
): XMLValidationCapabilities {
  return {
    kind: "canonical-xml-validation-capabilities",
    supportsValidate: capabilities.supportsValidate === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsListResults: capabilities.supportsListResults === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalValidation: capabilities.supportsCanonicalValidation === true,
    validationEngineReady: true,
    runtimeReady: true,
    xmlValidationImplemented: false,
    xsdValidationImplemented: true,
    namespaceValidationImplemented: true,
    schemaSelectionImplemented: false,
    versionValidationImplemented: true,
    businessValidationImplemented: true,
    operatorValidationImplemented: true,
    xmlRepairImplemented: true,
    automaticCorrectionImplemented: false,
    validationReportImplemented: false,
    implementsOfficialXsd: false,
    implementsXsdValidation: true,
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

/** Alias TISS-08. */
export function toCanonicalXMLValidationCapabilities(
  capabilities: XMLValidationRuntimeEngineCapabilities = DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
): XMLValidationCapabilities {
  return toXMLValidationCapabilities(capabilities);
}
