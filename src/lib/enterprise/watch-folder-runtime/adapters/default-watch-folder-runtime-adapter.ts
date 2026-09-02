/**
 * DefaultWatchFolderRuntimeAdapter — F3-CAP-02.
 *
 * Adapter oficial do Enterprise Watch Folder Runtime.
 * Responde exclusivamente de forma estrutural (sem Scanner real / sem drivers).
 * Sem Local Watch real. Sem Network Watch. Sem UNC/SMB. Sem Polling. Sem Azure Files. Sem OCR. Sem Importação automática.
 */
import {
  DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES,
  toCanonicalWatchFolderCapabilities,
} from "../ports/capabilities";
import {
  WATCH_FOLDER_RUNTIME_IDENTITY,
  createWatchFolderObservationId,
  createWatchFolderId,
  createWatchFolderResultId,
  createWatchFolderRuntimeRequestId,
  createWatchFolderSessionId,
} from "../ports/identity";
import type { WatchFolderRuntimePort } from "../ports/watch-folder-runtime-port";
import type {
  CanonicalWatchFolder,
  CanonicalWatchFolderObservation,
  CanonicalWatchFolderResult,
  CanonicalWatchFolderSession,
} from "../ports/canonical";
import type {
  ObserveWatchFolderInput,
  ObserveWatchFolderResult,
  CloseWatchFolderSessionInput,
  CloseWatchFolderSessionResult,
  DiscoverWatchFoldersInput,
  DiscoverWatchFoldersResult,
  OpenWatchFolderSessionInput,
  OpenWatchFolderSessionResult,
  RegisterWatchFolderInput,
  RegisterWatchFolderResult,
  WatchFolderRuntimeEnterpriseDeps,
  WatchFolderRuntimeHealth,
  WatchFolderRuntimeInfo,
  WatchFolderRuntimeOperationEnvelope,
  WatchFolderRuntimeOperationalControls,
  WatchFolderRuntimePortCapabilities,
  WatchFolderRuntimeProviderId,
  WatchFolderRuntimeProviderMetadata,
  WatchFolderRuntimeStructuredLog,
  WatchFolderStatsInput,
  WatchFolderStatsResult,
  UnregisterWatchFolderInput,
  UnregisterWatchFolderResult,
} from "../ports/types";
import { InMemoryWatchFolderRuntimeStore, type WatchFolderRuntimeStore } from "../store";

export const DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID = "default-enterprise-watch-folder";
export const DEFAULT_WATCH_FOLDER_RUNTIME_VERSION = WATCH_FOLDER_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultWatchFolderRuntimeAdapterOptions = {
  provider?: Extract<WatchFolderRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: WatchFolderRuntimeStore;
  enterpriseDeps?: WatchFolderRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: WatchFolderRuntimeOperationalControls): AbortSignal | undefined {
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
 * Adapter oficial F3-CAP-02 — Watch Folder Runtime default / enterprise.
 */
export class DefaultWatchFolderRuntimeAdapter implements WatchFolderRuntimePort {
  readonly providerId: Extract<WatchFolderRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: WatchFolderRuntimeProviderMetadata;
  private readonly store: WatchFolderRuntimeStore;
  private readonly enterpriseDeps?: WatchFolderRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultWatchFolderRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Watch Folder Runtime ready (structural only — no real watch folder / no FileSystemWatcher).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Watch Folder Runtime"
          : WATCH_FOLDER_RUNTIME_IDENTITY.name,
      version: DEFAULT_WATCH_FOLDER_RUNTIME_VERSION,
      vendor: WATCH_FOLDER_RUNTIME_IDENTITY.vendor,
      layer: WATCH_FOLDER_RUNTIME_IDENTITY.layer,
      vendorAgnostic: WATCH_FOLDER_RUNTIME_IDENTITY.vendorAgnostic,
      description: WATCH_FOLDER_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryWatchFolderRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): WatchFolderRuntimeStore {
    return this.store;
  }

  capabilities(): WatchFolderRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalWatchFolderCapabilities(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES),
      supportsCanonicalWatchFolder: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesScannerRuntimePort: true,
      usesCaptureEngineRuntimePort: true,
      usesOCRRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      runtimeReady: true,
      localWatchImplemented: false,
      networkWatchImplemented: false,
      uncImplemented: false,
      smbImplemented: false,
      azureFilesImplemented: false,
      pollingImplemented: false,
      fileSystemWatcherImplemented: false,
      recursiveWatchImplemented: false,
      changeNotificationImplemented: false,
      automaticImportImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): WatchFolderRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "WATCH_FOLDER_RUNTIME",
      capabilities: { ...DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<WatchFolderRuntimeHealth> {
    const storeHealth = this.store.health();
    let scannerRuntimeOk = true;
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
      if (typeof this.enterpriseDeps.getCaptureEngineRuntimePort === "function") {
        captureEngineRuntimeOk = portShapeOk(this.enterpriseDeps.getCaptureEngineRuntimePort());
      }
      if (typeof this.enterpriseDeps.getOCRRuntimePort === "function") {
        ocrRuntimeOk = portShapeOk(this.enterpriseDeps.getOCRRuntimePort());
      }
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort === "function") {
        persistentQueueRuntimeOk = portShapeOk(this.enterpriseDeps.getPersistentQueueRuntimePort());
      }
    }

    const ok =
      this.healthy &&
      storeHealth.ok &&
      scannerRuntimeOk &&
      captureEngineRuntimeOk &&
      ocrRuntimeOk &&
      persistentQueueRuntimeOk &&
      schedulerRuntimeOk &&
      workerRuntimeOk &&
      observabilityRuntimeOk;

    return {
      kind: "canonical-watch-folder-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedWatchFolderCount: this.store.watchFolderCount(),
      storedSessionCount: this.store.sessionCount(),
      storedObservationCount: this.store.observationCount(),
      scannerRuntimeOk,
      captureEngineRuntimeOk,
      ocrRuntimeOk,
      persistentQueueRuntimeOk,
      schedulerRuntimeOk,
      workerRuntimeOk,
      observabilityRuntimeOk,
      runtimeReady: true,
      localWatchImplemented: false,
      networkWatchImplemented: false,
      uncImplemented: false,
      smbImplemented: false,
      azureFilesImplemented: false,
      pollingImplemented: false,
      fileSystemWatcherImplemented: false,
      recursiveWatchImplemented: false,
      changeNotificationImplemented: false,
      automaticImportImplemented: false,
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "Watch Folder Runtime unhealthy.",
    };
  }

  async register(input: RegisterWatchFolderInput): Promise<RegisterWatchFolderResult> {
    return this.runOperation("register", input, async () => {
      const stamp = this.now();
      const watchFolderName = input.watchFolderName ?? "canonical-foundation-watch-folder";
      const existing = input.watchFolderId
        ? this.store.getWatchFolder(input.watchFolderId)
        : this.store.getWatchFolderByName(watchFolderName);
      if (existing) {
        return {
          ok: false,
          code: "WATCH_FOLDER_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical watch folder already registered.",
          watchFolder: existing,
        };
      }
      const watchFolderId = input.watchFolderId ?? createWatchFolderId();
      const watchFolder: CanonicalWatchFolder = {
        kind: "canonical-watch-folder",
        watchFolderId,
        watchFolderName,
        folderPath: input.folderPath,
        identity: {
          kind: "canonical-watch-folder-identity",
          watchFolderId,
          watchFolderName,
          folderPath: input.folderPath,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        status: "registered",
        discovered: false,
        createdAt: stamp,
        updatedAt: stamp,
        localWatchImplemented: false,
        networkWatchImplemented: false,
        uncImplemented: false,
        smbImplemented: false,
        azureFilesImplemented: false,
        pollingImplemented: false,
        fileSystemWatcherImplemented: false,
        recursiveWatchImplemented: false,
        changeNotificationImplemented: false,
        automaticImportImplemented: false,
      };
      this.store.setWatchFolder(watchFolder);
      const result = this.buildResult({
        operation: "register",
        status: "registered",
        watchFolder,
        stamp,
        code: "WATCH_FOLDER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Watch Folder Runtime structural register (F3-CAP-02 foundation — no real watch folder).",
      });
      return {
        ok: true,
        result,
        watchFolder,
        code: "WATCH_FOLDER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregister(input: UnregisterWatchFolderInput): Promise<UnregisterWatchFolderResult> {
    return this.runOperation("unregister", input, async () => {
      const existing = this.store.getWatchFolder(input.watchFolderId);
      if (!existing) {
        return {
          ok: false,
          code: "WATCH_FOLDER_RUNTIME_NOT_FOUND",
          message: "Canonical watch folder not found.",
        };
      }
      const stamp = this.now();
      const watchFolder: CanonicalWatchFolder = {
        ...existing,
        status: "unregistered",
        updatedAt: stamp,
      };
      this.store.removeWatchFolder(input.watchFolderId);
      const result = this.buildResult({
        operation: "unregister",
        status: "unregistered",
        watchFolder,
        stamp,
        code: "WATCH_FOLDER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Watch Folder Runtime structural unregister (F3-CAP-02 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        watchFolder,
        code: "WATCH_FOLDER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async discover(input: DiscoverWatchFoldersInput = {}): Promise<DiscoverWatchFoldersResult> {
    return this.runOperation("discover", input, async () => {
      const stamp = this.now();
      const watchFolders = this.store.listWatchFolders().map((watchFolder) => {
        const discovered: CanonicalWatchFolder = {
          ...watchFolder,
          discovered: true,
          status: watchFolder.status === "unregistered" ? watchFolder.status : "discovered",
          updatedAt: stamp,
        };
        this.store.setWatchFolder(discovered);
        return discovered;
      });
      const result = this.buildResult({
        operation: "discover",
        status: "discovered",
        watchFolders,
        stamp,
        code: "WATCH_FOLDER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Watch Folder Runtime structural discover (F3-CAP-02 foundation — no Local/Network/UNC/SMB/Azure Files).",
      });
      return {
        ok: true,
        result,
        watchFolders,
        code: "WATCH_FOLDER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async openSession(input: OpenWatchFolderSessionInput): Promise<OpenWatchFolderSessionResult> {
    return this.runOperation("openSession", input, async () => {
      const stamp = this.now();
      let watchFolder = this.resolveWatchFolder(input.watchFolderId, input.watchFolderName);
      if (!watchFolder) {
        const watchFolderName = input.watchFolderName ?? "canonical-foundation-watch-folder";
        const watchFolderId = input.watchFolderId ?? createWatchFolderId();
        watchFolder = {
          kind: "canonical-watch-folder",
          watchFolderId,
          watchFolderName,
          identity: {
            kind: "canonical-watch-folder-identity",
            watchFolderId,
            watchFolderName,
          },
          metadata: input.metadata,
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          localWatchImplemented: false,
          networkWatchImplemented: false,
          uncImplemented: false,
          smbImplemented: false,
          azureFilesImplemented: false,
          pollingImplemented: false,
          fileSystemWatcherImplemented: false,
          recursiveWatchImplemented: false,
          changeNotificationImplemented: false,
          automaticImportImplemented: false,
        };
        this.store.setWatchFolder(watchFolder);
      }
      const sessionId = input.sessionId ?? createWatchFolderSessionId();
      const session: CanonicalWatchFolderSession = {
        kind: "canonical-watch-folder-session",
        sessionId,
        watchFolderId: watchFolder.watchFolderId,
        identity: {
          kind: "canonical-watch-folder-identity",
          watchFolderId: watchFolder.watchFolderId,
          watchFolderName: watchFolder.watchFolderName,
          sessionId,
        },
        metadata: input.metadata,
        status: "session-open",
        openedAt: stamp,
        updatedAt: stamp,
        localWatchImplemented: false,
        networkWatchImplemented: false,
        uncImplemented: false,
        smbImplemented: false,
        azureFilesImplemented: false,
        pollingImplemented: false,
        fileSystemWatcherImplemented: false,
        recursiveWatchImplemented: false,
        changeNotificationImplemented: false,
        automaticImportImplemented: false,
      };
      this.store.setSession(session);
      const updated: CanonicalWatchFolder = {
        ...watchFolder,
        status: "session-open",
        updatedAt: stamp,
      };
      this.store.setWatchFolder(updated);
      const result = this.buildResult({
        operation: "openSession",
        status: "session-open",
        watchFolder: updated,
        session,
        stamp,
        code: "WATCH_FOLDER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Watch Folder Runtime structural openSession (F3-CAP-02 foundation — no filesystem watch session).",
      });
      return {
        ok: true,
        result,
        watchFolder: updated,
        session,
        code: "WATCH_FOLDER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeSession(input: CloseWatchFolderSessionInput): Promise<CloseWatchFolderSessionResult> {
    return this.runOperation("closeSession", input, async () => {
      const existing = this.store.getSession(input.sessionId);
      if (!existing) {
        return {
          ok: false,
          code: "WATCH_FOLDER_RUNTIME_SESSION_NOT_FOUND",
          message: "Canonical watch folder session not found.",
        };
      }
      const stamp = this.now();
      const session: CanonicalWatchFolderSession = {
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
        code: "WATCH_FOLDER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Watch Folder Runtime structural closeSession (F3-CAP-02 foundation — no real close).",
      });
      return {
        ok: true,
        result,
        session,
        code: "WATCH_FOLDER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async observe(input: ObserveWatchFolderInput): Promise<ObserveWatchFolderResult> {
    return this.runOperation("observe", input, async () => {
      const stamp = this.now();
      let watchFolder = this.resolveWatchFolder(input.watchFolderId, undefined);
      if (!watchFolder) {
        watchFolder = {
          kind: "canonical-watch-folder",
          watchFolderId: input.watchFolderId ?? createWatchFolderId(),
          watchFolderName: "canonical-foundation-watch-folder",
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          localWatchImplemented: false,
          networkWatchImplemented: false,
          uncImplemented: false,
          smbImplemented: false,
          azureFilesImplemented: false,
          pollingImplemented: false,
          fileSystemWatcherImplemented: false,
          recursiveWatchImplemented: false,
          changeNotificationImplemented: false,
          automaticImportImplemented: false,
        };
        this.store.setWatchFolder(watchFolder);
      }
      let session = input.sessionId ? this.store.getSession(input.sessionId) : undefined;
      if (!session) {
        const sessionId = createWatchFolderSessionId();
        session = {
          kind: "canonical-watch-folder-session",
          sessionId,
          watchFolderId: watchFolder.watchFolderId,
          identity: {
            kind: "canonical-watch-folder-identity",
            watchFolderId: watchFolder.watchFolderId,
            watchFolderName: watchFolder.watchFolderName,
            sessionId,
          },
          metadata: input.metadata,
          status: "session-open",
          openedAt: stamp,
          updatedAt: stamp,
          localWatchImplemented: false,
          networkWatchImplemented: false,
          uncImplemented: false,
          smbImplemented: false,
          azureFilesImplemented: false,
          pollingImplemented: false,
          fileSystemWatcherImplemented: false,
          recursiveWatchImplemented: false,
          changeNotificationImplemented: false,
          automaticImportImplemented: false,
        };
        this.store.setSession(session);
      }
      const observation: CanonicalWatchFolderObservation = {
        kind: "canonical-watch-folder-observation",
        observationId: createWatchFolderObservationId(),
        watchFolderId: watchFolder.watchFolderId,
        sessionId: session?.sessionId,
        identity: {
          kind: "canonical-watch-folder-identity",
          watchFolderId: watchFolder.watchFolderId,
          sessionId: session?.sessionId,
        },
        metadata: input.metadata,
        status: "observed",
        createdAt: stamp,
        updatedAt: stamp,
        localWatchImplemented: false,
        networkWatchImplemented: false,
        uncImplemented: false,
        smbImplemented: false,
        azureFilesImplemented: false,
        pollingImplemented: false,
        fileSystemWatcherImplemented: false,
        recursiveWatchImplemented: false,
        changeNotificationImplemented: false,
        automaticImportImplemented: false,
      };
      this.store.setObservation(observation);
      const result = this.buildResult({
        operation: "observe",
        status: "observed",
        watchFolder,
        session,
        observation,
        stamp,
        code: "WATCH_FOLDER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Watch Folder Runtime structural observe (F3-CAP-02 foundation — no real observation).",
      });
      return {
        ok: true,
        result,
        watchFolder,
        session,
        observation,
        code: "WATCH_FOLDER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: WatchFolderStatsInput = {}): Promise<WatchFolderStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "WATCH_FOLDER_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Watch Folder Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "WATCH_FOLDER_RUNTIME_OK",
        message: `Watch Folder Runtime stats: ${statistics.totalWatchFolders} watchFolders, ${statistics.totalObservations} observations.`,
      };
    });
  }

  private resolveWatchFolder(
    watchFolderId: string | undefined,
    watchFolderName: string | undefined,
  ): CanonicalWatchFolder | undefined {
    if (watchFolderId) {
      const byId = this.store.getWatchFolder(watchFolderId);
      if (byId) return byId;
    }
    if (watchFolderName) return this.store.getWatchFolderByName(watchFolderName);
    const all = this.store.listWatchFolders();
    return all[0];
  }

  private buildResult(args: {
    operation: CanonicalWatchFolderResult["operation"];
    status: CanonicalWatchFolderResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    watchFolder?: CanonicalWatchFolder;
    session?: CanonicalWatchFolderSession;
    observation?: CanonicalWatchFolderObservation;
    watchFolders?: readonly CanonicalWatchFolder[];
  }): CanonicalWatchFolderResult {
    return {
      kind: "canonical-watch-folder-result",
      ok: true,
      resultId: createWatchFolderResultId(),
      operation: args.operation,
      watchFolder: args.watchFolder,
      session: args.session,
      observation: args.observation,
      watchFolders: args.watchFolders,
      provider: {
        kind: "canonical-watch-folder-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      localWatchImplemented: false,
      networkWatchImplemented: false,
      uncImplemented: false,
      smbImplemented: false,
      azureFilesImplemented: false,
      pollingImplemented: false,
      fileSystemWatcherImplemented: false,
      recursiveWatchImplemented: false,
      changeNotificationImplemented: false,
      automaticImportImplemented: false,
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
    input: WatchFolderRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & WatchFolderRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createWatchFolderRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: WatchFolderRuntimeStructuredLog[] = [];
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
            code: "WATCH_FOLDER_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & WatchFolderRuntimeOperationEnvelope;
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
            code: body.code ?? "WATCH_FOLDER_RUNTIME_OK",
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
            code: "WATCH_FOLDER_RUNTIME_RETRY",
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
        code: "WATCH_FOLDER_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & WatchFolderRuntimeOperationEnvelope;
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
          ? "WATCH_FOLDER_RUNTIME_CANCELLED"
          : isTimeout
            ? "WATCH_FOLDER_RUNTIME_TIMEOUT"
            : "WATCH_FOLDER_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & WatchFolderRuntimeOperationEnvelope;
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
              const err = new Error(
                `Watch Folder Runtime operation timed out after ${timeoutMs}ms`,
              );
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Watch Folder Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (F3-CAP-02). */
export const EnterpriseWatchFolderRuntimeAdapter = DefaultWatchFolderRuntimeAdapter;
