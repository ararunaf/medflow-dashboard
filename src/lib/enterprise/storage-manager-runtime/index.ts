/**
 * Enterprise Storage Manager Runtime — Document Intelligence Platform (DIP-05 / STORAGE-01).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → StorageManagerRuntimePort
 *     → Canonical Execution Orchestrator
 *     → StorageProviderPort
 *     → Storage Provider Adapter
 *     → Storage Backend
 *
 * STORAGE-01: persistência documental exclusivamente via StorageProviderPort.
 */
export type {
  CanonicalStorageCapabilities,
  CanonicalStorageConfiguration,
  CanonicalStorageIdentity,
  CanonicalStorageMetadata,
  CanonicalStorageProviderReference,
  CanonicalStorageProviderReferenceId,
  CanonicalStorageReference,
  CanonicalStorageRequest,
  CanonicalStorageResult,
  CanonicalStorageSession,
  CanonicalStoredDocument,
  CoordinateStorageInput,
  CoordinateStorageResult,
  GetStorageManagerRuntimeSessionInput,
  GetStorageManagerRuntimeSessionResult,
  ListStorageManagerRuntimeSessionsInput,
  ListStorageManagerRuntimeSessionsResult,
  ListStorageProviderReferencesResult,
  StorageManagerDeleteInput,
  StorageManagerDownloadInput,
  StorageManagerMetadataInput,
  StorageManagerProviderOperationResult,
  StorageManagerRuntimeCapabilities,
  StorageManagerRuntimeEnterpriseDeps,
  StorageManagerRuntimeHealth,
  StorageManagerRuntimePort,
  StorageManagerRuntimeProviderId,
  StorageManagerRuntimeProviderOptions,
  StorageManagerRuntimeSessionStatus,
  StorageManagerUploadInput,
} from "./ports";

export {
  STRUCTURAL_STORAGE_PROVIDER_REFERENCES,
  createStorageManagerRuntimeSessionId,
  resetAllStorageManagerRuntimeIdSequences,
  resetStorageManagerRuntimeSessionIdSequence,
  resolveStructuralStorageProviderReference,
} from "./ports";

export {
  DEFAULT_STORAGE_MANAGER_RUNTIME_ADAPTER_ID,
  DefaultStorageManagerRuntimeAdapter,
  MOCK_STORAGE_MANAGER_RUNTIME_ADAPTER_ID,
  MockStorageManagerRuntimeAdapter,
  STRUCTURAL_STORAGE_PROVIDER_ADAPTER_ID,
  type DefaultStorageManagerRuntimeAdapterOptions,
  type MockStorageManagerRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_STORAGE_MANAGER_RUNTIME_STORE_ID,
  InMemoryStorageManagerRuntimeStore,
  type InMemoryStorageManagerRuntimeStoreOptions,
  type StorageManagerRuntimeStore,
  type StoredStorageManagerRuntimeSession,
} from "./store";

export {
  StorageManagerRuntimeFactory,
  createStorageManagerRuntimeFactory,
  type StorageManagerRuntimeFactoryOptions,
} from "./factory";

export { createStorageManagerRuntimePort } from "./providers";

export {
  getStorageManagerRuntimeHealthSummary,
  type StorageManagerRuntimeHealthSummary,
} from "./demo";
