/**
 * DefaultScannerRuntimeAdapter — F3-CAP-01.
 *
 * Adapter oficial do Enterprise Scanner Runtime.
 * Responde exclusivamente de forma estrutural (sem Scanner real / sem drivers).
 * Sem TWAIN. Sem WIA. Sem ISIS. Sem USB. Sem Rede. Sem OCR. Sem Upload.
 */
import {
  DEFAULT_SCANNER_RUNTIME_CAPABILITIES,
  toCanonicalScannerCapabilities,
} from "../ports/capabilities";
import {
  SCANNER_RUNTIME_IDENTITY,
  createScannerAcquisitionId,
  createScannerId,
  createScannerResultId,
  createScannerRuntimeRequestId,
  createScannerSessionId,
} from "../ports/identity";
import type { ScannerRuntimePort } from "../ports/scanner-runtime-port";
import type {
  CanonicalScanner,
  CanonicalScannerAcquisition,
  CanonicalScannerResult,
  CanonicalScannerSession,
} from "../ports/canonical";
import type {
  AcquireScannerInput,
  AcquireScannerResult,
  CloseScannerSessionInput,
  CloseScannerSessionResult,
  DiscoverScannersInput,
  DiscoverScannersResult,
  OpenScannerSessionInput,
  OpenScannerSessionResult,
  RegisterScannerInput,
  RegisterScannerResult,
  ScannerRuntimeEnterpriseDeps,
  ScannerRuntimeHealth,
  ScannerRuntimeInfo,
  ScannerRuntimeOperationEnvelope,
  ScannerRuntimeOperationalControls,
  ScannerRuntimePortCapabilities,
  ScannerRuntimeProviderId,
  ScannerRuntimeProviderMetadata,
  ScannerRuntimeStructuredLog,
  ScannerStatsInput,
  ScannerStatsResult,
  UnregisterScannerInput,
  UnregisterScannerResult,
} from "../ports/types";
import { InMemoryScannerRuntimeStore, type ScannerRuntimeStore } from "../store";

export const DEFAULT_SCANNER_RUNTIME_ADAPTER_ID = "default-enterprise-scanner";
export const DEFAULT_SCANNER_RUNTIME_VERSION = SCANNER_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultScannerRuntimeAdapterOptions = {
  provider?: Extract<ScannerRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: ScannerRuntimeStore;
  enterpriseDeps?: ScannerRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: ScannerRuntimeOperationalControls): AbortSignal | undefined {
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
 * Adapter oficial F3-CAP-01 — Scanner Runtime default / enterprise.
 */
export class DefaultScannerRuntimeAdapter implements ScannerRuntimePort {
  readonly providerId: Extract<ScannerRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: ScannerRuntimeProviderMetadata;
  private readonly store: ScannerRuntimeStore;
  private readonly enterpriseDeps?: ScannerRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultScannerRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Scanner Runtime ready (structural only — no real scanner / no drivers).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default Scanner Runtime" : SCANNER_RUNTIME_IDENTITY.name,
      version: DEFAULT_SCANNER_RUNTIME_VERSION,
      vendor: SCANNER_RUNTIME_IDENTITY.vendor,
      layer: SCANNER_RUNTIME_IDENTITY.layer,
      vendorAgnostic: SCANNER_RUNTIME_IDENTITY.vendorAgnostic,
      description: SCANNER_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryScannerRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): ScannerRuntimeStore {
    return this.store;
  }

  capabilities(): ScannerRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_SCANNER_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_SCANNER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalScannerCapabilities(DEFAULT_SCANNER_RUNTIME_CAPABILITIES),
      supportsCanonicalScanner: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesCaptureEngineRuntimePort: true,
      usesOCRRuntimePort: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      usesTISSRuntimePort: true,
      runtimeReady: true,
      scannerImplemented: false,
      twainImplemented: false,
      wiaImplemented: false,
      isisImplemented: false,
      networkScannerImplemented: false,
      driverImplemented: false,
      captureImplemented: false,
      implementsTwain: false,
      implementsWia: false,
      implementsIsis: false,
      implementsUsb: false,
      implementsNetworkScanner: false,
      implementsWatchFolder: false,
      implementsOcr: false,
      implementsUpload: false,
      implementsHttp: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): ScannerRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SCANNER_RUNTIME",
      capabilities: { ...DEFAULT_SCANNER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<ScannerRuntimeHealth> {
    const storeHealth = this.store.health();
    let captureEngineRuntimeOk = true;
    let ocrRuntimeOk = true;
    let queueRuntimeOk = true;
    let workerRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let observabilityRuntimeOk = true;
    let scalabilityRuntimeOk = true;
    let tissRuntimeOk = true;

    if (this.enterpriseDeps) {
      // Deps estruturais — valida Port shape sem chamar health() (evita ciclos).
      if (typeof this.enterpriseDeps.getCaptureEngineRuntimePort === "function") {
        captureEngineRuntimeOk = portShapeOk(this.enterpriseDeps.getCaptureEngineRuntimePort());
      }
      if (typeof this.enterpriseDeps.getOCRRuntimePort === "function") {
        ocrRuntimeOk = portShapeOk(this.enterpriseDeps.getOCRRuntimePort());
      }
      if (typeof this.enterpriseDeps.getQueueRuntimePort === "function") {
        queueRuntimeOk = portShapeOk(this.enterpriseDeps.getQueueRuntimePort());
      }
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort === "function") {
        persistentQueueRuntimeOk = portShapeOk(this.enterpriseDeps.getPersistentQueueRuntimePort());
      }
      if (typeof this.enterpriseDeps.getScalabilityRuntimePort === "function") {
        scalabilityRuntimeOk = portShapeOk(this.enterpriseDeps.getScalabilityRuntimePort());
      }
      if (typeof this.enterpriseDeps.getTISSRuntimePort === "function") {
        tissRuntimeOk = portShapeOk(this.enterpriseDeps.getTISSRuntimePort());
      }
    }

    const ok =
      this.healthy &&
      storeHealth.ok &&
      captureEngineRuntimeOk &&
      ocrRuntimeOk &&
      queueRuntimeOk &&
      workerRuntimeOk &&
      schedulerRuntimeOk &&
      persistentQueueRuntimeOk &&
      observabilityRuntimeOk &&
      scalabilityRuntimeOk &&
      tissRuntimeOk;

    return {
      kind: "canonical-scanner-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedScannerCount: this.store.scannerCount(),
      storedSessionCount: this.store.sessionCount(),
      storedAcquisitionCount: this.store.acquisitionCount(),
      captureEngineRuntimeOk,
      ocrRuntimeOk,
      queueRuntimeOk,
      workerRuntimeOk,
      schedulerRuntimeOk,
      persistentQueueRuntimeOk,
      observabilityRuntimeOk,
      scalabilityRuntimeOk,
      tissRuntimeOk,
      runtimeReady: true,
      scannerImplemented: false,
      twainImplemented: false,
      wiaImplemented: false,
      isisImplemented: false,
      networkScannerImplemented: false,
      driverImplemented: false,
      captureImplemented: false,
      message: this.healthy ? (storeHealth.message ?? this.message) : "Scanner Runtime unhealthy.",
    };
  }

  async register(input: RegisterScannerInput): Promise<RegisterScannerResult> {
    return this.runOperation("register", input, async () => {
      const stamp = this.now();
      const scannerName = input.scannerName ?? "canonical-foundation-scanner";
      const existing = input.scannerId
        ? this.store.getScanner(input.scannerId)
        : this.store.getScannerByName(scannerName);
      if (existing) {
        return {
          ok: false,
          code: "SCANNER_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical scanner already registered.",
          scanner: existing,
        };
      }
      const scannerId = input.scannerId ?? createScannerId();
      const scanner: CanonicalScanner = {
        kind: "canonical-scanner",
        scannerId,
        scannerName,
        identity: {
          kind: "canonical-scanner-identity",
          scannerId,
          scannerName,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        status: "registered",
        discovered: false,
        createdAt: stamp,
        updatedAt: stamp,
        scannerImplemented: false,
        twainImplemented: false,
        wiaImplemented: false,
        isisImplemented: false,
        networkScannerImplemented: false,
        driverImplemented: false,
        captureImplemented: false,
      };
      this.store.setScanner(scanner);
      const result = this.buildResult({
        operation: "register",
        status: "registered",
        scanner,
        stamp,
        code: "SCANNER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scanner Runtime structural register (F3-CAP-01 foundation — no real scanner).",
      });
      return {
        ok: true,
        result,
        scanner,
        code: "SCANNER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregister(input: UnregisterScannerInput): Promise<UnregisterScannerResult> {
    return this.runOperation("unregister", input, async () => {
      const existing = this.store.getScanner(input.scannerId);
      if (!existing) {
        return {
          ok: false,
          code: "SCANNER_RUNTIME_SCANNER_NOT_FOUND",
          message: "Canonical scanner not found.",
        };
      }
      const stamp = this.now();
      const scanner: CanonicalScanner = {
        ...existing,
        status: "unregistered",
        updatedAt: stamp,
      };
      this.store.removeScanner(input.scannerId);
      const result = this.buildResult({
        operation: "unregister",
        status: "unregistered",
        scanner,
        stamp,
        code: "SCANNER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scanner Runtime structural unregister (F3-CAP-01 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        scanner,
        code: "SCANNER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async discover(input: DiscoverScannersInput = {}): Promise<DiscoverScannersResult> {
    return this.runOperation("discover", input, async () => {
      const stamp = this.now();
      const scanners = this.store.listScanners().map((scanner) => {
        const discovered: CanonicalScanner = {
          ...scanner,
          discovered: true,
          status: scanner.status === "unregistered" ? scanner.status : "discovered",
          updatedAt: stamp,
        };
        this.store.setScanner(discovered);
        return discovered;
      });
      const result = this.buildResult({
        operation: "discover",
        status: "discovered",
        scanners,
        stamp,
        code: "SCANNER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scanner Runtime structural discover (F3-CAP-01 foundation — no TWAIN/WIA/ISIS/USB/network).",
      });
      return {
        ok: true,
        result,
        scanners,
        code: "SCANNER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async openSession(input: OpenScannerSessionInput): Promise<OpenScannerSessionResult> {
    return this.runOperation("openSession", input, async () => {
      const stamp = this.now();
      let scanner = this.resolveScanner(input.scannerId, input.scannerName);
      if (!scanner) {
        const scannerName = input.scannerName ?? "canonical-foundation-scanner";
        const scannerId = input.scannerId ?? createScannerId();
        scanner = {
          kind: "canonical-scanner",
          scannerId,
          scannerName,
          identity: {
            kind: "canonical-scanner-identity",
            scannerId,
            scannerName,
          },
          metadata: input.metadata,
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          scannerImplemented: false,
          twainImplemented: false,
          wiaImplemented: false,
          isisImplemented: false,
          networkScannerImplemented: false,
          driverImplemented: false,
          captureImplemented: false,
        };
        this.store.setScanner(scanner);
      }
      const sessionId = input.sessionId ?? createScannerSessionId();
      const session: CanonicalScannerSession = {
        kind: "canonical-scanner-session",
        sessionId,
        scannerId: scanner.scannerId,
        identity: {
          kind: "canonical-scanner-identity",
          scannerId: scanner.scannerId,
          scannerName: scanner.scannerName,
          sessionId,
        },
        metadata: input.metadata,
        status: "session-open",
        openedAt: stamp,
        updatedAt: stamp,
        scannerImplemented: false,
        twainImplemented: false,
        wiaImplemented: false,
        isisImplemented: false,
        networkScannerImplemented: false,
        driverImplemented: false,
        captureImplemented: false,
      };
      this.store.setSession(session);
      const updated: CanonicalScanner = {
        ...scanner,
        status: "session-open",
        updatedAt: stamp,
      };
      this.store.setScanner(updated);
      const result = this.buildResult({
        operation: "openSession",
        status: "session-open",
        scanner: updated,
        session,
        stamp,
        code: "SCANNER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scanner Runtime structural openSession (F3-CAP-01 foundation — no driver session).",
      });
      return {
        ok: true,
        result,
        scanner: updated,
        session,
        code: "SCANNER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeSession(input: CloseScannerSessionInput): Promise<CloseScannerSessionResult> {
    return this.runOperation("closeSession", input, async () => {
      const existing = this.store.getSession(input.sessionId);
      if (!existing) {
        return {
          ok: false,
          code: "SCANNER_RUNTIME_SESSION_NOT_FOUND",
          message: "Canonical scanner session not found.",
        };
      }
      const stamp = this.now();
      const session: CanonicalScannerSession = {
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
        code: "SCANNER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scanner Runtime structural closeSession (F3-CAP-01 foundation — no real close).",
      });
      return {
        ok: true,
        result,
        session,
        code: "SCANNER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async acquire(input: AcquireScannerInput): Promise<AcquireScannerResult> {
    return this.runOperation("acquire", input, async () => {
      const stamp = this.now();
      let scanner = this.resolveScanner(input.scannerId, undefined);
      if (!scanner) {
        scanner = {
          kind: "canonical-scanner",
          scannerId: input.scannerId ?? createScannerId(),
          scannerName: "canonical-foundation-scanner",
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          scannerImplemented: false,
          twainImplemented: false,
          wiaImplemented: false,
          isisImplemented: false,
          networkScannerImplemented: false,
          driverImplemented: false,
          captureImplemented: false,
        };
        this.store.setScanner(scanner);
      }
      let session = input.sessionId ? this.store.getSession(input.sessionId) : undefined;
      if (!session) {
        const sessionId = createScannerSessionId();
        session = {
          kind: "canonical-scanner-session",
          sessionId,
          scannerId: scanner.scannerId,
          identity: {
            kind: "canonical-scanner-identity",
            scannerId: scanner.scannerId,
            scannerName: scanner.scannerName,
            sessionId,
          },
          metadata: input.metadata,
          status: "session-open",
          openedAt: stamp,
          updatedAt: stamp,
          scannerImplemented: false,
          twainImplemented: false,
          wiaImplemented: false,
          isisImplemented: false,
          networkScannerImplemented: false,
          driverImplemented: false,
          captureImplemented: false,
        };
        this.store.setSession(session);
      }
      const acquisition: CanonicalScannerAcquisition = {
        kind: "canonical-scanner-acquisition",
        acquisitionId: createScannerAcquisitionId(),
        scannerId: scanner.scannerId,
        sessionId: session?.sessionId,
        identity: {
          kind: "canonical-scanner-identity",
          scannerId: scanner.scannerId,
          sessionId: session?.sessionId,
        },
        metadata: input.metadata,
        status: "acquired",
        createdAt: stamp,
        updatedAt: stamp,
        scannerImplemented: false,
        twainImplemented: false,
        wiaImplemented: false,
        isisImplemented: false,
        networkScannerImplemented: false,
        driverImplemented: false,
        captureImplemented: false,
      };
      this.store.setAcquisition(acquisition);
      const result = this.buildResult({
        operation: "acquire",
        status: "acquired",
        scanner,
        session,
        acquisition,
        stamp,
        code: "SCANNER_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scanner Runtime structural acquire (F3-CAP-01 foundation — no real capture).",
      });
      return {
        ok: true,
        result,
        scanner,
        session,
        acquisition,
        code: "SCANNER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: ScannerStatsInput = {}): Promise<ScannerStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "SCANNER_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Scanner Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "SCANNER_RUNTIME_OK",
        message: `Scanner Runtime stats: ${statistics.totalScanners} scanners, ${statistics.totalAcquisitions} acquisitions.`,
      };
    });
  }

  private resolveScanner(
    scannerId: string | undefined,
    scannerName: string | undefined,
  ): CanonicalScanner | undefined {
    if (scannerId) {
      const byId = this.store.getScanner(scannerId);
      if (byId) return byId;
    }
    if (scannerName) return this.store.getScannerByName(scannerName);
    const all = this.store.listScanners();
    return all[0];
  }

  private buildResult(args: {
    operation: CanonicalScannerResult["operation"];
    status: CanonicalScannerResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    scanner?: CanonicalScanner;
    session?: CanonicalScannerSession;
    acquisition?: CanonicalScannerAcquisition;
    scanners?: readonly CanonicalScanner[];
  }): CanonicalScannerResult {
    return {
      kind: "canonical-scanner-result",
      ok: true,
      resultId: createScannerResultId(),
      operation: args.operation,
      scanner: args.scanner,
      session: args.session,
      acquisition: args.acquisition,
      scanners: args.scanners,
      provider: {
        kind: "canonical-scanner-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_SCANNER_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      scannerImplemented: false,
      twainImplemented: false,
      wiaImplemented: false,
      isisImplemented: false,
      networkScannerImplemented: false,
      driverImplemented: false,
      captureImplemented: false,
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
    input: ScannerRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & ScannerRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createScannerRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: ScannerRuntimeStructuredLog[] = [];
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
            code: "SCANNER_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & ScannerRuntimeOperationEnvelope;
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
            code: body.code ?? "SCANNER_RUNTIME_OK",
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
            code: "SCANNER_RUNTIME_RETRY",
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
        code: "SCANNER_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ScannerRuntimeOperationEnvelope;
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
          ? "SCANNER_RUNTIME_CANCELLED"
          : isTimeout
            ? "SCANNER_RUNTIME_TIMEOUT"
            : "SCANNER_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & ScannerRuntimeOperationEnvelope;
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
              const err = new Error(`Scanner Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Scanner Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (F3-CAP-01). */
export const EnterpriseScannerRuntimeAdapter = DefaultScannerRuntimeAdapter;
