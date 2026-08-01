/**
 * Enterprise Processing Provider Framework — Ports & Adapters (EPC-14).
 *
 * Fluxo oficial:
 *   Application → ProcessingProviderPort → ProcessingProviderAdapter
 *     → ProcessingProviderRegistry → ProcessingProviderFactory
 *     → ProcessingProviderProvider
 *
 * Domain/Application NÃO devem importar implementações de OCR, IA, PDF, XML,
 * Barcode, QRCode, HL7, DICOM, parsers, upload ou scanner.
 *
 * O Framework é genérico e reutilizável por qualquer produto da IAeasy.
 * Providers nunca conversam diretamente entre si.
 * Comunicação futura ocorre via Document Processing Foundation + ProcessingOutput.
 *
 * Especializações de domínio ficam FORA deste componente.
 */
export type {
  GetProviderInput,
  GetProviderResult,
  HealthStatus,
  ListProvidersInput,
  ListProvidersResult,
  ProcessingProviderCapabilities,
  ProcessingProviderHealth,
  ProcessingProviderPort,
  ProcessingProviderProviderId,
  ProcessingProviderProviderOptions,
  ProviderCapabilities,
  ProviderConfigurationReference,
  ProviderDescriptor,
  ProviderId,
  ProviderMetadataReference,
  ProviderName,
  ProviderTag,
  ProviderType,
  ProviderVersion,
  RegisterProviderInput,
  RegisterProviderResult,
  UnregisterProviderInput,
  UnregisterProviderResult,
} from "./ports";

export {
  HEALTH_STATUSES,
  PROVIDER_TYPES,
  createProviderId,
  declaresAsync,
  declaresAttachments,
  declaresBatch,
  declaresConfidence,
  declaresMetadata,
  declaresStreaming,
  defineProviderCapabilities,
  emptyProviderCapabilities,
  hasKnownProviderType,
  listProviderTypes,
  providerHasKnownProviderType,
  resetProviderIdSequence,
} from "./ports";

export {
  DEFAULT_PROCESSING_PROVIDER_ADAPTER_ID,
  DefaultMockProcessingProvider,
  DefaultProcessingProviderAdapter,
  MockProcessingProviderAdapter,
  type DefaultProcessingProviderRuntime,
  type MockProcessingProviderAdapterOptions,
} from "./adapters";

export {
  BUILTIN_PROCESSING_PROVIDER_COUNT,
  ProcessingProviderRegistry,
  createDefaultProcessingProviderRegistry,
  type ProcessingProviderRegistryOptions,
  type ProcessingProviderRegistrySnapshot,
} from "./registry";

export {
  ProcessingProviderFactory,
  createProcessingProviderFactory,
  type ProcessingProviderFactoryOptions,
} from "./factory";

export { createProcessingProviderPort } from "./providers";

export { getProcessingProviderHealthSummary, type ProcessingProviderHealthSummary } from "./demo";
