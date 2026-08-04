/**
 * DocumentExtractionRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-07).
 *
 * Apenas declaração estrutural. Sem extração real. Sem OCR. Sem IA. Sem ML.
 * Sem LLM. Sem Regex. Sem Template Matching. Sem leitura de campos.
 * Integrações estruturais (DocumentClassification/OCR/ICR/Scanner/WatchFolder/
 * Upload/PQR/Worker/Scheduler/Observability/Scalability) declaradas como
 * preparadas — sem consumo funcional.
 */

import type { ExtractionCapabilities } from "./canonical";

export type DocumentExtractionRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterDocument?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalExtraction?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesDocumentClassificationRuntimePort?: boolean;
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
  fieldExtractionImplemented?: false;
  structuredExtractionImplemented?: false;
  medicalGuideExtractionImplemented?: false;
  tableExtractionImplemented?: false;
  templateExtractionImplemented?: false;
  automaticMappingImplemented?: false;
  confidenceScoreImplemented?: false;
  barcodeExtractionImplemented?: false;
  qrExtractionImplemented?: false;
  pipelineSelectionImplemented?: false;
};

export function emptyDocumentExtractionRuntimeEngineCapabilities(): DocumentExtractionRuntimeEngineCapabilities {
  return {};
}

export function defineDocumentExtractionRuntimeEngineCapabilities(
  capabilities: DocumentExtractionRuntimeEngineCapabilities = {},
): DocumentExtractionRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES: DocumentExtractionRuntimeEngineCapabilities =
  {
    supportsOpenJob: true,
    supportsCloseJob: true,
    supportsSubmitRequest: true,
    supportsRegisterDocument: true,
    supportsGetResult: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalExtraction: true,
    supportsTimeout: true,
    supportsRetry: true,
    supportsCancellation: true,
    supportsTelemetry: true,
    usesDocumentClassificationRuntimePort: true,
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
    fieldExtractionImplemented: false,
    structuredExtractionImplemented: false,
    medicalGuideExtractionImplemented: false,
    tableExtractionImplemented: false,
    templateExtractionImplemented: false,
    automaticMappingImplemented: false,
    confidenceScoreImplemented: false,
    barcodeExtractionImplemented: false,
    qrExtractionImplemented: false,
    pipelineSelectionImplemented: false,
  };

export const DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES: DocumentExtractionRuntimeEngineCapabilities =
  {
    ...DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalExtractionCapabilities(
  capabilities: DocumentExtractionRuntimeEngineCapabilities = DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
): ExtractionCapabilities {
  return {
    kind: "canonical-extraction-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterDocument: capabilities.supportsRegisterDocument === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalExtraction: capabilities.supportsCanonicalExtraction === true,
    runtimeReady: true,
    fieldExtractionImplemented: false,
    structuredExtractionImplemented: false,
    medicalGuideExtractionImplemented: false,
    tableExtractionImplemented: false,
    templateExtractionImplemented: false,
    automaticMappingImplemented: false,
    confidenceScoreImplemented: false,
    barcodeExtractionImplemented: false,
    qrExtractionImplemented: false,
    pipelineSelectionImplemented: false,
  };
}
