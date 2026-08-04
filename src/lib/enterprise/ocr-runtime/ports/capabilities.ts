/**
 * OCRRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-05).
 *
 * Apenas declaração estrutural. Sem OCR real. Sem Tesseract / Azure / Google
 * Vision / AWS Textract / ABBYY / PaddleOCR. Sem IA. Sem extração de texto real.
 * Integrações estruturais (ICR/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/
 * Observability/Scalability) declaradas como preparadas — sem consumo funcional.
 */

import type { OCRCapabilities } from "./canonical";

export type OCRRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterDocument?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalOcr?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
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
  ocrEngineImplemented?: false;
  pdfOcrImplemented?: false;
  imageOcrImplemented?: false;
  documentRecognitionImplemented?: false;
  textExtractionImplemented?: false;
  barcodeRecognitionImplemented?: false;
  qrRecognitionImplemented?: false;
  layoutAnalysisImplemented?: false;
  tableRecognitionImplemented?: false;
  handwritingRecognitionImplemented?: false;
  multiEngineImplemented?: false;
  confidenceScoreImplemented?: false;
  languageDetectionImplemented?: false;
};

export function emptyOCRRuntimeEngineCapabilities(): OCRRuntimeEngineCapabilities {
  return {};
}

export function defineOCRRuntimeEngineCapabilities(
  capabilities: OCRRuntimeEngineCapabilities = {},
): OCRRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES: OCRRuntimeEngineCapabilities = {
  supportsOpenJob: true,
  supportsCloseJob: true,
  supportsSubmitRequest: true,
  supportsRegisterDocument: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalOcr: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
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
  ocrEngineImplemented: false,
  pdfOcrImplemented: false,
  imageOcrImplemented: false,
  documentRecognitionImplemented: false,
  textExtractionImplemented: false,
  barcodeRecognitionImplemented: false,
  qrRecognitionImplemented: false,
  layoutAnalysisImplemented: false,
  tableRecognitionImplemented: false,
  handwritingRecognitionImplemented: false,
  multiEngineImplemented: false,
  confidenceScoreImplemented: false,
  languageDetectionImplemented: false,
};

export const DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES: OCRRuntimeEngineCapabilities = {
  ...DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES,
};

export function toCanonicalOCRCapabilities(
  capabilities: OCRRuntimeEngineCapabilities = DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES,
): OCRCapabilities {
  return {
    kind: "canonical-ocr-cap-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterDocument: capabilities.supportsRegisterDocument === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalOcr: capabilities.supportsCanonicalOcr === true,
    runtimeReady: true,
    ocrEngineImplemented: false,
    pdfOcrImplemented: false,
    imageOcrImplemented: false,
    documentRecognitionImplemented: false,
    textExtractionImplemented: false,
    barcodeRecognitionImplemented: false,
    qrRecognitionImplemented: false,
    layoutAnalysisImplemented: false,
    tableRecognitionImplemented: false,
    handwritingRecognitionImplemented: false,
    multiEngineImplemented: false,
    confidenceScoreImplemented: false,
    languageDetectionImplemented: false,
  };
}
