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
 * EPC-15 / OCR-01: Processing Provider oficial.
 * HTTP Azure exclusivamente em AzureDocumentIntelligenceAdapter.
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
  AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID,
  AZURE_DOCUMENT_INTELLIGENCE_API_VERSION,
  AZURE_DOCUMENT_INTELLIGENCE_PROVIDER_VERSION,
  AzureDocumentIntelligenceAdapter,
  DEFAULT_AZURE_OCR_CAPABILITIES,
  DEFAULT_MOCK_OCR_PROVIDER_VERSION,
  DefaultMockOCRProvider,
  MOCK_OCR_PROVIDER_ADAPTER_ID,
  MockOCRProviderAdapter,
  resolveAzureDocumentIntelligenceConfig,
  type AzureDocumentIntelligenceAdapterOptions,
  type AzureFetchFn,
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
