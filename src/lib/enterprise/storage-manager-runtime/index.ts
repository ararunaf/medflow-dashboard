/**
 * Enterprise Storage Manager Runtime — Document Intelligence Platform (DIP-05).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → StorageManagerRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Storage Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * DIP-05: infraestrutura oficial de coordenação de armazenamento documental —
 * sem armazenamento real, sem upload, sem download, sem versionamento funcional,
 * sem retenção automática, sem Providers externos, sem I/O de arquivo físico.
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
  CoordinateStorageInput,
  CoordinateStorageResult,
  GetStorageManagerRuntimeSessionInput,
  GetStorageManagerRuntimeSessionResult,
  ListStorageManagerRuntimeSessionsInput,
  ListStorageManagerRuntimeSessionsResult,
  ListStorageProviderReferencesResult,
  StorageManagerRuntimeCapabilities,
  StorageManagerRuntimeEnterpriseDeps,
  StorageManagerRuntimeHealth,
  StorageManagerRuntimePort,
  StorageManagerRuntimeProviderId,
  StorageManagerRuntimeProviderOptions,
  StorageManagerRuntimeSessionStatus,
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
