export {
  BUILTIN_OCR_PROVIDER_COUNT,
  OCRProviderRegistry,
  createDefaultOCRProviderRegistry,
  type OCRProviderRegistrySnapshot,
} from "./ocr-provider-registry";

export {
  listOCRProvidersFromProcessingFramework,
  registerOCRProviderWithProcessingFramework,
  type RegisterOCRWithProcessingFrameworkResult,
} from "./register-with-processing-provider-framework";
