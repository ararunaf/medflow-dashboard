/**
 * XMLTISSRuntimeEngineCapabilities — capacidades declarativas (C-01 / ECS-01).
 *
 * Apenas declaração estrutural. Sem geração de XML. Sem serialização. Sem parser.
 * Sem XSD. Sem SOAP. Sem operadoras. Integrações estruturais declaradas como
 * preparadas — sem consumo funcional.
 */

import type { XMLCapabilities } from "./canonical";

export type XMLTISSRuntimeEngineCapabilities = {
  supportsPrepareXMLDocument?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalXMLTISS?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesQualityRuntimePort?: boolean;
  usesAutoFillRuntimePort?: boolean;
  usesTISSMappingRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  usesValidationRuntimePort?: boolean;
  usesDocumentExtractionRuntimePort?: boolean;
  usesDocumentClassificationRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesAIOrchestrationRuntimePort?: boolean;
  usesIntelligentCaptureRuntimePort?: boolean;
  usesScannerRuntimePort?: boolean;
  usesWatchFolderRuntimePort?: boolean;
  usesUploadRuntimePort?: boolean;
  runtimeReady?: true;
  xmlGenerationImplemented?: false;
  xmlSerializationImplemented?: false;
  xmlParsingImplemented?: false;
  xmlValidationImplemented?: false;
  xmlSigningImplemented?: false;
  xmlCompressionImplemented?: false;
  batchXmlGenerationImplemented?: false;
  soapIntegrationImplemented?: false;
  operatorIntegrationImplemented?: false;
  schemaValidationImplemented?: false;
};

export function emptyXMLTISSRuntimeEngineCapabilities(): XMLTISSRuntimeEngineCapabilities {
  return {};
}

export function defineXMLTISSRuntimeEngineCapabilities(
  capabilities: XMLTISSRuntimeEngineCapabilities = {},
): XMLTISSRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES: XMLTISSRuntimeEngineCapabilities = {
  supportsPrepareXMLDocument: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalXMLTISS: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesQualityRuntimePort: true,
  usesAutoFillRuntimePort: true,
  usesTISSMappingRuntimePort: true,
  usesAuditRuntimePort: true,
  usesValidationRuntimePort: true,
  usesDocumentExtractionRuntimePort: true,
  usesDocumentClassificationRuntimePort: true,
  usesOCRRuntimePort: true,
  usesAIOrchestrationRuntimePort: true,
  usesIntelligentCaptureRuntimePort: true,
  usesScannerRuntimePort: true,
  usesWatchFolderRuntimePort: true,
  usesUploadRuntimePort: true,
  runtimeReady: true,
  xmlGenerationImplemented: false,
  xmlSerializationImplemented: false,
  xmlParsingImplemented: false,
  xmlValidationImplemented: false,
  xmlSigningImplemented: false,
  xmlCompressionImplemented: false,
  batchXmlGenerationImplemented: false,
  soapIntegrationImplemented: false,
  operatorIntegrationImplemented: false,
  schemaValidationImplemented: false,
};

export const DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES: XMLTISSRuntimeEngineCapabilities = {
  ...DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
};

export function toXMLCapabilities(
  capabilities: XMLTISSRuntimeEngineCapabilities = DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
): XMLCapabilities {
  return {
    kind: "canonical-xml-tiss-capabilities",
    supportsPrepareXMLDocument: capabilities.supportsPrepareXMLDocument === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalXMLTISS: capabilities.supportsCanonicalXMLTISS === true,
    runtimeReady: true,
    xmlGenerationImplemented: false,
    xmlSerializationImplemented: false,
    xmlParsingImplemented: false,
    xmlValidationImplemented: false,
    xmlSigningImplemented: false,
    xmlCompressionImplemented: false,
    batchXmlGenerationImplemented: false,
    soapIntegrationImplemented: false,
    operatorIntegrationImplemented: false,
    schemaValidationImplemented: false,
  };
}
