/**
 * DefaultSecurityRuntimeAdapter — S1-02.
 *
 * Adapter oficial do Enterprise Security Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerFinding/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem segurança real. Sem criptografia. Sem assinatura digital.
 * Sem cadeia de custódia. Sem Key Vault. Sem HSM. Sem SIEM.
 * Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 */
import {
  DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalSecurityCapabilities,
} from "../ports/capabilities";
import {
  SECURITY_RUNTIME_IDENTITY,
  createSecurityFindingId,
  createSecurityJobId,
  createSecurityRequestId,
  createSecurityResultId,
  createSecurityRuntimeRequestId,
} from "../ports/identity";
import type { SecurityRuntimePort } from "../ports/security-runtime-port";
import type {
  SecurityFinding,
  SecurityJob,
  SecurityRequest,
  SecurityResult,
} from "../ports/canonical";
import type {
  SecurityRuntimeCapabilities,
  SecurityRuntimeEnterpriseDeps,
  SecurityRuntimeHealth,
  SecurityRuntimeInfo,
  SecurityRuntimeOperationalControls,
  SecurityRuntimeOperationEnvelope,
  SecurityRuntimeProviderId,
  SecurityRuntimeProviderMetadata,
  SecurityRuntimeStructuredLog,
  SecurityStatsInput,
  SecurityStatsResult,
  CloseSecurityJobInput,
  CloseSecurityJobResult,
  GetSecurityResultInput,
  GetSecurityResultResult,
  OpenSecurityJobInput,
  OpenSecurityJobResult,
  RegisterSecurityFindingInput,
  RegisterSecurityFindingResult,
  SubmitSecurityRequestInput,
  SubmitSecurityRequestResult,
} from "../ports/types";
import { InMemorySecurityRuntimeStore, type SecurityRuntimeStore } from "../store";

export const DEFAULT_SECURITY_RUNTIME_ADAPTER_ID = "default-enterprise-security-runtime";
export const DEFAULT_SECURITY_RUNTIME_VERSION = SECURITY_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultSecurityRuntimeAdapterOptions = {
  provider?: Extract<SecurityRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: SecurityRuntimeStore;
  enterpriseDeps?: SecurityRuntimeEnterpriseDeps;
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

function readSignal(input: SecurityRuntimeOperationalControls): AbortSignal | undefined {
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
    securityEngineImplemented: false,
    businessRulesImplemented: false,
    tissSecurityImplemented: false,
    operatorSecurityImplemented: false,
    automaticSecurityImplemented: false,
    securitySuggestionsImplemented: false,
    securityJustificationImplemented: false,
    securityScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial S1-02 — Security Runtime default / enterprise.
 */
export class DefaultSecurityRuntimeAdapter implements SecurityRuntimePort {
  readonly providerId: Extract<SecurityRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: SecurityRuntimeProviderMetadata;
  private readonly store: SecurityRuntimeStore;
  private readonly enterpriseDeps: SecurityRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultSecurityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Security Runtime ready (structural only — no real security).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default Security Runtime" : SECURITY_RUNTIME_IDENTITY.name,
      version: DEFAULT_SECURITY_RUNTIME_VERSION,
      vendor: SECURITY_RUNTIME_IDENTITY.vendor,
      layer: SECURITY_RUNTIME_IDENTITY.layer,
      vendorAgnostic: SECURITY_RUNTIME_IDENTITY.vendorAgnostic,
      description: SECURITY_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemorySecurityRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): SecurityRuntimeStore {
    return this.store;
  }

  capabilities(): SecurityRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_SECURITY_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalSecurity: true,
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
      engine: { ...DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalSecurityCapabilities(DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): SecurityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SECURITY_RUNTIME",
      capabilities: { ...DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<SecurityRuntimeHealth> {
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
          ? "Security Runtime pronto (estrutural S1-02 — sem segurança real)."
          : "Security Runtime degradado — ver store."
        : "Security Runtime unhealthy.",
    };
  }

  async openJob(input: OpenSecurityJobInput): Promise<OpenSecurityJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createSecurityJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "SECURITY_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical SecurityJob already open.",
          job: existing,
        };
      }
      const securityContext = input.securityContext ?? {
        kind: "canonical-security-context" as const,
        jobId,
      };
      const job: SecurityJob = {
        kind: "canonical-security-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-security-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        securityContext,
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
        code: "SECURITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Security Runtime structural openJob (S1-02 foundation — no real security).",
        securityContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "SECURITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseSecurityJobInput): Promise<CloseSecurityJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "SECURITY_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical SecurityJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: SecurityJob = {
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
        code: "SECURITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Security Runtime structural closeJob (S1-02 foundation — no real teardown).",
        securityContext: job.securityContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "SECURITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitSecurityRequestInput): Promise<SubmitSecurityRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createSecurityJobId();
        job = {
          kind: "canonical-security-job",
          jobId,
          status: "job-open",
          securityContext: input.securityContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createSecurityRequestId();
      const securityContext = input.securityContext ??
        job.securityContext ?? {
          kind: "canonical-security-context" as const,
          jobId: job.jobId,
          requestId,
          findingId: input.findingId,
        };
      const request: SecurityRequest = {
        kind: "canonical-security-request",
        requestId,
        jobId: job.jobId,
        findingId: input.findingId,
        status: "submitted",
        metadata: input.metadata,
        securityContext,
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
        code: "SECURITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Security Runtime structural submitRequest (S1-02 foundation — no security dispatch).",
        securityContext,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "SECURITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerFinding(
    input: RegisterSecurityFindingInput,
  ): Promise<RegisterSecurityFindingResult> {
    return this.runOperation("registerFinding", input, async () => {
      const stamp = nowIso(this.now);
      const findingId = input.findingId ?? createSecurityFindingId();
      const securityContext = input.securityContext ?? {
        kind: "canonical-security-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        findingId,
      };
      const finding: SecurityFinding = {
        kind: "canonical-security-finding",
        findingId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        securityType: input.securityType,
        issues: [],
        metadata: input.metadata,
        securityContext,
        createdAt: stamp,
        updatedAt: stamp,
        securityEngineImplemented: false,
        automaticSecurityImplemented: false,
        securitySuggestionsImplemented: false,
        tissSecurityImplemented: false,
        operatorSecurityImplemented: false,
      };
      this.store.setFinding(finding);
      const result = this.buildResult({
        operation: "registerFinding",
        status: "registered",
        finding,
        stamp,
        code: "SECURITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Security Runtime structural registerFinding (S1-02 foundation — no security engine).",
        securityContext,
      });
      return {
        ok: true,
        result,
        finding,
        code: "SECURITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetSecurityResultInput): Promise<GetSecurityResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const finding = input.findingId ? this.store.getFinding(input.findingId) : undefined;
      if (!job && !request && !finding) {
        return {
          ok: false,
          code: "SECURITY_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Security job/request/finding not found.",
        };
      }
      const stamp = nowIso(this.now);
      const securityContext =
        request?.securityContext ?? job?.securityContext ?? finding?.securityContext;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? finding?.status ?? "processed",
        job,
        request,
        finding,
        stamp,
        code: "SECURITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Security Runtime structural getResult (S1-02 foundation — no real security).",
        securityContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        finding,
        code: "SECURITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: SecurityStatsInput = {}): Promise<SecurityStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "SECURITY_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Security Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "SECURITY_RUNTIME_OK",
        message: `Security Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalFindings} findings.`,
      };
    });
  }

  private buildResult(args: {
    operation: SecurityResult["operation"];
    status: SecurityResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: SecurityJob;
    request?: SecurityRequest;
    finding?: SecurityFinding;
    securityContext?: SecurityResult["securityContext"];
  }): SecurityResult {
    return {
      kind: "canonical-security-result",
      ok: true,
      resultId: createSecurityResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      finding: args.finding,
      securityContext: args.securityContext,
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
    input: SecurityRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & SecurityRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createSecurityRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: SecurityRuntimeStructuredLog[] = [];
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
            code: "SECURITY_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & SecurityRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "SECURITY_RUNTIME_RETRY",
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
              reject(new Error("Security Runtime operation timed out."));
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
        code: "SECURITY_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Security Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & SecurityRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Security Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "SECURITY_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & SecurityRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (S1-02). */
export const EnterpriseSecurityRuntimeAdapter = DefaultSecurityRuntimeAdapter;
