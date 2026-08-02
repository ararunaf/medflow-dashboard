/**
 * DefaultStorageProviderAdapter — STORAGE-01.
 *
 * Adapter oficial de persistência documental.
 * Reutiliza backend homologado (Supabase Storage) via StorageProviderBackend.
 * Sem bypass. Sem Azure Blob / AWS S3 / GCS diretos.
 *
 * Implementa: upload, download, delete, metadata,
 * timeout, retry, cancelamento, logging estrutural, telemetria estrutural,
 * CanonicalStorageResult / CanonicalStorageMetadata / CanonicalStoredDocument.
 */
import { DEFAULT_STORAGE_PROVIDER_CAPABILITIES } from "../ports/capabilities";
import { createStorageProviderRequestId } from "../ports/identity";
import type { StorageProviderPort } from "../ports/storage-provider-port";
import type {
  CanonicalStorageMetadata,
  CanonicalStoredDocument,
  StorageDeleteInput,
  StorageDownloadInput,
  StorageMetadataInput,
  StorageProviderBackend,
  StorageProviderConfigurationValidation,
  StorageProviderHealth,
  StorageProviderId,
  StorageProviderInfo,
  StorageProviderMetadata,
  StorageProviderObjectBody,
  StorageProviderOperationResult,
  StorageProviderPortCapabilities,
  StorageProviderStructuredLog,
  StorageSignedUrlInput,
  StorageUploadInput,
} from "../ports/types";
import { createInMemoryStorageBackend } from "./in-memory-storage-backend";

export const DEFAULT_STORAGE_PROVIDER_ADAPTER_ID = "default-storage-provider";
export const DEFAULT_STORAGE_PROVIDER_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultStorageProviderAdapterOptions = {
  provider?: Extract<StorageProviderId, "default" | "supabase">;
  healthy?: boolean;
  message?: string;
  backend?: StorageProviderBackend;
  defaultContainer?: string;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(
  input:
    | StorageUploadInput
    | StorageDownloadInput
    | StorageDeleteInput
    | StorageMetadataInput
    | StorageSignedUrlInput,
): AbortSignal | undefined {
  if (input.signal instanceof AbortSignal) return input.signal;
  const attr = input.attributes?.signal;
  return attr instanceof AbortSignal ? attr : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return fallback;
}

function toUint8Array(body: StorageProviderObjectBody): Uint8Array {
  if (typeof body === "string") return new TextEncoder().encode(body);
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return body;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Adapter oficial STORAGE-01 — Storage Provider default / supabase.
 */
export class DefaultStorageProviderAdapter implements StorageProviderPort {
  readonly providerId: Extract<StorageProviderId, "default" | "supabase">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly backend: StorageProviderBackend;
  private readonly defaultContainer: string;
  private readonly providerMetadata: StorageProviderMetadata;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultStorageProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "supabase";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} storage provider ready (STORAGE-01 — via StorageProviderPort).`;
    this.backend = options.backend ?? createInMemoryStorageBackend();
    this.defaultContainer = options.defaultContainer ?? "clinical-documents";
    this.providerMetadata = {
      name:
        this.providerId === "default" ? "Default Storage Provider" : "Supabase Storage Provider",
      version: DEFAULT_STORAGE_PROVIDER_VERSION,
      vendor: this.providerId === "supabase" ? "Supabase" : "medicflow-enterprise",
      description:
        "Official STORAGE-01 document storage provider — sole authorized persistence path.",
    };
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  capabilities(): StorageProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_STORAGE_PROVIDER_ADAPTER_ID,
      storage: { ...DEFAULT_STORAGE_PROVIDER_CAPABILITIES },
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
      capabilities: { ...DEFAULT_STORAGE_PROVIDER_CAPABILITIES },
    };
  }

  async health(): Promise<StorageProviderHealth> {
    if (!this.healthy) {
      return {
        ok: false,
        provider: this.providerId,
        latencyMs: 0,
        status: "unhealthy",
        message: this.message,
      };
    }
    if (this.backend.health) {
      const probe = await this.backend.health();
      return {
        ok: probe.ok,
        provider: this.providerId,
        latencyMs: 0,
        status: probe.ok ? "ready" : "unhealthy",
        message: probe.message ?? this.message,
      };
    }
    return {
      ok: true,
      provider: this.providerId,
      latencyMs: 0,
      status: "ready",
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<StorageProviderConfigurationValidation> {
    if (!this.backend) {
      return {
        ok: false,
        provider: this.providerId,
        errors: ["StorageProviderBackend ausente."],
        warnings: [],
        message: "Backend não configurado.",
      };
    }
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: `${this.providerId} storage provider configuration ok.`,
    };
  }

  async upload(input: StorageUploadInput): Promise<StorageProviderOperationResult> {
    return this.runOperation("upload", input, async () => {
      const body = toUint8Array(input.body);
      const result = await this.backend.upload({
        key: input.key,
        body,
        contentType: input.contentType,
        container: input.container ?? this.defaultContainer,
        upsert: input.upsert,
      });
      if (!result.ok) {
        throw new Error(result.message ?? "Upload failed.");
      }
      const stamp = this.now();
      const metadata = this.buildMetadata(input, {
        contentType: input.contentType,
        sizeBytes: body.byteLength,
        etag: result.etag,
      });
      const storedDocument = this.buildStoredDocument(input, {
        contentType: input.contentType,
        sizeBytes: body.byteLength,
        etag: result.etag,
        createdAt: stamp,
        updatedAt: stamp,
        metadata,
      });
      return {
        ok: true,
        operation: "upload" as const,
        storedDocument,
        metadata,
        message: result.message ?? "Upload completed.",
        code: "STORAGE_UPLOADED",
        realStorageExecuted: true,
        realUploadExecuted: true,
        realDownloadExecuted: false,
        realDeleteExecuted: false,
        bytes: body.byteLength,
      };
    });
  }

  async download(input: StorageDownloadInput): Promise<StorageProviderOperationResult> {
    return this.runOperation("download", input, async () => {
      const result = await this.backend.download({
        key: input.key,
        container: input.container ?? this.defaultContainer,
      });
      if (!result.ok || !result.body) {
        throw new Error(result.message ?? "Download failed.");
      }
      const metadata = this.buildMetadata(input, {
        contentType: result.contentType,
        sizeBytes: result.body.byteLength,
      });
      const storedDocument = this.buildStoredDocument(input, {
        contentType: result.contentType,
        sizeBytes: result.body.byteLength,
        metadata,
      });
      return {
        ok: true,
        operation: "download" as const,
        storedDocument,
        metadata,
        body: result.body,
        message: result.message ?? "Download completed.",
        code: "STORAGE_DOWNLOADED",
        realStorageExecuted: true,
        realUploadExecuted: false,
        realDownloadExecuted: true,
        realDeleteExecuted: false,
        bytes: result.body.byteLength,
      };
    });
  }

  async delete(input: StorageDeleteInput): Promise<StorageProviderOperationResult> {
    return this.runOperation("delete", input, async () => {
      const result = await this.backend.delete({
        key: input.key,
        container: input.container ?? this.defaultContainer,
      });
      if (!result.ok) {
        throw new Error(result.message ?? "Delete failed.");
      }
      const metadata = this.buildMetadata(input, {});
      const storedDocument = this.buildStoredDocument(input, { metadata });
      return {
        ok: true,
        operation: "delete" as const,
        storedDocument,
        metadata,
        message: result.message ?? "Delete completed.",
        code: "STORAGE_DELETED",
        realStorageExecuted: true,
        realUploadExecuted: false,
        realDownloadExecuted: false,
        realDeleteExecuted: true,
        bytes: 0,
      };
    });
  }

  async metadata(input: StorageMetadataInput): Promise<StorageProviderOperationResult> {
    return this.runOperation("metadata", input, async () => {
      const result = await this.backend.metadata({
        key: input.key,
        container: input.container ?? this.defaultContainer,
      });
      if (!result.ok) {
        throw new Error(result.message ?? "Metadata failed.");
      }
      const metadata = this.buildMetadata(input, {
        contentType: result.contentType,
        sizeBytes: result.sizeBytes,
        etag: result.etag,
        lastModified: result.lastModified,
      });
      const storedDocument = this.buildStoredDocument(input, {
        contentType: result.contentType,
        sizeBytes: result.sizeBytes,
        etag: result.etag,
        updatedAt: result.lastModified,
        metadata,
      });
      return {
        ok: true,
        operation: "metadata" as const,
        storedDocument,
        metadata,
        message: result.message ?? "Metadata completed.",
        code: "STORAGE_METADATA",
        realStorageExecuted: true,
        realUploadExecuted: false,
        realDownloadExecuted: false,
        realDeleteExecuted: false,
        bytes: result.sizeBytes ?? 0,
      };
    });
  }

  async signedUrl(input: StorageSignedUrlInput): Promise<StorageProviderOperationResult> {
    return this.runOperation("signedUrl", input, async () => {
      if (!this.backend.signedUrl) {
        throw new Error("Signed URL not supported by storage backend.");
      }
      const result = await this.backend.signedUrl({
        key: input.key,
        container: input.container ?? this.defaultContainer,
        expiresInSeconds: input.expiresInSeconds,
        downloadFilename: input.downloadFilename,
      });
      if (!result.ok || !result.url) {
        throw new Error(result.message ?? "Signed URL failed.");
      }
      const metadata = this.buildMetadata(input, {});
      const storedDocument = this.buildStoredDocument(input, { metadata });
      return {
        ok: true,
        operation: "signedUrl" as const,
        storedDocument,
        metadata,
        signedUrl: result.url,
        expiresAt: result.expiresAt,
        message: result.message ?? "Signed URL completed.",
        code: "STORAGE_SIGNED_URL",
        realStorageExecuted: true,
        realUploadExecuted: false,
        realDownloadExecuted: false,
        realDeleteExecuted: false,
        bytes: 0,
      };
    });
  }

  async publicUrl(input: StorageMetadataInput): Promise<StorageProviderOperationResult> {
    return this.runOperation("signedUrl", input, async () => {
      if (!this.backend.publicUrl) {
        throw new Error("Public URL not supported by storage backend.");
      }
      const result = await this.backend.publicUrl({
        key: input.key,
        container: input.container ?? this.defaultContainer,
      });
      if (!result.ok || !result.url) {
        throw new Error(result.message ?? "Public URL failed.");
      }
      const metadata = this.buildMetadata(input, {});
      const storedDocument = this.buildStoredDocument(input, { metadata });
      return {
        ok: true,
        operation: "signedUrl" as const,
        storedDocument,
        metadata,
        signedUrl: result.url,
        message: result.message ?? "Public URL completed.",
        code: "STORAGE_PUBLIC_URL",
        realStorageExecuted: true,
        realUploadExecuted: false,
        realDownloadExecuted: false,
        realDeleteExecuted: false,
        bytes: 0,
      };
    });
  }

  private buildMetadata(
    input: {
      sessionId?: string;
      tenantRef?: string;
      correlationId?: string;
      key: string;
    },
    extras: Partial<CanonicalStorageMetadata>,
  ): CanonicalStorageMetadata {
    return {
      kind: "canonical-storage-metadata",
      sessionId: input.sessionId ?? input.key,
      tenantRef: input.tenantRef,
      correlationId: input.correlationId,
      ...extras,
    };
  }

  private buildStoredDocument(
    input: {
      documentId?: string;
      key: string;
      container?: string;
      checksum?: string;
    },
    extras: Partial<CanonicalStoredDocument>,
  ): CanonicalStoredDocument {
    return {
      kind: "canonical-stored-document",
      documentId: input.documentId ?? input.key,
      storageKey: input.key,
      storageContainer: input.container ?? this.defaultContainer,
      providerId: this.providerId,
      checksum: input.checksum,
      ...extras,
    };
  }

  private async runOperation(
    operation: "upload" | "download" | "delete" | "metadata" | "signedUrl",
    input:
      | StorageUploadInput
      | StorageDownloadInput
      | StorageDeleteInput
      | StorageMetadataInput
      | StorageSignedUrlInput,
    execute: () => Promise<{
      ok: true;
      operation: "upload" | "download" | "delete" | "metadata" | "signedUrl";
      storedDocument?: CanonicalStoredDocument;
      metadata?: CanonicalStorageMetadata;
      body?: Uint8Array;
      signedUrl?: string;
      expiresAt?: string;
      message?: string;
      code?: string;
      realStorageExecuted: boolean;
      realUploadExecuted: boolean;
      realDownloadExecuted: boolean;
      realDeleteExecuted: boolean;
      bytes?: number;
    }>,
  ): Promise<StorageProviderOperationResult> {
    const requestId = input.requestId ?? createStorageProviderRequestId();
    const startedMs = Date.now();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(
      input.timeoutMs ?? input.attributes?.timeoutMs,
      this.defaultTimeoutMs,
    );
    const retryCount = readPositiveInt(
      input.retryCount ?? input.attributes?.retryCount,
      this.defaultRetryCount,
    );
    const retryBackoffMs = readPositiveInt(
      input.attributes?.retryBackoffMs,
      this.defaultRetryBackoffMs,
    );
    const logs: StorageProviderStructuredLog[] = [];

    const fail = (
      message: string,
      code: string,
      attempts: number,
    ): StorageProviderOperationResult => {
      logs.push({
        level: "error",
        code,
        message,
        requestId,
        providerId: this.providerId,
        attempt: attempts,
        operation,
      });
      return {
        kind: "canonical-storage-result",
        ok: false,
        operation,
        requestId,
        providerId: this.providerId,
        provider: this.providerId,
        message,
        code,
        realStorageExecuted: false,
        realUploadExecuted: false,
        realDownloadExecuted: false,
        realDeleteExecuted: false,
        simulated: false,
        telemetry: {
          latencyMs: Math.max(0, Date.now() - startedMs),
          attempts,
          cancelled: signal?.aborted === true,
          operation,
        },
        logs,
      };
    };

    if (!this.healthy) {
      return fail("Storage provider unhealthy.", "STORAGE_UNHEALTHY", 0);
    }

    if (signal?.aborted) {
      return fail("Storage operation cancelled before start.", "STORAGE_CANCELLED", 0);
    }

    if (!input.key?.trim()) {
      return fail("storage key is required.", "STORAGE_INVALID_INPUT", 0);
    }

    const maxAttempts = retryCount + 1;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) {
        return fail("Storage operation cancelled.", "STORAGE_CANCELLED", attempt);
      }

      try {
        const outcome = await this.withTimeout(
          this.executeAttempt(operation, requestId, attempt, logs, execute, input.attributes),
          timeoutMs,
          signal,
        );

        logs.push({
          level: "info",
          code: outcome.code ?? "STORAGE_OK",
          message: outcome.message ?? `${operation} ok`,
          requestId,
          providerId: this.providerId,
          attempt,
          operation,
        });

        return {
          kind: "canonical-storage-result",
          ok: true,
          operation: outcome.operation,
          requestId,
          providerId: this.providerId,
          provider: this.providerId,
          storedDocument: outcome.storedDocument,
          metadata: outcome.metadata,
          body: outcome.body,
          signedUrl: outcome.signedUrl,
          expiresAt: outcome.expiresAt,
          message: outcome.message,
          code: outcome.code,
          realStorageExecuted: outcome.realStorageExecuted,
          realUploadExecuted: outcome.realUploadExecuted,
          realDownloadExecuted: outcome.realDownloadExecuted,
          realDeleteExecuted: outcome.realDeleteExecuted,
          simulated: false,
          telemetry: {
            latencyMs: Math.max(0, Date.now() - startedMs),
            attempts: attempt,
            cancelled: false,
            operation,
            bytes: outcome.bytes,
          },
          logs,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (signal?.aborted || /cancel/i.test(lastError)) {
          return fail(lastError, "STORAGE_CANCELLED", attempt);
        }
        if (/timeout/i.test(lastError)) {
          return fail(lastError, "STORAGE_TIMEOUT", attempt);
        }
        logs.push({
          level: "warn",
          code: "STORAGE_RETRY",
          message: lastError,
          requestId,
          providerId: this.providerId,
          attempt,
          operation,
        });
        if (attempt < maxAttempts) {
          await this.sleep(retryBackoffMs * attempt);
          continue;
        }
      }
    }

    return fail(
      lastError ?? `Storage ${operation} failed after retries.`,
      "STORAGE_FAILED",
      maxAttempts,
    );
  }

  private async executeAttempt(
    operation: "upload" | "download" | "delete" | "metadata" | "signedUrl",
    requestId: string,
    attempt: number,
    logs: StorageProviderStructuredLog[],
    execute: () => Promise<{
      ok: true;
      operation: "upload" | "download" | "delete" | "metadata" | "signedUrl";
      storedDocument?: CanonicalStoredDocument;
      metadata?: CanonicalStorageMetadata;
      body?: Uint8Array;
      signedUrl?: string;
      expiresAt?: string;
      message?: string;
      code?: string;
      realStorageExecuted: boolean;
      realUploadExecuted: boolean;
      realDownloadExecuted: boolean;
      realDeleteExecuted: boolean;
      bytes?: number;
    }>,
    attributes?: Readonly<Record<string, unknown>>,
  ) {
    if (this.failAttemptsRemaining > 0) {
      this.failAttemptsRemaining -= 1;
      throw new Error(
        `Transient storage failure (attempt ${attempt}, request ${requestId}, op ${operation}).`,
      );
    }

    void this.now();
    logs.push({
      level: "info",
      code: "STORAGE_START",
      message: `Starting storage ${operation}.`,
      requestId,
      providerId: this.providerId,
      attempt,
      operation,
    });

    const forceDelayMs = readPositiveInt(attributes?.forceDelayMs, 0);
    if (forceDelayMs > 0) {
      await this.sleep(forceDelayMs);
    }

    return execute();
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal: AbortSignal | undefined,
  ): Promise<T> {
    if (timeoutMs <= 0) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Storage timeout after ${timeoutMs}ms.`));
          }, timeoutMs);
          if (signal) {
            onAbort = () => reject(new Error("Storage operation cancelled."));
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
          }
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    }
  }
}

/** Alias oficial do adapter Supabase (STORAGE-01). */
export const SupabaseStorageProviderAdapter = DefaultStorageProviderAdapter;
