/**
 * DefaultScalabilityRuntimeAdapter — INF-10.
 *
 * Adapter oficial do Enterprise Scalability Runtime.
 * Responde exclusivamente de forma estrutural (sem OpenTelemetry / sem App Insights / sem Prometheus).
 * Sem logs reais. Sem métricas reais. Sem tracing. Sem alertas. Sem dashboards. Sem telemetria HTTP.
 */
import {
  DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES,
  toCanonicalScalabilityCapabilities,
} from "../ports/capabilities";
import {
  createScalabilityScopeId,
  createScalabilityEnvelopeId,
  createScalabilitySignalId,
  createScalabilityResultId,
  createScalabilityRuntimeRequestId,
} from "../ports/identity";
import type { ScalabilityRuntimePort } from "../ports/scalability-runtime-port";
import type {
  CanonicalScalabilityScope,
  CanonicalScalabilityEnvelope,
  CanonicalScalabilitySignal,
  CanonicalScalabilityResult,
} from "../ports/canonical";
import type {
  ReleaseSignalInput,
  ReleaseSignalResult,
  ListScalabilityScopesInput,
  ListScalabilityScopesResult,
  RegisterScalabilityScopeInput,
  RegisterScalabilityScopeResult,
  ObserveSignalInput,
  ObserveSignalResult,
  ScalabilityRuntimeEnterpriseDeps,
  ScalabilityRuntimeHealth,
  ScalabilityRuntimeInfo,
  ScalabilityRuntimeOperationEnvelope,
  ScalabilityRuntimeOperationalControls,
  ScalabilityRuntimePortCapabilities,
  ScalabilityRuntimeProviderId,
  ScalabilityRuntimeProviderMetadata,
  ScalabilityRuntimeStructuredLog,
  ScalabilityStatsInput,
  ScalabilityStatsResult,
  UnregisterScalabilityScopeInput,
  UnregisterScalabilityScopeResult,
} from "../ports/types";
import { InMemoryScalabilityRuntimeStore, type ScalabilityRuntimeStore } from "../store";

export const DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID = "default-enterprise-scalability";
export const DEFAULT_SCALABILITY_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultScalabilityRuntimeAdapterOptions = {
  provider?: Extract<ScalabilityRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: ScalabilityRuntimeStore;
  enterpriseDeps?: ScalabilityRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry estrutural). */
  failAttempts?: number;
};

function readSignal(input: ScalabilityRuntimeOperationalControls): AbortSignal | undefined {
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
  realScalabilityBackend: false,
  kubernetesImplemented: false,
  dockerSwarmImplemented: false,
  azureScaleSetImplemented: false,
  horizontalPodAutoscalerImplemented: false,
  autoScalingImplemented: false,
  clusterImplemented: false,
  loadBalancerImplemented: false,
  failoverImplemented: false,
  shardingImplemented: false,
  partitioningImplemented: false,
  horizontalScalingImplemented: false,
  verticalScalingImplemented: false,
  nodeManagementImplemented: false,
  highAvailabilityImplemented: false,
  elasticScalingImplemented: false,
  capacityPlanningImplemented: false,
  realScalabilityOrchestrationImplemented: false,
  realDistributedProcessingImplemented: false,
  realExternalIntegrationImplemented: false,
} as const;

/**
 * Adapter oficial INF-10 — Scalability Runtime default / enterprise.
 */
export class DefaultScalabilityRuntimeAdapter implements ScalabilityRuntimePort {
  readonly providerId: Extract<ScalabilityRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: ScalabilityRuntimeProviderMetadata;
  private readonly store: ScalabilityRuntimeStore;
  private readonly enterpriseDeps?: ScalabilityRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultScalabilityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Scalability Runtime ready (structural only — no real scalability backend / no OpenTelemetry / no Application Insights).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Scalability Runtime"
          : "Enterprise Scalability Runtime",
      version: DEFAULT_SCALABILITY_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official INF-10 Enterprise Scalability Runtime — canonical scalability infrastructure only.",
    };
    this.store = options.store ?? new InMemoryScalabilityRuntimeStore();
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
          "DefaultScalabilityRuntimeAdapter exige enterpriseDeps.getQueueRuntimePort (INF-10) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getWorkerRuntimePort !== "function") {
        throw new Error(
          "DefaultScalabilityRuntimeAdapter exige enterpriseDeps.getWorkerRuntimePort (INF-10) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getSchedulerRuntimePort !== "function") {
        throw new Error(
          "DefaultScalabilityRuntimeAdapter exige enterpriseDeps.getSchedulerRuntimePort (INF-10) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort !== "function") {
        throw new Error(
          "DefaultScalabilityRuntimeAdapter exige enterpriseDeps.getPersistentQueueRuntimePort (INF-10) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getObservabilityRuntimePort !== "function") {
        throw new Error(
          "DefaultScalabilityRuntimeAdapter exige enterpriseDeps.getObservabilityRuntimePort (INF-10) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getTISSRuntimePort !== "function") {
        throw new Error(
          "DefaultScalabilityRuntimeAdapter exige enterpriseDeps.getTISSRuntimePort (INF-10) quando deps são fornecidas.",
        );
      }
    }
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): ScalabilityRuntimeStore {
    return this.store;
  }

  capabilities(): ScalabilityRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES },
      canonical: toCanonicalScalabilityCapabilities(DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES),
      supportsCanonicalScalability: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesTISSRuntimePort: true,
      runtimeReady: true,
      ...STRUCTURAL_FLAGS,
      implementsKubernetes: false,
      implementsDockerSwarm: false,
      implementsAzureScaleSet: false,
      implementsHorizontalPodAutoscaler: false,
      implementsAutoScaling: false,
      implementsCluster: false,
      implementsLoadBalancer: false,
      implementsFailover: false,
      implementsSharding: false,
      implementsPartitioning: false,
      implementsHorizontalScaling: false,
      implementsVerticalScaling: false,
      implementsNodeManagement: false,
      implementsHighAvailability: false,
      implementsElasticScaling: false,
      implementsCapacityPlanning: false,
      implementsRealScalabilityOrchestration: false,
      implementsRealDistributedProcessing: false,
      implementsRealExternalIntegration: false,
      implementsRealScalabilityBackend: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): ScalabilityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SCALABILITY_RUNTIME",
      capabilities: { ...DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<ScalabilityRuntimeHealth> {
    const storeHealth = this.store.health();
    let queueRuntimeOk = true;
    let workerRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let observabilityRuntimeOk = true;
    let tissRuntimeOk = true;
    if (this.enterpriseDeps) {
      // INF-10: deps preparadas — valida Port shape sem chamar health()
      // (evita ciclos Scalability.health ↔ Queue/Worker/Scheduler/PQR/Obs/TISS.health).
      const queuePort = this.enterpriseDeps.getQueueRuntimePort();
      const workerPort = this.enterpriseDeps.getWorkerRuntimePort();
      const schedulerPort = this.enterpriseDeps.getSchedulerRuntimePort();
      const persistentQueuePort = this.enterpriseDeps.getPersistentQueueRuntimePort();
      const observabilityPort = this.enterpriseDeps.getObservabilityRuntimePort();
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
      observabilityRuntimeOk =
        !!observabilityPort &&
        typeof observabilityPort.health === "function" &&
        typeof observabilityPort.capabilities === "function";
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
      observabilityRuntimeOk &&
      tissRuntimeOk;
    return {
      kind: "canonical-scalability-health",
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
      observabilityRuntimeOk,
      tissRuntimeOk,
      runtimeReady: true,
      ...STRUCTURAL_FLAGS,
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "Scalability Runtime unhealthy.",
    };
  }

  async register(input: RegisterScalabilityScopeInput): Promise<RegisterScalabilityScopeResult> {
    return this.runOperation("register", input, async () => {
      const stamp = this.now();
      const scopeName = input.scopeName ?? "canonical-foundation-scalability-scope";
      const existing = input.scopeId
        ? this.store.getScope(input.scopeId)
        : this.store.getScopeByName(scopeName);
      if (existing) {
        return {
          ok: false,
          code: "SCALABILITY_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical scope already registered.",
          scope: existing,
        };
      }
      const scopeId = input.scopeId ?? createScalabilityScopeId();
      const scope: CanonicalScalabilityScope = {
        kind: "canonical-scalability-scope",
        scopeId,
        scopeName,
        identity: {
          kind: "canonical-scalability-identity",
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
        code: "SCALABILITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scalability Runtime structural register (INF-10 foundation — no real scalability backend).",
      });
      return {
        ok: true,
        result,
        scope,
        code: "SCALABILITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregister(
    input: UnregisterScalabilityScopeInput,
  ): Promise<UnregisterScalabilityScopeResult> {
    return this.runOperation("unregister", input, async () => {
      const existing = this.store.getScope(input.scopeId);
      if (!existing) {
        return {
          ok: false,
          code: "SCALABILITY_RUNTIME_SCOPE_NOT_FOUND",
          message: "Canonical scope not found.",
        };
      }
      const stamp = this.now();
      const scope: CanonicalScalabilityScope = {
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
        code: "SCALABILITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scalability Runtime structural unregister (INF-10 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        scope,
        code: "SCALABILITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async observe(input: ObserveSignalInput): Promise<ObserveSignalResult> {
    return this.runOperation("observe", input, async () => {
      const stamp = this.now();
      let scope = this.resolveScope(input.scopeId, input.scopeName);
      if (!scope) {
        const scopeName = input.scopeName ?? "canonical-foundation-scalability-scope";
        const scopeId = input.scopeId ?? createScalabilityScopeId();
        scope = {
          kind: "canonical-scalability-scope",
          scopeId,
          scopeName,
          identity: {
            kind: "canonical-scalability-identity",
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
      const signalId = input.signalId ?? createScalabilitySignalId();
      const scalabilitySignal: CanonicalScalabilitySignal = {
        kind: "canonical-scalability-signal",
        signalId,
        scopeId: scope.scopeId,
        identity: {
          kind: "canonical-scalability-identity",
          scopeId: scope.scopeId,
          scopeName: scope.scopeName,
          signalId,
        },
        metadata: input.metadata,
        status: "observed",
        registeredAt: stamp,
        updatedAt: stamp,
        realScalabilityBackend: false,
        kubernetesImplemented: false,
        dockerSwarmImplemented: false,
        horizontalScalingImplemented: false,
        verticalScalingImplemented: false,
        nodeManagementImplemented: false,
        realScalabilityOrchestrationImplemented: false,
      };
      this.store.setSignal(scalabilitySignal);
      const envelope: CanonicalScalabilityEnvelope = {
        kind: "canonical-scalability-envelope",
        envelopeId: createScalabilityEnvelopeId(),
        scopeId: scope.scopeId,
        signalId,
        identity: {
          kind: "canonical-scalability-identity",
          scopeId: scope.scopeId,
          signalId,
        },
        metadata: input.metadata,
        status: "observed",
        createdAt: stamp,
        updatedAt: stamp,
        realScalabilityBackend: false,
        kubernetesImplemented: false,
        horizontalPodAutoscalerImplemented: false,
        horizontalScalingImplemented: false,
        realScalabilityOrchestrationImplemented: false,
      };
      this.store.setEnvelope(envelope);
      const updated: CanonicalScalabilityScope = {
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
        signal: scalabilitySignal,
        envelope,
        stamp,
        code: "SCALABILITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scalability Runtime structural observe (INF-10 foundation — no OpenTelemetry / no Application Insights).",
      });
      return {
        ok: true,
        result,
        scope: updated,
        scalabilitySignal,
        envelope,
        code: "SCALABILITY_RUNTIME_OK",
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
          code: "SCALABILITY_RUNTIME_SCOPE_NOT_FOUND",
          message: "Canonical scalability scope not found.",
        };
      }
      const stamp = this.now();
      const scope: CanonicalScalabilityScope = {
        ...existing,
        status: "released",
        active: false,
        updatedAt: stamp,
      };
      this.store.setScope(scope);
      let scalabilitySignal: CanonicalScalabilitySignal | undefined;
      if (input.signalId) {
        const existingSignal = this.store.getSignal(input.signalId);
        if (existingSignal) {
          scalabilitySignal = { ...existingSignal, status: "released", updatedAt: stamp };
          this.store.setSignal(scalabilitySignal);
        }
      }
      const result = this.buildResult({
        operation: "release",
        status: "released",
        scope,
        signal: scalabilitySignal,
        stamp,
        code: "SCALABILITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Scalability Runtime structural release (INF-10 foundation — no real backend release).",
      });
      return {
        ok: true,
        result,
        scope,
        scalabilitySignal,
        code: "SCALABILITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async list(input: ListScalabilityScopesInput = {}): Promise<ListScalabilityScopesResult> {
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
        code: "SCALABILITY_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Scalability Runtime structural list.",
      });
      return {
        ok: true,
        scopes,
        signals,
        result,
        code: "SCALABILITY_RUNTIME_OK",
        message: `Scalability Runtime list: ${scopes.length} scopes, ${signals.length} signals.`,
      };
    });
  }

  async stats(input: ScalabilityStatsInput = {}): Promise<ScalabilityStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "SCALABILITY_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Scalability Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "SCALABILITY_RUNTIME_OK",
        message: `Scalability Runtime stats: ${statistics.totalScopes} scopes, ${statistics.totalSignals} signals.`,
      };
    });
  }

  private resolveScope(
    scopeId: string | undefined,
    scopeName: string | undefined,
  ): CanonicalScalabilityScope | undefined {
    if (scopeId) {
      const byId = this.store.getScope(scopeId);
      if (byId) return byId;
    }
    if (scopeName) return this.store.getScopeByName(scopeName);
    const all = this.store.listScopes();
    return all[0];
  }

  private buildResult(args: {
    operation: CanonicalScalabilityResult["operation"];
    status: CanonicalScalabilityResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    scope?: CanonicalScalabilityScope;
    signal?: CanonicalScalabilitySignal;
    envelope?: CanonicalScalabilityEnvelope;
  }): CanonicalScalabilityResult {
    return {
      kind: "canonical-scalability-result",
      ok: true,
      resultId: createScalabilityResultId(),
      operation: args.operation,
      scope: args.scope,
      signal: args.signal,
      envelope: args.envelope,
      provider: {
        kind: "canonical-scalability-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID,
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
    input: ScalabilityRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & ScalabilityRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createScalabilityRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: ScalabilityRuntimeStructuredLog[] = [];
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
            code: "SCALABILITY_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & ScalabilityRuntimeOperationEnvelope;
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
            code: body.code ?? "SCALABILITY_RUNTIME_OK",
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
            code: "SCALABILITY_RUNTIME_RETRY",
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
        code: "SCALABILITY_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ScalabilityRuntimeOperationEnvelope;
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
          ? "SCALABILITY_RUNTIME_CANCELLED"
          : isTimeout
            ? "SCALABILITY_RUNTIME_TIMEOUT"
            : "SCALABILITY_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & ScalabilityRuntimeOperationEnvelope;
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
              const err = new Error(`Scalability Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Scalability Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (INF-10). */
export const EnterpriseScalabilityRuntimeAdapter = DefaultScalabilityRuntimeAdapter;
