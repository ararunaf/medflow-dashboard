/**
 * DefaultObservabilityRuntimeAdapter — INF-09.
 *
 * Adapter oficial do Enterprise Observability Runtime.
 * Responde exclusivamente de forma estrutural (sem OpenTelemetry / sem App Insights / sem Prometheus).
 * Sem logs reais. Sem métricas reais. Sem tracing. Sem alertas. Sem dashboards. Sem telemetria HTTP.
 */
import {
  DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES,
  toCanonicalObservabilityCapabilities,
} from "../ports/capabilities";
import {
  createObservabilityScopeId,
  createObservabilityEnvelopeId,
  createObservabilitySignalId,
  createObservabilityResultId,
  createObservabilityRuntimeRequestId,
} from "../ports/identity";
import type { ObservabilityRuntimePort } from "../ports/observability-runtime-port";
import type {
  CanonicalObservabilityScope,
  CanonicalObservabilityEnvelope,
  CanonicalObservabilitySignal,
  CanonicalObservabilityResult,
} from "../ports/canonical";
import type {
  ReleaseSignalInput,
  ReleaseSignalResult,
  ListObservabilityScopesInput,
  ListObservabilityScopesResult,
  RegisterObservabilityScopeInput,
  RegisterObservabilityScopeResult,
  ObserveSignalInput,
  ObserveSignalResult,
  ObservabilityRuntimeEnterpriseDeps,
  ObservabilityRuntimeHealth,
  ObservabilityRuntimeInfo,
  ObservabilityRuntimeOperationEnvelope,
  ObservabilityRuntimeOperationalControls,
  ObservabilityRuntimePortCapabilities,
  ObservabilityRuntimeProviderId,
  ObservabilityRuntimeProviderMetadata,
  ObservabilityRuntimeStructuredLog,
  ObservabilityStatsInput,
  ObservabilityStatsResult,
  UnregisterObservabilityScopeInput,
  UnregisterObservabilityScopeResult,
} from "../ports/types";
import { InMemoryObservabilityRuntimeStore, type ObservabilityRuntimeStore } from "../store";

export const DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID = "default-enterprise-observability";
export const DEFAULT_OBSERVABILITY_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultObservabilityRuntimeAdapterOptions = {
  provider?: Extract<ObservabilityRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: ObservabilityRuntimeStore;
  enterpriseDeps?: ObservabilityRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry estrutural). */
  failAttempts?: number;
};

function readSignal(input: ObservabilityRuntimeOperationalControls): AbortSignal | undefined {
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

const STRUCTURAL_FLAGS = {
  realObservabilityBackend: false,
  openTelemetryImplemented: false,
  applicationInsightsImplemented: false,
  azureMonitorImplemented: false,
  prometheusImplemented: false,
  grafanaImplemented: false,
  elasticImplemented: false,
  datadogImplemented: false,
  newRelicImplemented: false,
  lokiImplemented: false,
  jaegerImplemented: false,
  realLogsImplemented: false,
  realMetricsImplemented: false,
  realTracingImplemented: false,
  distributedTracingImplemented: false,
  realAlertsImplemented: false,
  realDashboardsImplemented: false,
  realTelemetryImplemented: false,
  realHealthMonitoringImplemented: false,
  realPerformanceMonitoringImplemented: false,
} as const;

/**
 * Adapter oficial INF-09 — Observability Runtime default / enterprise.
 */
export class DefaultObservabilityRuntimeAdapter implements ObservabilityRuntimePort {
  readonly providerId: Extract<ObservabilityRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: ObservabilityRuntimeProviderMetadata;
  private readonly store: ObservabilityRuntimeStore;
  private readonly enterpriseDeps?: ObservabilityRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultObservabilityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Observability Runtime ready (structural only — no real observability backend / no OpenTelemetry / no Application Insights).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Observability Runtime"
          : "Enterprise Observability Runtime",
      version: DEFAULT_OBSERVABILITY_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official INF-09 Enterprise Observability Runtime — canonical observability infrastructure only.",
    };
    this.store = options.store ?? new InMemoryObservabilityRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;

    if (this.enterpriseDeps) {
      if (typeof this.enterpriseDeps.getQueueRuntimePort !== "function") {
        throw new Error(
          "DefaultObservabilityRuntimeAdapter exige enterpriseDeps.getQueueRuntimePort (INF-09) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getWorkerRuntimePort !== "function") {
        throw new Error(
          "DefaultObservabilityRuntimeAdapter exige enterpriseDeps.getWorkerRuntimePort (INF-09) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getSchedulerRuntimePort !== "function") {
        throw new Error(
          "DefaultObservabilityRuntimeAdapter exige enterpriseDeps.getSchedulerRuntimePort (INF-09) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort !== "function") {
        throw new Error(
          "DefaultObservabilityRuntimeAdapter exige enterpriseDeps.getPersistentQueueRuntimePort (INF-09) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getTISSRuntimePort !== "function") {
        throw new Error(
          "DefaultObservabilityRuntimeAdapter exige enterpriseDeps.getTISSRuntimePort (INF-09) quando deps são fornecidas.",
        );
      }
    }
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): ObservabilityRuntimeStore {
    return this.store;
  }

  capabilities(): ObservabilityRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES },
      canonical: toCanonicalObservabilityCapabilities(DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES),
      supportsCanonicalObservability: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesTISSRuntimePort: true,
      runtimeReady: true,
      ...STRUCTURAL_FLAGS,
      implementsOpenTelemetry: false,
      implementsApplicationInsights: false,
      implementsAzureMonitor: false,
      implementsPrometheus: false,
      implementsGrafana: false,
      implementsElastic: false,
      implementsDatadog: false,
      implementsNewRelic: false,
      implementsLoki: false,
      implementsJaeger: false,
      implementsRealLogs: false,
      implementsRealMetrics: false,
      implementsRealTracing: false,
      implementsDistributedTracing: false,
      implementsRealAlerts: false,
      implementsRealDashboards: false,
      implementsRealTelemetry: false,
      implementsRealHealthMonitoring: false,
      implementsRealPerformanceMonitoring: false,
      implementsRealObservabilityBackend: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): ObservabilityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "OBSERVABILITY_RUNTIME",
      capabilities: { ...DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<ObservabilityRuntimeHealth> {
    const storeHealth = this.store.health();
    let queueRuntimeOk = true;
    let workerRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let tissRuntimeOk = true;
    if (this.enterpriseDeps) {
      // INF-09: deps preparadas — valida Port shape sem chamar health()
      // (evita ciclos Observability.health ↔ Queue/Worker/Scheduler/PQR/TISS.health).
      const queuePort = this.enterpriseDeps.getQueueRuntimePort();
      const workerPort = this.enterpriseDeps.getWorkerRuntimePort();
      const schedulerPort = this.enterpriseDeps.getSchedulerRuntimePort();
      const persistentQueuePort = this.enterpriseDeps.getPersistentQueueRuntimePort();
      const tissPort = this.enterpriseDeps.getTISSRuntimePort();
      queueRuntimeOk =
        !!queuePort &&
        typeof queuePort.health === "function" &&
        typeof queuePort.capabilities === "function";
      workerRuntimeOk =
        !!workerPort &&
        typeof workerPort.health === "function" &&
        typeof workerPort.capabilities === "function";
      schedulerRuntimeOk =
        !!schedulerPort &&
        typeof schedulerPort.health === "function" &&
        typeof schedulerPort.capabilities === "function";
      persistentQueueRuntimeOk =
        !!persistentQueuePort &&
        typeof persistentQueuePort.health === "function" &&
        typeof persistentQueuePort.capabilities === "function";
      tissRuntimeOk =
        !!tissPort &&
        typeof tissPort.health === "function" &&
        typeof tissPort.capabilities === "function";
    }
    const ok =
      this.healthy &&
      storeHealth.ok &&
      queueRuntimeOk &&
      workerRuntimeOk &&
      schedulerRuntimeOk &&
      persistentQueueRuntimeOk &&
      tissRuntimeOk;
    return {
      kind: "canonical-observability-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedScopeCount: this.store.scopeCount(),
      storedSignalCount: this.store.signalCount(),
      storedEnvelopeCount: this.store.envelopeCount(),
      queueRuntimeOk,
      workerRuntimeOk,
      schedulerRuntimeOk,
      persistentQueueRuntimeOk,
      tissRuntimeOk,
      runtimeReady: true,
      ...STRUCTURAL_FLAGS,
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "Observability Runtime unhealthy.",
    };
  }

  async register(
    input: RegisterObservabilityScopeInput,
  ): Promise<RegisterObservabilityScopeResult> {
    return this.runOperation("register", input, async () => {
      const stamp = this.now();
      const scopeName = input.scopeName ?? "canonical-foundation-observability-scope";
      const existing = input.scopeId
        ? this.store.getScope(input.scopeId)
        : this.store.getScopeByName(scopeName);
      if (existing) {
        return {
          ok: false,
          code: "OBSERVABILITY_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical scope already registered.",
          scope: existing,
        };
      }
      const scopeId = input.scopeId ?? createObservabilityScopeId();
      const scope: CanonicalObservabilityScope = {
        kind: "canonical-observability-scope",
        scopeId,
        scopeName,
        identity: {
          kind: "canonical-observability-identity",
          scopeId,
          scopeName,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        status: "registered",
        active: false,
        createdAt: stamp,
        updatedAt: stamp,
        ...STRUCTURAL_FLAGS,
      };
      this.store.setScope(scope);
      const result = this.buildResult({
        operation: "register",
        status: "registered",
        scope,
        stamp,
        code: "OBSERVABILITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Observability Runtime structural register (INF-09 foundation — no real observability backend).",
      });
      return {
        ok: true,
        result,
        scope,
        code: "OBSERVABILITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregister(
    input: UnregisterObservabilityScopeInput,
  ): Promise<UnregisterObservabilityScopeResult> {
    return this.runOperation("unregister", input, async () => {
      const existing = this.store.getScope(input.scopeId);
      if (!existing) {
        return {
          ok: false,
          code: "OBSERVABILITY_RUNTIME_SCOPE_NOT_FOUND",
          message: "Canonical scope not found.",
        };
      }
      const stamp = this.now();
      const scope: CanonicalObservabilityScope = {
        ...existing,
        status: "unregistered",
        active: false,
        updatedAt: stamp,
      };
      this.store.removeScope(input.scopeId);
      const result = this.buildResult({
        operation: "unregister",
        status: "unregistered",
        scope,
        stamp,
        code: "OBSERVABILITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Observability Runtime structural unregister (INF-09 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        scope,
        code: "OBSERVABILITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async observe(input: ObserveSignalInput): Promise<ObserveSignalResult> {
    return this.runOperation("observe", input, async () => {
      const stamp = this.now();
      let scope = this.resolveScope(input.scopeId, input.scopeName);
      if (!scope) {
        const scopeName = input.scopeName ?? "canonical-foundation-observability-scope";
        const scopeId = input.scopeId ?? createObservabilityScopeId();
        scope = {
          kind: "canonical-observability-scope",
          scopeId,
          scopeName,
          identity: {
            kind: "canonical-observability-identity",
            scopeId,
            scopeName,
          },
          metadata: input.metadata,
          status: "registered",
          active: false,
          createdAt: stamp,
          updatedAt: stamp,
          ...STRUCTURAL_FLAGS,
        };
        this.store.setScope(scope);
      }
      const signalId = input.signalId ?? createObservabilitySignalId();
      const observabilitySignal: CanonicalObservabilitySignal = {
        kind: "canonical-observability-signal",
        signalId,
        scopeId: scope.scopeId,
        identity: {
          kind: "canonical-observability-identity",
          scopeId: scope.scopeId,
          scopeName: scope.scopeName,
          signalId,
        },
        metadata: input.metadata,
        status: "observed",
        registeredAt: stamp,
        updatedAt: stamp,
        realObservabilityBackend: false,
        openTelemetryImplemented: false,
        applicationInsightsImplemented: false,
        realLogsImplemented: false,
        realMetricsImplemented: false,
        realTracingImplemented: false,
        realTelemetryImplemented: false,
      };
      this.store.setSignal(observabilitySignal);
      const envelope: CanonicalObservabilityEnvelope = {
        kind: "canonical-observability-envelope",
        envelopeId: createObservabilityEnvelopeId(),
        scopeId: scope.scopeId,
        signalId,
        identity: {
          kind: "canonical-observability-identity",
          scopeId: scope.scopeId,
          signalId,
        },
        metadata: input.metadata,
        status: "observed",
        createdAt: stamp,
        updatedAt: stamp,
        realObservabilityBackend: false,
        openTelemetryImplemented: false,
        prometheusImplemented: false,
        realLogsImplemented: false,
        realTelemetryImplemented: false,
      };
      this.store.setEnvelope(envelope);
      const updated: CanonicalObservabilityScope = {
        ...scope,
        status: "observed",
        active: true,
        updatedAt: stamp,
        ...STRUCTURAL_FLAGS,
      };
      this.store.setScope(updated);
      const result = this.buildResult({
        operation: "observe",
        status: "observed",
        scope: updated,
        signal: observabilitySignal,
        envelope,
        stamp,
        code: "OBSERVABILITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Observability Runtime structural observe (INF-09 foundation — no OpenTelemetry / no Application Insights).",
      });
      return {
        ok: true,
        result,
        scope: updated,
        observabilitySignal,
        envelope,
        code: "OBSERVABILITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async release(input: ReleaseSignalInput): Promise<ReleaseSignalResult> {
    return this.runOperation("release", input, async () => {
      const existing = this.store.getScope(input.scopeId);
      if (!existing) {
        return {
          ok: false,
          code: "OBSERVABILITY_RUNTIME_SCOPE_NOT_FOUND",
          message: "Canonical observability scope not found.",
        };
      }
      const stamp = this.now();
      const scope: CanonicalObservabilityScope = {
        ...existing,
        status: "released",
        active: false,
        updatedAt: stamp,
      };
      this.store.setScope(scope);
      let observabilitySignal: CanonicalObservabilitySignal | undefined;
      if (input.signalId) {
        const existingSignal = this.store.getSignal(input.signalId);
        if (existingSignal) {
          observabilitySignal = { ...existingSignal, status: "released", updatedAt: stamp };
          this.store.setSignal(observabilitySignal);
        }
      }
      const result = this.buildResult({
        operation: "release",
        status: "released",
        scope,
        signal: observabilitySignal,
        stamp,
        code: "OBSERVABILITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Observability Runtime structural release (INF-09 foundation — no real backend release).",
      });
      return {
        ok: true,
        result,
        scope,
        observabilitySignal,
        code: "OBSERVABILITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async list(input: ListObservabilityScopesInput = {}): Promise<ListObservabilityScopesResult> {
    return this.runOperation("list", input, async () => {
      let scopes = this.store.listScopes();
      if (input.scopeId) {
        scopes = scopes.filter((s) => s.scopeId === input.scopeId);
      }
      if (input.activeOnly) {
        scopes = scopes.filter((s) => s.active);
      }
      const signals = input.scopeId
        ? this.store.listSignals(input.scopeId)
        : this.store.listSignals();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "list",
        status: "listed",
        stamp,
        code: "OBSERVABILITY_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Observability Runtime structural list.",
      });
      return {
        ok: true,
        scopes,
        signals,
        result,
        code: "OBSERVABILITY_RUNTIME_OK",
        message: `Observability Runtime list: ${scopes.length} scopes, ${signals.length} signals.`,
      };
    });
  }

  async stats(input: ObservabilityStatsInput = {}): Promise<ObservabilityStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "OBSERVABILITY_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Observability Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "OBSERVABILITY_RUNTIME_OK",
        message: `Observability Runtime stats: ${statistics.totalScopes} scopes, ${statistics.totalSignals} signals.`,
      };
    });
  }

  private resolveScope(
    scopeId: string | undefined,
    scopeName: string | undefined,
  ): CanonicalObservabilityScope | undefined {
    if (scopeId) {
      const byId = this.store.getScope(scopeId);
      if (byId) return byId;
    }
    if (scopeName) return this.store.getScopeByName(scopeName);
    const all = this.store.listScopes();
    return all[0];
  }

  private buildResult(args: {
    operation: CanonicalObservabilityResult["operation"];
    status: CanonicalObservabilityResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    scope?: CanonicalObservabilityScope;
    signal?: CanonicalObservabilitySignal;
    envelope?: CanonicalObservabilityEnvelope;
  }): CanonicalObservabilityResult {
    return {
      kind: "canonical-observability-result",
      ok: true,
      resultId: createObservabilityResultId(),
      operation: args.operation,
      scope: args.scope,
      signal: args.signal,
      envelope: args.envelope,
      provider: {
        kind: "canonical-observability-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      ...STRUCTURAL_FLAGS,
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
    input: ObservabilityRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & ObservabilityRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createObservabilityRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: ObservabilityRuntimeStructuredLog[] = [];
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
            code: "OBSERVABILITY_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & ObservabilityRuntimeOperationEnvelope;
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
            code: body.code ?? "OBSERVABILITY_RUNTIME_OK",
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
            code: "OBSERVABILITY_RUNTIME_RETRY",
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
        code: "OBSERVABILITY_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ObservabilityRuntimeOperationEnvelope;
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
          ? "OBSERVABILITY_RUNTIME_CANCELLED"
          : isTimeout
            ? "OBSERVABILITY_RUNTIME_TIMEOUT"
            : "OBSERVABILITY_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & ObservabilityRuntimeOperationEnvelope;
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
                `Observability Runtime operation timed out after ${timeoutMs}ms`,
              );
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Observability Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (INF-09). */
export const EnterpriseObservabilityRuntimeAdapter = DefaultObservabilityRuntimeAdapter;
