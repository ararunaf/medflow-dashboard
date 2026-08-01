/**
 * Enterprise OCR Provider Foundation — Ports & Adapters (EPC-15).
 *
 * Fluxo oficial:
 *   Application → OCRProviderPort → OCRProviderAdapter
 *     → OCRProviderFactory → OCRProviderRegistry
 *     → Processing Provider Framework (EPC-14)
 *     → Document Processing Foundation (EPC-13)
 *
 * O OCR apenas extrai conteúdo. Produz exclusivamente ProcessingOutput.
 * Nunca interpreta, valida ou toma decisões.
 * Nunca conhece cooperativas, operadoras, contratos, TISS, AI,
 * Workflow ou Rule Engine.
 *
 * EPC-15: fundação do primeiro Processing Provider.
 * NÃO implementa OCR real, HTTP, IA, Upload, Scanner, UI, APIs ou banco.
 */
export type {
  DocumentProcessingResult,
  FutureDocumentProcessingBridge,
  FutureNormalizationApplicationHook,
  FutureNormalizationPort,
  OCRCapabilities,
  OCRConfigurationValidation,
  OCRProcessInput,
  OCRProcessResult,
  OCRProviderHealth,
  OCRProviderId,
  OCRProviderInfo,
  OCRProviderMetadata,
  OCRProviderOptions,
  OCRProviderPort,
  OCRProviderPortCapabilities,
  OCRProviderRegistration,
  OCRProviderStatus,
  ProcessingDocumentIdentityReference,
  ProcessingMetadataReference,
  ProcessingOutput,
  ProcessingStorageReference,
} from "./ports";

export {
  DEFAULT_MOCK_OCR_CAPABILITIES,
  FUTURE_NORMALIZATION_TAG,
  OCR_NORMALIZATION_EXTENSION_POINTS,
  createOCRRequestId,
  defineOCRCapabilities,
  emptyOCRCapabilities,
  extractCanonicalOutput,
} from "./ports";

export {
  DEFAULT_MOCK_OCR_PROVIDER_VERSION,
  DefaultMockOCRProvider,
  MOCK_OCR_PROVIDER_ADAPTER_ID,
  MockOCRProviderAdapter,
  type MockOCRProviderAdapterOptions,
} from "./adapters";

export {
  DEFAULT_MOCK_OCR_PROVIDER_ID,
  DEFAULT_MOCK_OCR_PROVIDER_NAME,
  DEFAULT_MOCK_OCR_PROVIDER_VERSION as OCR_PROVIDER_DESCRIPTOR_VERSION,
  buildOCRProviderDescriptor,
  createDefaultMockOCRProviderDescriptor,
  mapOCRCapabilitiesToProviderCapabilities,
  type BuildOCRProviderDescriptorInput,
} from "./descriptor";

export {
  OCRProviderFactory,
  createOCRProviderFactory,
  type OCRProviderFactoryOptions,
} from "./factory";

export {
  BUILTIN_OCR_PROVIDER_COUNT,
  OCRProviderRegistry,
  createDefaultOCRProviderRegistry,
  listOCRProvidersFromProcessingFramework,
  registerOCRProviderWithProcessingFramework,
  type OCRProviderRegistrySnapshot,
  type RegisterOCRWithProcessingFrameworkResult,
} from "./registry";

export { createOCRProviderPort, getOCRProviderFactory } from "./providers";

export { getOCRProviderHealthSummary, type OCRProviderHealthSummary } from "./demo";
