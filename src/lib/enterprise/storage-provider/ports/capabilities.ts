/**
 * StorageProviderCapabilities — capacidades declarativas (STORAGE-01).
 */

export type StorageProviderCapabilities = {
  supportedOperations?: readonly ("upload" | "download" | "delete" | "metadata" | "signedUrl")[];
  supportsSignedUrl?: boolean;
  supportsVersioning?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  supportsCanonicalResult?: boolean;
  maxObjectBytes?: number;
};

export function emptyStorageProviderCapabilities(): StorageProviderCapabilities {
  return {};
}

export function defineStorageProviderCapabilities(
  capabilities: StorageProviderCapabilities = {},
): StorageProviderCapabilities {
  return { ...capabilities };
}

export const DEFAULT_STORAGE_PROVIDER_CAPABILITIES: StorageProviderCapabilities = {
  supportedOperations: ["upload", "download", "delete", "metadata", "signedUrl"],
  supportsSignedUrl: true,
  supportsVersioning: false,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  supportsCanonicalResult: true,
  maxObjectBytes: 50 * 1024 * 1024,
};

export const DEFAULT_MOCK_STORAGE_PROVIDER_CAPABILITIES: StorageProviderCapabilities = {
  ...DEFAULT_STORAGE_PROVIDER_CAPABILITIES,
};
