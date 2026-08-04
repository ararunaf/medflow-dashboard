/**
 * DocumentClassificationRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-06).
 *
 * Apenas declaração estrutural. Sem IA. Sem ML. Sem LLM. Sem OCR real. Sem
 * template matching. Sem roteamento automático. Sem visão computacional.
 * Integrações estruturais (OCR/IntelligentCapture/Scanner/WatchFolder/Upload/
 * PQR/Worker/Scheduler/Observability/Scalability) declaradas como preparadas —
 * sem consumo funcional.
 */

import type { ClassificationCapabilities } from "./canonical";

export type DocumentClassificationRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterDocument?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalClassification?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesOCRRuntimePort?: boolean;
  usesIntelligentCaptureRuntimePort?: boolean;
  usesScannerRuntimePort?: boolean;
  usesWatchFolderRuntimePort?: boolean;
  usesUploadRuntimePort?: boolean;
  usesPersistentQueueRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  usesObservabilityRuntimePort?: boolean;
  usesScalabilityRuntimePort?: boolean;
  runtimeReady?: true;
  classificationImplemented?: false;
  documentRecognitionImplemented?: false;
  templateRecognitionImplemented?: false;
  medicalGuideRecognitionImplemented?: false;
  documentCategoryImplemented?: false;
  automaticRoutingImplemented?: false;
  confidenceScoreImplemented?: false;
  multiClassifierImplemented?: false;
  layoutClassificationImplemented?: false;
  semanticClassificationImplemented?: false;
};

export function emptyDocumentClassificationRuntimeEngineCapabilities(): DocumentClassificationRuntimeEngineCapabilities {
  return {};
}

export function defineDocumentClassificationRuntimeEngineCapabilities(
  capabilities: DocumentClassificationRuntimeEngineCapabilities = {},
): DocumentClassificationRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES: DocumentClassificationRuntimeEngineCapabilities =
  {
    supportsOpenJob: true,
    supportsCloseJob: true,
    supportsSubmitRequest: true,
    supportsRegisterDocument: true,
    supportsGetResult: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalClassification: true,
    supportsTimeout: true,
    supportsRetry: true,
    supportsCancellation: true,
    supportsTelemetry: true,
    usesOCRRuntimePort: true,
    usesIntelligentCaptureRuntimePort: true,
    usesScannerRuntimePort: true,
    usesWatchFolderRuntimePort: true,
    usesUploadRuntimePort: true,
    usesPersistentQueueRuntimePort: true,
    usesWorkerRuntimePort: true,
    usesSchedulerRuntimePort: true,
    usesObservabilityRuntimePort: true,
    usesScalabilityRuntimePort: true,
    runtimeReady: true,
    classificationImplemented: false,
    documentRecognitionImplemented: false,
    templateRecognitionImplemented: false,
    medicalGuideRecognitionImplemented: false,
    documentCategoryImplemented: false,
    automaticRoutingImplemented: false,
    confidenceScoreImplemented: false,
    multiClassifierImplemented: false,
    layoutClassificationImplemented: false,
    semanticClassificationImplemented: false,
  };

export const DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES: DocumentClassificationRuntimeEngineCapabilities =
  {
    ...DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalClassificationCapabilities(
  capabilities: DocumentClassificationRuntimeEngineCapabilities = DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
): ClassificationCapabilities {
  return {
    kind: "canonical-classification-cap-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterDocument: capabilities.supportsRegisterDocument === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalClassification: capabilities.supportsCanonicalClassification === true,
    runtimeReady: true,
    classificationImplemented: false,
    documentRecognitionImplemented: false,
    templateRecognitionImplemented: false,
    medicalGuideRecognitionImplemented: false,
    documentCategoryImplemented: false,
    automaticRoutingImplemented: false,
    confidenceScoreImplemented: false,
    multiClassifierImplemented: false,
    layoutClassificationImplemented: false,
    semanticClassificationImplemented: false,
  };
}
