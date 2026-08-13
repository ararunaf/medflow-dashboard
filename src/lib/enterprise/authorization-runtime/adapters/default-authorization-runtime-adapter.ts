/**
 * DefaultAuthorizationRuntimeAdapter — S3-02.
 *
 * Adapter oficial do Enterprise Authorization Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerFinding/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem identidade real. Sem criptografia. Sem assinatura digital.
 * Sem cadeia de custódia. Sem Key Vault. Sem HSM. Sem SIEM.
 * Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 */
import {
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalAuthorizationCapabilities,
} from "../ports/capabilities";
import {
  AUTHORIZATION_RUNTIME_IDENTITY,
  createAuthorizationFindingId,
  createAuthorizationJobId,
  createAuthorizationRequestId,
  createAuthorizationResultId,
  createAuthorizationRuntimeRequestId,
} from "../ports/authorization";
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type {
  AuthorizationFinding,
  AuthorizationJob,
  AuthorizationRequest,
  AuthorizationResult,
} from "../ports/canonical";
import type {
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeEnterpriseDeps,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeOperationalControls,
  AuthorizationRuntimeOperationEnvelope,
  AuthorizationRuntimeProviderId,
  AuthorizationRuntimeProviderMetadata,
  AuthorizationRuntimeStructuredLog,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  CloseAuthorizationJobInput,
  CloseAuthorizationJobResult,
  GetAuthorizationResultInput,
  GetAuthorizationResultResult,
  OpenAuthorizationJobInput,
  OpenAuthorizationJobResult,
  RegisterAuthorizationFindingInput,
  RegisterAuthorizationFindingResult,
  SubmitAuthorizationRequestInput,
  SubmitAuthorizationRequestResult,
} from "../ports/types";
import { InMemoryAuthorizationRuntimeStore, type AuthorizationRuntimeStore } from "../store";

export const DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID = "default-enterprise-authorization-runtime";
export const DEFAULT_AUTHORIZATION_RUNTIME_VERSION = AUTHORIZATION_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultAuthorizationRuntimeAdapterOptions = {
  provider?: Extract<AuthorizationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: AuthorizationRuntimeStore;
  enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;
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

function readSignal(input: AuthorizationRuntimeOperationalControls): AbortSignal | undefined {
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
    authorizationEngineImplemented: false,
    businessRulesImplemented: false,
    tissAuthorizationImplemented: false,
    operatorAuthorizationImplemented: false,
    automaticAuthorizationImplemented: false,
    authorizationSuggestionsImplemented: false,
    authorizationJustificationImplemented: false,
    authorizationScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial S3-02 — Authorization Runtime default / enterprise.
 */
export class DefaultAuthorizationRuntimeAdapter implements AuthorizationRuntimePort {
  readonly providerId: Extract<AuthorizationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: AuthorizationRuntimeProviderMetadata;
  private readonly store: AuthorizationRuntimeStore;
  private readonly enterpriseDeps: AuthorizationRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultAuthorizationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Authorization Runtime ready (structural only — no real authorization).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Authorization Runtime"
          : AUTHORIZATION_RUNTIME_IDENTITY.name,
      version: DEFAULT_AUTHORIZATION_RUNTIME_VERSION,
      vendor: AUTHORIZATION_RUNTIME_IDENTITY.vendor,
      layer: AUTHORIZATION_RUNTIME_IDENTITY.layer,
      vendorAgnostic: AUTHORIZATION_RUNTIME_IDENTITY.vendorAgnostic,
      description: AUTHORIZATION_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryAuthorizationRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): AuthorizationRuntimeStore {
    return this.store;
  }

  capabilities(): AuthorizationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalAuthorization: true,
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
      engine: { ...DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalAuthorizationCapabilities(
        DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): AuthorizationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUTHORIZATION_RUNTIME",
      capabilities: { ...DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AuthorizationRuntimeHealth> {
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
          ? "Authorization Runtime pronto (estrutural S3-02 — sem identidade real)."
          : "Authorization Runtime degradado — ver store."
        : "Authorization Runtime unhealthy.",
    };
  }

  async openJob(input: OpenAuthorizationJobInput): Promise<OpenAuthorizationJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createAuthorizationJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "AUTHORIZATION_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical AuthorizationJob already open.",
          job: existing,
        };
      }
      const authorizationContext = input.authorizationContext ?? {
        kind: "canonical-authorization-context" as const,
        jobId,
      };
      const job: AuthorizationJob = {
        kind: "canonical-authorization-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-authorization-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        authorizationContext,
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
        code: "AUTHORIZATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Authorization Runtime structural openJob (S3-02 foundation — no real authorization).",
        authorizationContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "AUTHORIZATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseAuthorizationJobInput): Promise<CloseAuthorizationJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "AUTHORIZATION_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical AuthorizationJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: AuthorizationJob = {
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
        code: "AUTHORIZATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Authorization Runtime structural closeJob (S3-02 foundation — no real teardown).",
        authorizationContext: job.authorizationContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "AUTHORIZATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(
    input: SubmitAuthorizationRequestInput,
  ): Promise<SubmitAuthorizationRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createAuthorizationJobId();
        job = {
          kind: "canonical-authorization-job",
          jobId,
          status: "job-open",
          authorizationContext: input.authorizationContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createAuthorizationRequestId();
      const authorizationContext = input.authorizationContext ??
        job.authorizationContext ?? {
          kind: "canonical-authorization-context" as const,
          jobId: job.jobId,
          requestId,
          findingId: input.findingId,
        };
      const request: AuthorizationRequest = {
        kind: "canonical-authorization-request",
        requestId,
        jobId: job.jobId,
        findingId: input.findingId,
        status: "submitted",
        metadata: input.metadata,
        authorizationContext,
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
        code: "AUTHORIZATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Authorization Runtime structural submitRequest (S3-02 foundation — no authorization dispatch).",
        authorizationContext,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "AUTHORIZATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerFinding(
    input: RegisterAuthorizationFindingInput,
  ): Promise<RegisterAuthorizationFindingResult> {
    return this.runOperation("registerFinding", input, async () => {
      const stamp = nowIso(this.now);
      const findingId = input.findingId ?? createAuthorizationFindingId();
      const authorizationContext = input.authorizationContext ?? {
        kind: "canonical-authorization-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        findingId,
      };
      const finding: AuthorizationFinding = {
        kind: "canonical-authorization-finding",
        findingId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        authorizationType: input.authorizationType,
        issues: [],
        metadata: input.metadata,
        authorizationContext,
        createdAt: stamp,
        updatedAt: stamp,
        authorizationEngineImplemented: false,
        automaticAuthorizationImplemented: false,
        authorizationSuggestionsImplemented: false,
        tissAuthorizationImplemented: false,
        operatorAuthorizationImplemented: false,
      };
      this.store.setFinding(finding);
      const result = this.buildResult({
        operation: "registerFinding",
        status: "registered",
        finding,
        stamp,
        code: "AUTHORIZATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Authorization Runtime structural registerFinding (S3-02 foundation — no authorization engine).",
        authorizationContext,
      });
      return {
        ok: true,
        result,
        finding,
        code: "AUTHORIZATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetAuthorizationResultInput): Promise<GetAuthorizationResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const finding = input.findingId ? this.store.getFinding(input.findingId) : undefined;
      if (!job && !request && !finding) {
        return {
          ok: false,
          code: "AUTHORIZATION_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Authorization job/request/finding not found.",
        };
      }
      const stamp = nowIso(this.now);
      const authorizationContext =
        request?.authorizationContext ?? job?.authorizationContext ?? finding?.authorizationContext;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? finding?.status ?? "processed",
        job,
        request,
        finding,
        stamp,
        code: "AUTHORIZATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Authorization Runtime structural getResult (S3-02 foundation — no real authorization).",
        authorizationContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        finding,
        code: "AUTHORIZATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: AuthorizationStatsInput = {}): Promise<AuthorizationStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "AUTHORIZATION_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Authorization Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "AUTHORIZATION_RUNTIME_OK",
        message: `Authorization Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalFindings} findings.`,
      };
    });
  }

  private buildResult(args: {
    operation: AuthorizationResult["operation"];
    status: AuthorizationResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: AuthorizationJob;
    request?: AuthorizationRequest;
    finding?: AuthorizationFinding;
    authorizationContext?: AuthorizationResult["authorizationContext"];
  }): AuthorizationResult {
    return {
      kind: "canonical-authorization-result",
      ok: true,
      resultId: createAuthorizationResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      finding: args.finding,
      authorizationContext: args.authorizationContext,
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
    input: AuthorizationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & AuthorizationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createAuthorizationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: AuthorizationRuntimeStructuredLog[] = [];
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
            code: "AUTHORIZATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & AuthorizationRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "AUTHORIZATION_RUNTIME_RETRY",
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
              reject(new Error("Authorization Runtime operation timed out."));
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
        code: "AUTHORIZATION_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error
            ? lastError.message
            : "Authorization Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AuthorizationRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Authorization Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "AUTHORIZATION_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AuthorizationRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (S3-02). */
export const EnterpriseAuthorizationRuntimeAdapter = DefaultAuthorizationRuntimeAdapter;
