/**
 * TISSMappingRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-11).
 *
 * Apenas declaração estrutural. Sem mapeamento funcional. Sem operadoras.
 * Sem XML. Sem preenchimento automático. Sem IA. Integrações estruturais
 * (AIOrchestration/Audit/Validation/DocumentExtraction/DocumentClassification/
 * OCR/ICR/Scanner/WatchFolder/Upload) declaradas como preparadas —
 * sem consumo funcional.
 */

import type { CanonicalMappingCapabilities } from "./canonical";

export type TISSMappingRuntimeEngineCapabilities = {
  supportsPrepareMapping?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalMapping?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesAIOrchestrationRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  usesValidationRuntimePort?: boolean;
  usesDocumentExtractionRuntimePort?: boolean;
  usesDocumentClassificationRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesIntelligentCaptureRuntimePort?: boolean;
  usesScannerRuntimePort?: boolean;
  usesWatchFolderRuntimePort?: boolean;
  usesUploadRuntimePort?: boolean;
  runtimeReady?: true;
  mappingEngineImplemented?: false;
  operatorMappingImplemented?: false;
  templateMappingImplemented?: false;
  canonicalModelImplemented?: false;
  guideTransformationImplemented?: false;
  fieldNormalizationImplemented?: false;
  tissVersionMappingImplemented?: false;
  layoutMappingImplemented?: false;
  xmlMappingImplemented?: false;
  autoFillPreparationImplemented?: false;
};

export function emptyTISSMappingRuntimeEngineCapabilities(): TISSMappingRuntimeEngineCapabilities {
  return {};
}

export function defineTISSMappingRuntimeEngineCapabilities(
  capabilities: TISSMappingRuntimeEngineCapabilities = {},
): TISSMappingRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES: TISSMappingRuntimeEngineCapabilities =
  {
    supportsPrepareMapping: true,
    supportsGetResult: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalMapping: true,
    supportsTimeout: true,
    supportsRetry: true,
    supportsCancellation: true,
    supportsTelemetry: true,
    usesAIOrchestrationRuntimePort: true,
    usesAuditRuntimePort: true,
    usesValidationRuntimePort: true,
    usesDocumentExtractionRuntimePort: true,
    usesDocumentClassificationRuntimePort: true,
    usesOCRRuntimePort: true,
    usesIntelligentCaptureRuntimePort: true,
    usesScannerRuntimePort: true,
    usesWatchFolderRuntimePort: true,
    usesUploadRuntimePort: true,
    runtimeReady: true,
    mappingEngineImplemented: false,
    operatorMappingImplemented: false,
    templateMappingImplemented: false,
    canonicalModelImplemented: false,
    guideTransformationImplemented: false,
    fieldNormalizationImplemented: false,
    tissVersionMappingImplemented: false,
    layoutMappingImplemented: false,
    xmlMappingImplemented: false,
    autoFillPreparationImplemented: false,
  };

export const DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES: TISSMappingRuntimeEngineCapabilities =
  {
    ...DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalMappingCapabilities(
  capabilities: TISSMappingRuntimeEngineCapabilities = DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
): CanonicalMappingCapabilities {
  return {
    kind: "canonical-tiss-mapping-capabilities",
    supportsPrepareMapping: capabilities.supportsPrepareMapping === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalMapping: capabilities.supportsCanonicalMapping === true,
    runtimeReady: true,
    mappingEngineImplemented: false,
    operatorMappingImplemented: false,
    templateMappingImplemented: false,
    canonicalModelImplemented: false,
    guideTransformationImplemented: false,
    fieldNormalizationImplemented: false,
    tissVersionMappingImplemented: false,
    layoutMappingImplemented: false,
    xmlMappingImplemented: false,
    autoFillPreparationImplemented: false,
  };
}
