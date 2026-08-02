/**
 * Enterprise Storage Provider — Ports & Adapters (STORAGE-01).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Runtime → OCR Runtime
 *     → Document Classification Runtime → Storage Manager Runtime
 *     → StorageProviderPort → DefaultStorageProviderAdapter → Storage Backend
 *
 * STORAGE-01: Storage Provider oficial (Supabase Storage homologado).
 * Sem acesso direto a Supabase Storage / Azure Blob / AWS S3 / GCS pelo produto.
 * Sem bypass ao StorageManagerRuntime / StorageProviderPort.
 */
export type {
  CanonicalStorageMetadata,
  CanonicalStorageResult,
  CanonicalStoredDocument,
  StorageDeleteInput,
  StorageDownloadInput,
  StorageMetadataInput,
  StorageProviderBackend,
  StorageProviderCapabilities,
  StorageProviderConfigurationValidation,
  StorageProviderHealth,
  StorageProviderId,
  StorageProviderInfo,
  StorageProviderMetadata,
  StorageProviderObjectBody,
  StorageProviderOperationResult,
  StorageProviderOptions,
  StorageProviderPort,
  StorageProviderPortCapabilities,
  StorageProviderRegistration,
  StorageProviderStatus,
  StorageProviderStructuredLog,
  StorageProviderTelemetry,
  StorageSignedUrlInput,
  StorageUploadInput,
} from "./ports";

export {
  DEFAULT_MOCK_STORAGE_PROVIDER_CAPABILITIES,
  DEFAULT_STORAGE_PROVIDER_CAPABILITIES,
  createStorageProviderRequestId,
  defineStorageProviderCapabilities,
  emptyStorageProviderCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_STORAGE_PROVIDER_VERSION,
  DEFAULT_STORAGE_PROVIDER_ADAPTER_ID,
  DEFAULT_STORAGE_PROVIDER_BUCKET,
  DEFAULT_STORAGE_PROVIDER_VERSION,
  DefaultStorageProviderAdapter,
  MOCK_STORAGE_PROVIDER_ADAPTER_ID,
  MockStorageProviderAdapter,
  SupabaseStorageProviderAdapter,
  createInMemoryStorageBackend,
  createSupabaseStorageBackend,
  type DefaultStorageProviderAdapterOptions,
  type MockStorageProviderAdapterOptions,
  type SupabaseStorageClientLike,
} from "./adapters";

export {
  StorageProviderFactory,
  createStorageProviderFactory,
  type StorageProviderFactoryOptions,
} from "./factory";

export {
  BUILTIN_STORAGE_PROVIDER_COUNT,
  StorageProviderRegistry,
  createDefaultStorageProviderRegistry,
  type StorageProviderRegistrySnapshot,
} from "./registry";

export {
  createBoundStorageProviderPort,
  createStorageProviderPort,
  getStorageProviderFactory,
} from "./providers";

export { getStorageProviderHealthSummary, type StorageProviderHealthSummary } from "./demo";
