/**
 * DefaultTenantRuntimeAdapter — S3-02.
 *
 * Adapter oficial do Enterprise Tenant Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerFinding/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem identidade real. Sem criptografia. Sem assinatura digital.
 * Sem cadeia de custódia. Sem Key Vault. Sem HSM. Sem SIEM.
 * Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 */
import {
  DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalTenantCapabilities,
} from "../ports/capabilities";
import {
  TENANT_RUNTIME_IDENTITY,
  createTenantFindingId,
  createTenantJobId,
  createTenantRequestId,
  createTenantResultId,
  createTenantRuntimeRequestId,
} from "../ports/tenant";
import type { TenantRuntimePort } from "../ports/tenant-runtime-port";
import type { TenantFinding, TenantJob, TenantRequest, TenantResult } from "../ports/canonical";
import type {
  TenantRuntimeCapabilities,
  TenantRuntimeEnterpriseDeps,
  TenantRuntimeHealth,
  TenantRuntimeInfo,
  TenantRuntimeOperationalControls,
  TenantRuntimeOperationEnvelope,
  TenantRuntimeProviderId,
  TenantRuntimeProviderMetadata,
  TenantRuntimeStructuredLog,
  TenantStatsInput,
  TenantStatsResult,
  CloseTenantJobInput,
  CloseTenantJobResult,
  GetTenantResultInput,
  GetTenantResultResult,
  OpenTenantJobInput,
  OpenTenantJobResult,
  RegisterTenantFindingInput,
  RegisterTenantFindingResult,
  SubmitTenantRequestInput,
  SubmitTenantRequestResult,
} from "../ports/types";
import { InMemoryTenantRuntimeStore, type TenantRuntimeStore } from "../store";

export const DEFAULT_TENANT_RUNTIME_ADAPTER_ID = "default-enterprise-tenant-runtime";
export const DEFAULT_TENANT_RUNTIME_VERSION = TENANT_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultTenantRuntimeAdapterOptions = {
  provider?: Extract<TenantRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: TenantRuntimeStore;
  enterpriseDeps?: TenantRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(input: TenantRuntimeOperationalControls): AbortSignal | undefined {
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

function structuralFlags() {
  return {
    tenantEngineImplemented: false,
    businessRulesImplemented: false,
    tissTenantImplemented: false,
    operatorTenantImplemented: false,
    automaticTenantImplemented: false,
    tenantSuggestionsImplemented: false,
    tenantJustificationImplemented: false,
    tenantScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial S3-02 — Tenant Runtime default / enterprise.
 */
export class DefaultTenantRuntimeAdapter implements TenantRuntimePort {
  readonly providerId: Extract<TenantRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: TenantRuntimeProviderMetadata;
  private readonly store: TenantRuntimeStore;
  private readonly enterpriseDeps: TenantRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultTenantRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Tenant Runtime ready (structural only — no real tenant).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default Tenant Runtime" : TENANT_RUNTIME_IDENTITY.name,
      version: DEFAULT_TENANT_RUNTIME_VERSION,
      vendor: TENANT_RUNTIME_IDENTITY.vendor,
      layer: TENANT_RUNTIME_IDENTITY.layer,
      vendorAgnostic: TENANT_RUNTIME_IDENTITY.vendorAgnostic,
      description: TENANT_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryTenantRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): TenantRuntimeStore {
    return this.store;
  }

  capabilities(): TenantRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_TENANT_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalTenant: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAIOrchestrationRuntimePort: false,
      usesValidationRuntimePort: false,
      usesDocumentExtractionRuntimePort: false,
      usesDocumentClassificationRuntimePort: false,
      usesOCRRuntimePort: false,
      usesIntelligentCaptureRuntimePort: false,
      usesScannerRuntimePort: false,
      usesWatchFolderRuntimePort: false,
      usesUploadRuntimePort: false,
      usesPersistentQueueRuntimePort: false,
      usesWorkerRuntimePort: false,
      usesSchedulerRuntimePort: false,
      usesObservabilityRuntimePort: false,
      usesScalabilityRuntimePort: false,
      runtimeReady: true,
      ...structuralFlags(),
      engine: { ...DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalTenantCapabilities(DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): TenantRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TENANT_RUNTIME",
      capabilities: { ...DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<TenantRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = this.healthy && storeHealth.ok;

    return {
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      storedJobCount: this.store.jobCount(),
      storedRequestCount: this.store.requestCount(),
      storedFindingCount: this.store.findingCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Tenant Runtime pronto (estrutural S3-02 — sem identidade real)."
          : "Tenant Runtime degradado — ver store."
        : "Tenant Runtime unhealthy.",
    };
  }

  async openJob(input: OpenTenantJobInput): Promise<OpenTenantJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createTenantJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "TENANT_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical TenantJob already open.",
          job: existing,
        };
      }
      const tenantContext = input.tenantContext ?? {
        kind: "canonical-tenant-context" as const,
        jobId,
      };
      const job: TenantJob = {
        kind: "canonical-tenant-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-tenant-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        tenantContext,
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setJob(job);
      const result = this.buildResult({
        operation: "openJob",
        status: "job-open",
        job,
        stamp,
        code: "TENANT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Tenant Runtime structural openJob (S3-02 foundation — no real tenant).",
        tenantContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "TENANT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseTenantJobInput): Promise<CloseTenantJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "TENANT_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical TenantJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: TenantJob = {
        ...existing,
        status: "job-closed",
        closedAt: stamp,
        updatedAt: stamp,
      };
      this.store.setJob(job);
      const result = this.buildResult({
        operation: "closeJob",
        status: "job-closed",
        job,
        stamp,
        code: "TENANT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Tenant Runtime structural closeJob (S3-02 foundation — no real teardown).",
        tenantContext: job.tenantContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "TENANT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitTenantRequestInput): Promise<SubmitTenantRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createTenantJobId();
        job = {
          kind: "canonical-tenant-job",
          jobId,
          status: "job-open",
          tenantContext: input.tenantContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createTenantRequestId();
      const tenantContext = input.tenantContext ??
        job.tenantContext ?? {
          kind: "canonical-tenant-context" as const,
          jobId: job.jobId,
          requestId,
          findingId: input.findingId,
        };
      const request: TenantRequest = {
        kind: "canonical-tenant-request",
        requestId,
        jobId: job.jobId,
        findingId: input.findingId,
        status: "submitted",
        metadata: input.metadata,
        tenantContext,
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setRequest(request);
      const result = this.buildResult({
        operation: "submitRequest",
        status: "submitted",
        job,
        request,
        stamp,
        code: "TENANT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Tenant Runtime structural submitRequest (S3-02 foundation — no tenant dispatch).",
        tenantContext,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "TENANT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerFinding(input: RegisterTenantFindingInput): Promise<RegisterTenantFindingResult> {
    return this.runOperation("registerFinding", input, async () => {
      const stamp = nowIso(this.now);
      const findingId = input.findingId ?? createTenantFindingId();
      const tenantContext = input.tenantContext ?? {
        kind: "canonical-tenant-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        findingId,
      };
      const finding: TenantFinding = {
        kind: "canonical-tenant-finding",
        findingId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        tenantType: input.tenantType,
        issues: [],
        metadata: input.metadata,
        tenantContext,
        createdAt: stamp,
        updatedAt: stamp,
        tenantEngineImplemented: false,
        automaticTenantImplemented: false,
        tenantSuggestionsImplemented: false,
        tissTenantImplemented: false,
        operatorTenantImplemented: false,
      };
      this.store.setFinding(finding);
      const result = this.buildResult({
        operation: "registerFinding",
        status: "registered",
        finding,
        stamp,
        code: "TENANT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Tenant Runtime structural registerFinding (S3-02 foundation — no tenant engine).",
        tenantContext,
      });
      return {
        ok: true,
        result,
        finding,
        code: "TENANT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetTenantResultInput): Promise<GetTenantResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const finding = input.findingId ? this.store.getFinding(input.findingId) : undefined;
      if (!job && !request && !finding) {
        return {
          ok: false,
          code: "TENANT_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Tenant job/request/finding not found.",
        };
      }
      const stamp = nowIso(this.now);
      const tenantContext = request?.tenantContext ?? job?.tenantContext ?? finding?.tenantContext;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? finding?.status ?? "processed",
        job,
        request,
        finding,
        stamp,
        code: "TENANT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Tenant Runtime structural getResult (S3-02 foundation — no real tenant).",
        tenantContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        finding,
        code: "TENANT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: TenantStatsInput = {}): Promise<TenantStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "TENANT_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Tenant Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "TENANT_RUNTIME_OK",
        message: `Tenant Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalFindings} findings.`,
      };
    });
  }

  private buildResult(args: {
    operation: TenantResult["operation"];
    status: TenantResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: TenantJob;
    request?: TenantRequest;
    finding?: TenantFinding;
    tenantContext?: TenantResult["tenantContext"];
  }): TenantResult {
    return {
      kind: "canonical-tenant-result",
      ok: true,
      resultId: createTenantResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      finding: args.finding,
      tenantContext: args.tenantContext,
      ...structuralFlags(),
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
    input: TenantRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & TenantRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createTenantRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: TenantRuntimeStructuredLog[] = [];
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
            code: "TENANT_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & TenantRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "TENANT_RUNTIME_RETRY",
            message: "Transient structural failure — retrying.",
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          if (attempt < retryCount) {
            await this.sleep(this.defaultRetryBackoffMs * attempts);
            continue;
          }
          break;
        }

        const outcome = await Promise.race([
          fn(),
          new Promise<never>((_, reject) => {
            const timer = setTimeout(() => {
              reject(new Error("Tenant Runtime operation timed out."));
            }, timeoutMs);
            if (typeof timer === "object" && "unref" in timer) {
              (timer as { unref?: () => void }).unref?.();
            }
          }),
        ]);

        const end = typeof performance !== "undefined" ? performance.now() : Date.now();
        return {
          ...outcome,
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
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "TENANT_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Tenant Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & TenantRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Tenant Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "TENANT_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & TenantRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (S3-02). */
export const EnterpriseTenantRuntimeAdapter = DefaultTenantRuntimeAdapter;
