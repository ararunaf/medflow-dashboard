/**
 * QualityRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-13).
 *
 * Apenas declaração estrutural. Sem avaliação automática. Sem score funcional.
 * Sem decisão automática. Sem IA. Integrações estruturais (AutoFill/
 * TISSMapping/Audit/Validation/DocumentExtraction/DocumentClassification/
 * OCR/AIOrchestration/IntelligentCapture/Scanner/WatchFolder/Upload)
 * declaradas como preparadas — sem consumo funcional.
 */

import type { QualityCapabilities } from "./canonical";

export type QualityRuntimeEngineCapabilities = {
  supportsPrepareQualityAssessment?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalQuality?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
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
  qualityEngineImplemented?: false;
  qualityScoreImplemented?: false;
  ocrQualityImplemented?: false;
  classificationQualityImplemented?: false;
  extractionQualityImplemented?: false;
  validationQualityImplemented?: false;
  mappingQualityImplemented?: false;
  autoFillQualityImplemented?: false;
  auditQualityImplemented?: false;
  approvalDecisionImplemented?: false;
};

export function emptyQualityRuntimeEngineCapabilities(): QualityRuntimeEngineCapabilities {
  return {};
}

export function defineQualityRuntimeEngineCapabilities(
  capabilities: QualityRuntimeEngineCapabilities = {},
): QualityRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES: QualityRuntimeEngineCapabilities = {
  supportsPrepareQualityAssessment: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalQuality: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
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
  qualityEngineImplemented: false,
  qualityScoreImplemented: false,
  ocrQualityImplemented: false,
  classificationQualityImplemented: false,
  extractionQualityImplemented: false,
  validationQualityImplemented: false,
  mappingQualityImplemented: false,
  autoFillQualityImplemented: false,
  auditQualityImplemented: false,
  approvalDecisionImplemented: false,
};

export const DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES: QualityRuntimeEngineCapabilities = {
  ...DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
};

export function toQualityCapabilities(
  capabilities: QualityRuntimeEngineCapabilities = DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
): QualityCapabilities {
  return {
    kind: "canonical-quality-capabilities",
    supportsPrepareQualityAssessment: capabilities.supportsPrepareQualityAssessment === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalQuality: capabilities.supportsCanonicalQuality === true,
    runtimeReady: true,
    qualityEngineImplemented: false,
    qualityScoreImplemented: false,
    ocrQualityImplemented: false,
    classificationQualityImplemented: false,
    extractionQualityImplemented: false,
    validationQualityImplemented: false,
    mappingQualityImplemented: false,
    autoFillQualityImplemented: false,
    auditQualityImplemented: false,
    approvalDecisionImplemented: false,
  };
}
