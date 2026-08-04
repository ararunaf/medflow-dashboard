/**
 * IntelligentCaptureRuntimeCapabilities — capacidades declarativas (F3-CAP-04).
 *
 * Apenas declaração estrutural. Sem OCR. Sem IA. Sem Pipeline.
 * Sem captura automática. Sem leitura de arquivos. Sem processamento documental.
 * Integrações Scanner/WatchFolder/Upload declaradas como não implementadas.
 */

import type { CaptureCapabilities } from "./canonical";

export type IntelligentCaptureRuntimeCapabilities = {
  supportsRegisterSource?: boolean;
  supportsUnregisterSource?: boolean;
  supportsDiscoverSources?: boolean;
  supportsOpenRequest?: boolean;
  supportsCloseRequest?: boolean;
  supportsRoute?: boolean;
  supportsEnvelope?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalCapture?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesScannerRuntimePort?: boolean;
  usesWatchFolderRuntimePort?: boolean;
  usesUploadRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesPersistentQueueRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesObservabilityRuntimePort?: boolean;
  runtimeReady?: true;
  scannerIntegrationImplemented?: false;
  watchFolderIntegrationImplemented?: false;
  uploadIntegrationImplemented?: false;
  capturePipelineImplemented?: false;
  documentRoutingImplemented?: false;
  automaticSelectionImplemented?: false;
  automaticCaptureImplemented?: false;
  ocrPipelineImplemented?: false;
  classificationPipelineImplemented?: false;
  processingPipelineImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyIntelligentCaptureRuntimeCapabilities(): IntelligentCaptureRuntimeCapabilities {
  return {};
}

export function defineIntelligentCaptureRuntimeCapabilities(
  capabilities: IntelligentCaptureRuntimeCapabilities = {},
): IntelligentCaptureRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES: IntelligentCaptureRuntimeCapabilities =
  {
    supportsRegisterSource: true,
    supportsUnregisterSource: true,
    supportsDiscoverSources: true,
    supportsOpenRequest: true,
    supportsCloseRequest: true,
    supportsRoute: true,
    supportsEnvelope: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalCapture: true,
    supportsTimeout: true,
    supportsRetry: true,
    supportsCancellation: true,
    supportsTelemetry: true,
    usesScannerRuntimePort: true,
    usesWatchFolderRuntimePort: true,
    usesUploadRuntimePort: true,
    usesOCRRuntimePort: true,
    usesPersistentQueueRuntimePort: true,
    usesSchedulerRuntimePort: true,
    usesWorkerRuntimePort: true,
    usesObservabilityRuntimePort: true,
    runtimeReady: true,
    scannerIntegrationImplemented: false,
    watchFolderIntegrationImplemented: false,
    uploadIntegrationImplemented: false,
    capturePipelineImplemented: false,
    documentRoutingImplemented: false,
    automaticSelectionImplemented: false,
    automaticCaptureImplemented: false,
    ocrPipelineImplemented: false,
    classificationPipelineImplemented: false,
    processingPipelineImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };

export const DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES: IntelligentCaptureRuntimeCapabilities =
  {
    ...DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
  };

export function toCanonicalCaptureCapabilities(
  capabilities: IntelligentCaptureRuntimeCapabilities = DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
): CaptureCapabilities {
  return {
    kind: "canonical-capture-capabilities",
    supportsRegisterSource: capabilities.supportsRegisterSource === true,
    supportsUnregisterSource: capabilities.supportsUnregisterSource === true,
    supportsDiscoverSources: capabilities.supportsDiscoverSources === true,
    supportsOpenRequest: capabilities.supportsOpenRequest === true,
    supportsCloseRequest: capabilities.supportsCloseRequest === true,
    supportsRoute: capabilities.supportsRoute === true,
    supportsEnvelope: capabilities.supportsEnvelope === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalCapture: capabilities.supportsCanonicalCapture === true,
    runtimeReady: true,
    scannerIntegrationImplemented: false,
    watchFolderIntegrationImplemented: false,
    uploadIntegrationImplemented: false,
    capturePipelineImplemented: false,
    documentRoutingImplemented: false,
    automaticSelectionImplemented: false,
    automaticCaptureImplemented: false,
    ocrPipelineImplemented: false,
    classificationPipelineImplemented: false,
    processingPipelineImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
