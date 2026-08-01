export type { OCRProviderPort } from "./ocr-provider-port";

export type {
  DocumentProcessingResult,
  OCRConfigurationValidation,
  OCRProcessInput,
  OCRProcessResult,
  OCRProviderHealth,
  OCRProviderId,
  OCRProviderInfo,
  OCRProviderMetadata,
  OCRProviderOptions,
  OCRProviderPortCapabilities,
  OCRProviderRegistration,
  OCRProviderStatus,
  ProcessingDocumentIdentityReference,
  ProcessingMetadataReference,
  ProcessingOutput,
  ProcessingStorageReference,
} from "./types";

export type { OCRCapabilities } from "./capabilities";

export {
  DEFAULT_MOCK_OCR_CAPABILITIES,
  defineOCRCapabilities,
  emptyOCRCapabilities,
} from "./capabilities";

export { createOCRRequestId } from "./identity";

export {
  FUTURE_NORMALIZATION_TAG,
  OCR_NORMALIZATION_EXTENSION_POINTS,
  extractCanonicalOutput,
  type FutureDocumentProcessingBridge,
  type FutureNormalizationApplicationHook,
  type FutureNormalizationPort,
} from "./extension-points";
