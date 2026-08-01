/**
 * MockStorageAdapter / TestStorageAdapter — EPC-02.
 *
 * Permite testes, desenvolvimento, certificação e simulação futura
 * sem Supabase Storage e sem alterar produção.
 */
import type { StoragePort } from "../ports/storage-port";
import type {
  StorageCapabilities,
  StorageDeleteInput,
  StorageDeleteResult,
  StorageGetInput,
  StorageGetResult,
  StorageHealth,
  StorageProviderId,
  StoragePutInput,
  StoragePutResult,
  StorageSignedUrlInput,
  StorageSignedUrlResult,
} from "../ports/types";

export type MockStorageAdapterOptions = {
  provider?: Extract<StorageProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
};

function toUint8Array(body: StoragePutInput["body"]): Uint8Array {
  if (typeof body === "string") {
    return new TextEncoder().encode(body);
  }
  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }
  return body;
}

type StoredObject = {
  body: Uint8Array;
  contentType?: string;
};

export class MockStorageAdapter implements StoragePort {
  readonly providerId: Extract<StorageProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly objects = new Map<string, StoredObject>();

  constructor(options: MockStorageAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} storage ready.`;
  }

  capabilities(): StorageCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsPut: true,
      supportsGet: true,
      supportsDelete: true,
      supportsSignedUrl: true,
      supportsVersioning: false,
    };
  }

  async health(): Promise<StorageHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async put(input: StoragePutInput): Promise<StoragePutResult> {
    const body = toUint8Array(input.body);
    this.objects.set(input.key, { body, contentType: input.contentType });
    return {
      ok: true,
      key: input.key,
      etag: `mock-${body.byteLength}`,
      message: "stored in memory",
    };
  }

  async get(input: StorageGetInput): Promise<StorageGetResult> {
    const stored = this.objects.get(input.key);
    if (!stored) {
      return { ok: false, key: input.key, message: "not found" };
    }
    return {
      ok: true,
      key: input.key,
      body: stored.body,
      contentType: stored.contentType,
    };
  }

  async delete(input: StorageDeleteInput): Promise<StorageDeleteResult> {
    const existed = this.objects.delete(input.key);
    return {
      ok: existed,
      key: input.key,
      message: existed ? "deleted" : "not found",
    };
  }

  async signedUrl(input: StorageSignedUrlInput): Promise<StorageSignedUrlResult> {
    if (!this.objects.has(input.key)) {
      return { ok: false, key: input.key, message: "not found" };
    }
    const expiresInSeconds = input.expiresInSeconds ?? 60;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    return {
      ok: true,
      key: input.key,
      url: `mock://${this.providerId}/${encodeURIComponent(input.key)}?exp=${expiresInSeconds}`,
      expiresAt,
      message: "mock signed url",
    };
  }
}
