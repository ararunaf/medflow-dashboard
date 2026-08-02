/**
 * MockStorageProviderAdapter — STORAGE-01.
 *
 * Implementação totalmente determinística in-memory.
 * Sem HTTP. Sem Supabase. Sem Azure/AWS/GCS.
 */
import { DEFAULT_MOCK_STORAGE_PROVIDER_CAPABILITIES } from "../ports/capabilities";
import { createStorageProviderRequestId } from "../ports/identity";
import type { StorageProviderPort } from "../ports/storage-provider-port";
import type {
  StorageDeleteInput,
  StorageDownloadInput,
  StorageMetadataInput,
  StorageProviderConfigurationValidation,
  StorageProviderHealth,
  StorageProviderId,
  StorageProviderInfo,
  StorageProviderMetadata,
  StorageProviderOperationResult,
  StorageProviderPortCapabilities,
  StorageSignedUrlInput,
  StorageUploadInput,
} from "../ports/types";
import { createInMemoryStorageBackend } from "./in-memory-storage-backend";
import { DefaultStorageProviderAdapter } from "./default-storage-provider-adapter";

export const MOCK_STORAGE_PROVIDER_ADAPTER_ID = "mock-deterministic-storage";
export const DEFAULT_MOCK_STORAGE_PROVIDER_VERSION = "1.0.0";

export type MockStorageProviderAdapterOptions = {
  provider?: Extract<StorageProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
};

function mockMetadata(
  providerId: Extract<StorageProviderId, "mock" | "test">,
): StorageProviderMetadata {
  return {
    name: providerId === "test" ? "Test Storage Provider" : "Mock Storage Provider",
    version: DEFAULT_MOCK_STORAGE_PROVIDER_VERSION,
    vendor: "medicflow-enterprise",
    description: "Deterministic in-process storage mock — no network.",
  };
}

/**
 * Mock adapter — delega I/O ao Default com backend in-memory e provider mock/test.
 */
export class MockStorageProviderAdapter implements StorageProviderPort {
  readonly providerId: Extract<StorageProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: StorageProviderMetadata;
  private readonly delegate: DefaultStorageProviderAdapter;

  constructor(options: MockStorageProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} storage provider ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);
    this.delegate = new DefaultStorageProviderAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      backend: createInMemoryStorageBackend(),
    });
  }

  capabilities(): StorageProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_STORAGE_PROVIDER_ADAPTER_ID,
      storage: { ...DEFAULT_MOCK_STORAGE_PROVIDER_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsUpload: true,
      supportsDownload: true,
      supportsDelete: true,
      supportsMetadata: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealStorage: true,
    };
  }

  providerInfo(): StorageProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_STORAGE",
      capabilities: { ...DEFAULT_MOCK_STORAGE_PROVIDER_CAPABILITIES },
    };
  }

  async health(): Promise<StorageProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy ? "ready" : "unhealthy",
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<StorageProviderConfigurationValidation> {
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: "Mock storage provider não requer configuração externa.",
    };
  }

  async upload(input: StorageUploadInput): Promise<StorageProviderOperationResult> {
    const result = await this.delegate.upload(input);
    return this.remap(result);
  }

  async download(input: StorageDownloadInput): Promise<StorageProviderOperationResult> {
    const result = await this.delegate.download(input);
    return this.remap(result);
  }

  async delete(input: StorageDeleteInput): Promise<StorageProviderOperationResult> {
    const result = await this.delegate.delete(input);
    return this.remap(result);
  }

  async metadata(input: StorageMetadataInput): Promise<StorageProviderOperationResult> {
    const result = await this.delegate.metadata(input);
    return this.remap(result);
  }

  async signedUrl(input: StorageSignedUrlInput): Promise<StorageProviderOperationResult> {
    const result = await this.delegate.signedUrl(input);
    return this.remap(result);
  }

  async publicUrl(input: StorageMetadataInput): Promise<StorageProviderOperationResult> {
    const result = await this.delegate.publicUrl(input);
    return this.remap(result);
  }

  private remap(result: StorageProviderOperationResult): StorageProviderOperationResult {
    const requestId = result.requestId ?? createStorageProviderRequestId();
    return {
      ...result,
      requestId,
      provider: this.providerId,
      providerId: this.providerId,
      simulated: true,
      storedDocument: result.storedDocument
        ? { ...result.storedDocument, providerId: this.providerId }
        : undefined,
    };
  }
}
