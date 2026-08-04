/**
 * DefaultUploadRuntimeAdapter — F3-CAP-03.
 *
 * Adapter oficial do Enterprise Upload Runtime.
 * Responde exclusivamente de forma estrutural (sem Scanner real / sem drivers).
 * Sem Local Watch real. Sem Network Watch. Sem UNC/SMB. Sem Polling. Sem Azure Files. Sem OCR. Sem Importação automática.
 */
import {
  DEFAULT_UPLOAD_RUNTIME_CAPABILITIES,
  toCanonicalUploadCapabilities,
} from "../ports/capabilities";
import {
  UPLOAD_RUNTIME_IDENTITY,
  createUploadReceiptId,
  createUploadId,
  createUploadResultId,
  createUploadRuntimeRequestId,
  createUploadSessionId,
} from "../ports/identity";
import type { UploadRuntimePort } from "../ports/upload-runtime-port";
import type {
  CanonicalUpload,
  CanonicalUploadReceipt,
  CanonicalUploadResult,
  CanonicalUploadSession,
} from "../ports/canonical";
import type {
  ReceiveUploadInput,
  ReceiveUploadResult,
  CloseUploadSessionInput,
  CloseUploadSessionResult,
  DiscoverUploadsInput,
  DiscoverUploadsResult,
  OpenUploadSessionInput,
  OpenUploadSessionResult,
  RegisterUploadInput,
  RegisterUploadResult,
  UploadRuntimeEnterpriseDeps,
  UploadRuntimeHealth,
  UploadRuntimeInfo,
  UploadRuntimeOperationEnvelope,
  UploadRuntimeOperationalControls,
  UploadRuntimePortCapabilities,
  UploadRuntimeProviderId,
  UploadRuntimeProviderMetadata,
  UploadRuntimeStructuredLog,
  UploadStatsInput,
  UploadStatsResult,
  UnregisterUploadInput,
  UnregisterUploadResult,
} from "../ports/types";
import { InMemoryUploadRuntimeStore, type UploadRuntimeStore } from "../store";

export const DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID = "default-enterprise-upload";
export const DEFAULT_UPLOAD_RUNTIME_VERSION = UPLOAD_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultUploadRuntimeAdapterOptions = {
  provider?: Extract<UploadRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: UploadRuntimeStore;
  enterpriseDeps?: UploadRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: UploadRuntimeOperationalControls): AbortSignal | undefined {
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

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function portShapeOk(port: unknown): boolean {
  return (
    !!port &&
    typeof (port as { health?: unknown }).health === "function" &&
    typeof (port as { capabilities?: unknown }).capabilities === "function"
  );
}

/**
 * Adapter oficial F3-CAP-03 — Upload Runtime default / enterprise.
 */
export class DefaultUploadRuntimeAdapter implements UploadRuntimePort {
  readonly providerId: Extract<UploadRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: UploadRuntimeProviderMetadata;
  private readonly store: UploadRuntimeStore;
  private readonly enterpriseDeps?: UploadRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultUploadRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Upload Runtime ready (structural only — no real Upload / no FileSystemWatcher).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default Upload Runtime" : UPLOAD_RUNTIME_IDENTITY.name,
      version: DEFAULT_UPLOAD_RUNTIME_VERSION,
      vendor: UPLOAD_RUNTIME_IDENTITY.vendor,
      layer: UPLOAD_RUNTIME_IDENTITY.layer,
      vendorAgnostic: UPLOAD_RUNTIME_IDENTITY.vendorAgnostic,
      description: UPLOAD_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryUploadRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): UploadRuntimeStore {
    return this.store;
  }

  capabilities(): UploadRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_UPLOAD_RUNTIME_CAPABILITIES },
      canonical: toCanonicalUploadCapabilities(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES),
      supportsCanonicalUpload: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesCaptureEngineRuntimePort: true,
      usesOCRRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      runtimeReady: true,
      webUploadImplemented: false,
      desktopUploadImplemented: false,
      mobileUploadImplemented: false,
      apiUploadImplemented: false,
      multipartImplemented: false,
      chunkedUploadImplemented: false,
      resumableUploadImplemented: false,
      azureBlobImplemented: false,
      supabaseStorageImplemented: false,
      s3Implemented: false,
      googleDriveImplemented: false,
      oneDriveImplemented: false,
      dropboxImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): UploadRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "UPLOAD_RUNTIME",
      capabilities: { ...DEFAULT_UPLOAD_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<UploadRuntimeHealth> {
    const storeHealth = this.store.health();
    let scannerRuntimeOk = true;
    let watchFolderRuntimeOk = true;
    let captureEngineRuntimeOk = true;
    let ocrRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let workerRuntimeOk = true;
    let observabilityRuntimeOk = true;

    if (this.enterpriseDeps) {
      // Deps estruturais — valida Port shape sem chamar health() (evita ciclos).
      if (typeof this.enterpriseDeps.getScannerRuntimePort === "function") {
        scannerRuntimeOk = portShapeOk(this.enterpriseDeps.getScannerRuntimePort());
      }
      if (typeof this.enterpriseDeps.getWatchFolderRuntimePort === "function") {
        watchFolderRuntimeOk = portShapeOk(this.enterpriseDeps.getWatchFolderRuntimePort());
      }
      if (typeof this.enterpriseDeps.getCaptureEngineRuntimePort === "function") {
        captureEngineRuntimeOk = portShapeOk(this.enterpriseDeps.getCaptureEngineRuntimePort());
      }
      if (typeof this.enterpriseDeps.getOCRRuntimePort === "function") {
        ocrRuntimeOk = portShapeOk(this.enterpriseDeps.getOCRRuntimePort());
      }
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort === "function") {
        persistentQueueRuntimeOk = portShapeOk(this.enterpriseDeps.getPersistentQueueRuntimePort());
      }
      if (typeof this.enterpriseDeps.getSchedulerRuntimePort === "function") {
        schedulerRuntimeOk = portShapeOk(this.enterpriseDeps.getSchedulerRuntimePort());
      }
      if (typeof this.enterpriseDeps.getWorkerRuntimePort === "function") {
        workerRuntimeOk = portShapeOk(this.enterpriseDeps.getWorkerRuntimePort());
      }
      if (typeof this.enterpriseDeps.getObservabilityRuntimePort === "function") {
        observabilityRuntimeOk = portShapeOk(this.enterpriseDeps.getObservabilityRuntimePort());
      }
    }

    const ok =
      this.healthy &&
      storeHealth.ok &&
      scannerRuntimeOk &&
      watchFolderRuntimeOk &&
      captureEngineRuntimeOk &&
      ocrRuntimeOk &&
      persistentQueueRuntimeOk &&
      schedulerRuntimeOk &&
      workerRuntimeOk &&
      observabilityRuntimeOk;

    return {
      kind: "canonical-upload-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedUploadCount: this.store.uploadCount(),
      storedSessionCount: this.store.sessionCount(),
      storedReceiptCount: this.store.receiptCount(),
      scannerRuntimeOk,
      watchFolderRuntimeOk,
      captureEngineRuntimeOk,
      ocrRuntimeOk,
      persistentQueueRuntimeOk,
      schedulerRuntimeOk,
      workerRuntimeOk,
      observabilityRuntimeOk,
      runtimeReady: true,
      webUploadImplemented: false,
      desktopUploadImplemented: false,
      mobileUploadImplemented: false,
      apiUploadImplemented: false,
      multipartImplemented: false,
      chunkedUploadImplemented: false,
      resumableUploadImplemented: false,
      azureBlobImplemented: false,
      supabaseStorageImplemented: false,
      s3Implemented: false,
      googleDriveImplemented: false,
      oneDriveImplemented: false,
      dropboxImplemented: false,
      message: this.healthy ? (storeHealth.message ?? this.message) : "Upload Runtime unhealthy.",
    };
  }

  async register(input: RegisterUploadInput): Promise<RegisterUploadResult> {
    return this.runOperation("register", input, async () => {
      const stamp = this.now();
      const uploadName = input.uploadName ?? "canonical-foundation-upload";
      const existing = input.uploadId
        ? this.store.getUpload(input.uploadId)
        : this.store.getUploadByName(uploadName);
      if (existing) {
        return {
          ok: false,
          code: "UPLOAD_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical Upload already registered.",
          upload: existing,
        };
      }
      const uploadId = input.uploadId ?? createUploadId();
      const upload: CanonicalUpload = {
        kind: "canonical-upload",
        uploadId,
        uploadName,
        channelKey: input.channelKey,
        identity: {
          kind: "canonical-upload-identity",
          uploadId,
          uploadName,
          channelKey: input.channelKey,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        status: "registered",
        discovered: false,
        createdAt: stamp,
        updatedAt: stamp,
        webUploadImplemented: false,
        desktopUploadImplemented: false,
        mobileUploadImplemented: false,
        apiUploadImplemented: false,
        multipartImplemented: false,
        chunkedUploadImplemented: false,
        resumableUploadImplemented: false,
        azureBlobImplemented: false,
        supabaseStorageImplemented: false,
        s3Implemented: false,
        googleDriveImplemented: false,
        oneDriveImplemented: false,
        dropboxImplemented: false,
      };
      this.store.setUpload(upload);
      const result = this.buildResult({
        operation: "register",
        status: "registered",
        upload,
        stamp,
        code: "UPLOAD_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Upload Runtime structural register (F3-CAP-03 foundation — no real upload).",
      });
      return {
        ok: true,
        result,
        upload,
        code: "UPLOAD_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregister(input: UnregisterUploadInput): Promise<UnregisterUploadResult> {
    return this.runOperation("unregister", input, async () => {
      const existing = this.store.getUpload(input.uploadId);
      if (!existing) {
        return {
          ok: false,
          code: "UPLOAD_RUNTIME_NOT_FOUND",
          message: "Canonical Upload not found.",
        };
      }
      const stamp = this.now();
      const upload: CanonicalUpload = {
        ...existing,
        status: "unregistered",
        updatedAt: stamp,
      };
      this.store.removeUpload(input.uploadId);
      const result = this.buildResult({
        operation: "unregister",
        status: "unregistered",
        upload,
        stamp,
        code: "UPLOAD_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Upload Runtime structural unregister (F3-CAP-03 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        upload,
        code: "UPLOAD_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async discover(input: DiscoverUploadsInput = {}): Promise<DiscoverUploadsResult> {
    return this.runOperation("discover", input, async () => {
      const stamp = this.now();
      const uploads = this.store.listUploads().map((upload) => {
        const discovered: CanonicalUpload = {
          ...upload,
          discovered: true,
          status: upload.status === "unregistered" ? upload.status : "discovered",
          updatedAt: stamp,
        };
        this.store.setUpload(discovered);
        return discovered;
      });
      const result = this.buildResult({
        operation: "discover",
        status: "discovered",
        uploads,
        stamp,
        code: "UPLOAD_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Upload Runtime structural discover (F3-CAP-03 foundation — no Local/Network/UNC/SMB/Azure Files).",
      });
      return {
        ok: true,
        result,
        uploads,
        code: "UPLOAD_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async openSession(input: OpenUploadSessionInput): Promise<OpenUploadSessionResult> {
    return this.runOperation("openSession", input, async () => {
      const stamp = this.now();
      let upload = this.resolveUpload(input.uploadId, input.uploadName);
      if (!upload) {
        const uploadName = input.uploadName ?? "canonical-foundation-upload";
        const uploadId = input.uploadId ?? createUploadId();
        upload = {
          kind: "canonical-upload",
          uploadId,
          uploadName,
          identity: {
            kind: "canonical-upload-identity",
            uploadId,
            uploadName,
          },
          metadata: input.metadata,
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          webUploadImplemented: false,
          desktopUploadImplemented: false,
          mobileUploadImplemented: false,
          apiUploadImplemented: false,
          multipartImplemented: false,
          chunkedUploadImplemented: false,
          resumableUploadImplemented: false,
          azureBlobImplemented: false,
          supabaseStorageImplemented: false,
          s3Implemented: false,
          googleDriveImplemented: false,
          oneDriveImplemented: false,
          dropboxImplemented: false,
        };
        this.store.setUpload(upload);
      }
      const sessionId = input.sessionId ?? createUploadSessionId();
      const session: CanonicalUploadSession = {
        kind: "canonical-upload-session",
        sessionId,
        uploadId: upload.uploadId,
        identity: {
          kind: "canonical-upload-identity",
          uploadId: upload.uploadId,
          uploadName: upload.uploadName,
          sessionId,
        },
        metadata: input.metadata,
        status: "session-open",
        openedAt: stamp,
        updatedAt: stamp,
        webUploadImplemented: false,
        desktopUploadImplemented: false,
        mobileUploadImplemented: false,
        apiUploadImplemented: false,
        multipartImplemented: false,
        chunkedUploadImplemented: false,
        resumableUploadImplemented: false,
        azureBlobImplemented: false,
        supabaseStorageImplemented: false,
        s3Implemented: false,
        googleDriveImplemented: false,
        oneDriveImplemented: false,
        dropboxImplemented: false,
      };
      this.store.setSession(session);
      const updated: CanonicalUpload = {
        ...upload,
        status: "session-open",
        updatedAt: stamp,
      };
      this.store.setUpload(updated);
      const result = this.buildResult({
        operation: "openSession",
        status: "session-open",
        upload: updated,
        session,
        stamp,
        code: "UPLOAD_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Upload Runtime structural openSession (F3-CAP-03 foundation — no filesystem watch session).",
      });
      return {
        ok: true,
        result,
        upload: updated,
        session,
        code: "UPLOAD_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeSession(input: CloseUploadSessionInput): Promise<CloseUploadSessionResult> {
    return this.runOperation("closeSession", input, async () => {
      const existing = this.store.getSession(input.sessionId);
      if (!existing) {
        return {
          ok: false,
          code: "UPLOAD_RUNTIME_SESSION_NOT_FOUND",
          message: "Canonical Upload session not found.",
        };
      }
      const stamp = this.now();
      const session: CanonicalUploadSession = {
        ...existing,
        status: "session-closed",
        closedAt: stamp,
        updatedAt: stamp,
      };
      this.store.setSession(session);
      const result = this.buildResult({
        operation: "closeSession",
        status: "session-closed",
        session,
        stamp,
        code: "UPLOAD_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Upload Runtime structural closeSession (F3-CAP-03 foundation — no real close).",
      });
      return {
        ok: true,
        result,
        session,
        code: "UPLOAD_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async receive(input: ReceiveUploadInput): Promise<ReceiveUploadResult> {
    return this.runOperation("receive", input, async () => {
      const stamp = this.now();
      let upload = this.resolveUpload(input.uploadId, input.uploadName);
      if (!upload) {
        upload = {
          kind: "canonical-upload",
          uploadId: input.uploadId ?? createUploadId(),
          uploadName: input.uploadName ?? "canonical-foundation-upload",
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          webUploadImplemented: false,
          desktopUploadImplemented: false,
          mobileUploadImplemented: false,
          apiUploadImplemented: false,
          multipartImplemented: false,
          chunkedUploadImplemented: false,
          resumableUploadImplemented: false,
          azureBlobImplemented: false,
          supabaseStorageImplemented: false,
          s3Implemented: false,
          googleDriveImplemented: false,
          oneDriveImplemented: false,
          dropboxImplemented: false,
        };
        this.store.setUpload(upload);
      }
      let session = input.sessionId ? this.store.getSession(input.sessionId) : undefined;
      if (!session) {
        const sessionId = createUploadSessionId();
        session = {
          kind: "canonical-upload-session",
          sessionId,
          uploadId: upload.uploadId,
          identity: {
            kind: "canonical-upload-identity",
            uploadId: upload.uploadId,
            uploadName: upload.uploadName,
            sessionId,
          },
          metadata: input.metadata,
          status: "session-open",
          openedAt: stamp,
          updatedAt: stamp,
          webUploadImplemented: false,
          desktopUploadImplemented: false,
          mobileUploadImplemented: false,
          apiUploadImplemented: false,
          multipartImplemented: false,
          chunkedUploadImplemented: false,
          resumableUploadImplemented: false,
          azureBlobImplemented: false,
          supabaseStorageImplemented: false,
          s3Implemented: false,
          googleDriveImplemented: false,
          oneDriveImplemented: false,
          dropboxImplemented: false,
        };
        this.store.setSession(session);
      }
      const receipt: CanonicalUploadReceipt = {
        kind: "canonical-upload-receipt",
        receiptId: createUploadReceiptId(),
        uploadId: upload.uploadId,
        sessionId: session?.sessionId,
        identity: {
          kind: "canonical-upload-identity",
          uploadId: upload.uploadId,
          sessionId: session?.sessionId,
        },
        metadata: input.metadata,
        status: "received",
        createdAt: stamp,
        updatedAt: stamp,
        webUploadImplemented: false,
        desktopUploadImplemented: false,
        mobileUploadImplemented: false,
        apiUploadImplemented: false,
        multipartImplemented: false,
        chunkedUploadImplemented: false,
        resumableUploadImplemented: false,
        azureBlobImplemented: false,
        supabaseStorageImplemented: false,
        s3Implemented: false,
        googleDriveImplemented: false,
        oneDriveImplemented: false,
        dropboxImplemented: false,
      };
      this.store.setReceipt(receipt);
      const result = this.buildResult({
        operation: "receive",
        status: "received",
        upload,
        session,
        receipt,
        stamp,
        code: "UPLOAD_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Upload Runtime structural receive (F3-CAP-03 foundation — no real receipt).",
      });
      return {
        ok: true,
        result,
        upload,
        session,
        receipt,
        code: "UPLOAD_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: UploadStatsInput = {}): Promise<UploadStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "UPLOAD_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Upload Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "UPLOAD_RUNTIME_OK",
        message: `Upload Runtime stats: ${statistics.totalUploads} uploads, ${statistics.totalReceipts} receipts.`,
      };
    });
  }

  private resolveUpload(
    uploadId: string | undefined,
    uploadName: string | undefined,
  ): CanonicalUpload | undefined {
    if (uploadId) {
      const byId = this.store.getUpload(uploadId);
      if (byId) return byId;
    }
    if (uploadName) return this.store.getUploadByName(uploadName);
    const all = this.store.listUploads();
    return all[0];
  }

  private buildResult(args: {
    operation: CanonicalUploadResult["operation"];
    status: CanonicalUploadResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    upload?: CanonicalUpload;
    session?: CanonicalUploadSession;
    receipt?: CanonicalUploadReceipt;
    uploads?: readonly CanonicalUpload[];
  }): CanonicalUploadResult {
    return {
      kind: "canonical-upload-result",
      ok: true,
      resultId: createUploadResultId(),
      operation: args.operation,
      upload: args.upload,
      session: args.session,
      receipt: args.receipt,
      uploads: args.uploads,
      provider: {
        kind: "canonical-upload-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      webUploadImplemented: false,
      desktopUploadImplemented: false,
      mobileUploadImplemented: false,
      apiUploadImplemented: false,
      multipartImplemented: false,
      chunkedUploadImplemented: false,
      resumableUploadImplemented: false,
      azureBlobImplemented: false,
      supabaseStorageImplemented: false,
      s3Implemented: false,
      googleDriveImplemented: false,
      oneDriveImplemented: false,
      dropboxImplemented: false,
      runtimeReady: true,
      status: args.status,
      messageText: args.messageText,
      code: args.code,
      createdAt: args.stamp,
      updatedAt: args.stamp,
    };
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: UploadRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & UploadRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createUploadRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: UploadRuntimeStructuredLog[] = [];
    let attempts = 0;
    let lastError: unknown;

    try {
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        attempts = attempt + 1;
        if (signal?.aborted) {
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          return {
            ok: false,
            requestId,
            provider: this.providerId,
            code: "UPLOAD_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & UploadRuntimeOperationEnvelope;
        }

        try {
          if (this.failAttemptsRemaining > 0) {
            this.failAttemptsRemaining -= 1;
            throw new Error("Forced transient failure (test).");
          }

          const body = await this.withTimeout(fn(), timeoutMs, signal);
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          logs.push({
            level: "info",
            code: body.code ?? "UPLOAD_RUNTIME_OK",
            message: body.message ?? `${operation} completed`,
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          return {
            ...body,
            requestId,
            provider: this.providerId,
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: false,
              operation,
            },
            logs,
          };
        } catch (err) {
          lastError = err;
          logs.push({
            level: "warn",
            code: "UPLOAD_RUNTIME_RETRY",
            message: err instanceof Error ? err.message : String(err),
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          if (attempt < retryCount) {
            await this.sleep(this.defaultRetryBackoffMs * (attempt + 1));
          }
        }
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        lastError instanceof Error ? lastError.message : String(lastError ?? "unknown error");
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "UPLOAD_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & UploadRuntimeOperationEnvelope;
    } catch (err) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const isTimeout =
        err instanceof Error && (err.name === "TimeoutError" || /timeout/i.test(err.message));
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "UPLOAD_RUNTIME_CANCELLED"
          : isTimeout
            ? "UPLOAD_RUNTIME_TIMEOUT"
            : "UPLOAD_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & UploadRuntimeOperationEnvelope;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<T> {
    if (timeoutMs <= 0 && !signal) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          if (timeoutMs > 0) {
            timer = setTimeout(() => {
              const err = new Error(`Upload Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Upload Runtime operation aborted");
              err.name = "AbortError";
              reject(err);
            };
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

/** Alias oficial do adapter enterprise (F3-CAP-03). */
export const EnterpriseUploadRuntimeAdapter = DefaultUploadRuntimeAdapter;
