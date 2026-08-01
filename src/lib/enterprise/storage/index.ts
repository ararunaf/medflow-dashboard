/**
 * Enterprise Storage — Ports & Adapters (EPC-02).
 *
 * Fluxo oficial:
 *   Application → StoragePort → Adapter → Storage Provider (Supabase hoje)
 *
 * Domain/Application NÃO devem importar @/lib/supabase nem @supabase/* storage.
 */
export type {
  StorageCapabilities,
  StorageDeleteInput,
  StorageDeleteResult,
  StorageDocumentContext,
  StorageGetInput,
  StorageGetResult,
  StorageHealth,
  StorageObjectBody,
  StoragePort,
  StorageProviderId,
  StorageProviderOptions,
  StoragePutInput,
  StoragePutResult,
  StorageSignedUrlInput,
  StorageSignedUrlResult,
} from "./ports";

export {
  MockStorageAdapter,
  SUPABASE_STORAGE_ADAPTER_ID,
  SupabaseStorageAdapter,
  type MockStorageAdapterOptions,
  type SupabaseStorageRuntime,
} from "./adapters";

export { createStoragePort } from "./providers";

export { getStorageHealthSummary, type StorageHealthSummary } from "./demo";
