export type {
  OcrBoundingBox,
  OcrCoordinates,
  OcrLine,
  OcrPage,
  OcrWord,
  RawOcrResult,
  OcrResultSummary,
} from "./types/raw-ocr-result";

export type {
  OcrProvider,
  OcrProviderCapabilities,
  OcrProviderHealth,
  OcrProviderExtractInput,
} from "./types/provider";

export type {
  OcrOrchestratorConfig,
  OcrOrchestratorInput,
  OcrOrchestratorResult,
} from "./types/orchestrator";

export {
  AzureDocumentIntelligenceProvider,
  Gpt4VisionProvider,
  TesseractProvider,
  createDefaultOcrProviders,
  buildRawOcrResult,
  resolveAzureConfig,
  CAPTURE_OCR_MAX_BYTES,
  CAPTURE_OCR_SUPPORTED_MIMES,
} from "./providers";

export {
  OcrOrchestrator,
  OcrProviderNotFoundError,
  OcrFallbackNotImplementedError,
  createDefaultOcrOrchestrator,
} from "./orchestrator/ocr-orchestrator";

export {
  OCR_RESULT_FILENAME,
  buildOcrResultStoragePath,
  persistOcrResult,
  loadOcrResult,
  getOcrResultSignedUrl,
  buildOcrSummaryFromResult,
  buildOcrSummaryFromMetadata,
} from "./infrastructure/ocr-storage";

export {
  OcrService,
  getDefaultOcrService,
  runCaptureOcr,
  getCaptureOcrResult,
  type RunCaptureOcrResult,
} from "./services/ocr-service";
