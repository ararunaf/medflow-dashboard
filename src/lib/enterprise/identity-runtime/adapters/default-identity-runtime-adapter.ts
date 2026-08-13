/**
 * DefaultIdentityRuntimeAdapter — S2-02.
 *
 * Adapter oficial do Enterprise Identity Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerFinding/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem identidade real. Sem criptografia. Sem assinatura digital.
 * Sem cadeia de custódia. Sem Key Vault. Sem HSM. Sem SIEM.
 * Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 */
import {
  DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalIdentityCapabilities,
} from "../ports/capabilities";
import {
  IDENTITY_RUNTIME_IDENTITY,
  createIdentityFindingId,
  createIdentityJobId,
  createIdentityRequestId,
  createIdentityResultId,
  createIdentityRuntimeRequestId,
} from "../ports/identity";
import type { IdentityRuntimePort } from "../ports/identity-runtime-port";
import type {
  IdentityFinding,
  IdentityJob,
  IdentityRequest,
  IdentityResult,
} from "../ports/canonical";
import type {
  IdentityRuntimeCapabilities,
  IdentityRuntimeEnterpriseDeps,
  IdentityRuntimeHealth,
  IdentityRuntimeInfo,
  IdentityRuntimeOperationalControls,
  IdentityRuntimeOperationEnvelope,
  IdentityRuntimeProviderId,
  IdentityRuntimeProviderMetadata,
  IdentityRuntimeStructuredLog,
  IdentityStatsInput,
  IdentityStatsResult,
  CloseIdentityJobInput,
  CloseIdentityJobResult,
  GetIdentityResultInput,
  GetIdentityResultResult,
  OpenIdentityJobInput,
  OpenIdentityJobResult,
  RegisterIdentityFindingInput,
  RegisterIdentityFindingResult,
  SubmitIdentityRequestInput,
  SubmitIdentityRequestResult,
} from "../ports/types";
import { InMemoryIdentityRuntimeStore, type IdentityRuntimeStore } from "../store";

export const DEFAULT_IDENTITY_RUNTIME_ADAPTER_ID = "default-enterprise-identity-runtime";
export const DEFAULT_IDENTITY_RUNTIME_VERSION = IDENTITY_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultIdentityRuntimeAdapterOptions = {
  provider?: Extract<IdentityRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: IdentityRuntimeStore;
  enterpriseDeps?: IdentityRuntimeEnterpriseDeps;
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

function readSignal(input: IdentityRuntimeOperationalControls): AbortSignal | undefined {
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
    identityEngineImplemented: false,
    businessRulesImplemented: false,
    tissIdentityImplemented: false,
    operatorIdentityImplemented: false,
    automaticIdentityImplemented: false,
    identitySuggestionsImplemented: false,
    identityJustificationImplemented: false,
    identityScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial S2-02 — Identity Runtime default / enterprise.
 */
export class DefaultIdentityRuntimeAdapter implements IdentityRuntimePort {
  readonly providerId: Extract<IdentityRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: IdentityRuntimeProviderMetadata;
  private readonly store: IdentityRuntimeStore;
  private readonly enterpriseDeps: IdentityRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultIdentityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Identity Runtime ready (structural only — no real identity).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default Identity Runtime" : IDENTITY_RUNTIME_IDENTITY.name,
      version: DEFAULT_IDENTITY_RUNTIME_VERSION,
      vendor: IDENTITY_RUNTIME_IDENTITY.vendor,
      layer: IDENTITY_RUNTIME_IDENTITY.layer,
      vendorAgnostic: IDENTITY_RUNTIME_IDENTITY.vendorAgnostic,
      description: IDENTITY_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryIdentityRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): IdentityRuntimeStore {
    return this.store;
  }

  capabilities(): IdentityRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_IDENTITY_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalIdentity: true,
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
      engine: { ...DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalIdentityCapabilities(DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): IdentityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "IDENTITY_RUNTIME",
      capabilities: { ...DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<IdentityRuntimeHealth> {
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
          ? "Identity Runtime pronto (estrutural S2-02 — sem identidade real)."
          : "Identity Runtime degradado — ver store."
        : "Identity Runtime unhealthy.",
    };
  }

  async openJob(input: OpenIdentityJobInput): Promise<OpenIdentityJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createIdentityJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "IDENTITY_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical IdentityJob already open.",
          job: existing,
        };
      }
      const identityContext = input.identityContext ?? {
        kind: "canonical-identity-context" as const,
        jobId,
      };
      const job: IdentityJob = {
        kind: "canonical-identity-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-identity-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        identityContext,
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
        code: "IDENTITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Identity Runtime structural openJob (S2-02 foundation — no real identity).",
        identityContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "IDENTITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseIdentityJobInput): Promise<CloseIdentityJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "IDENTITY_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical IdentityJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: IdentityJob = {
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
        code: "IDENTITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Identity Runtime structural closeJob (S2-02 foundation — no real teardown).",
        identityContext: job.identityContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "IDENTITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitIdentityRequestInput): Promise<SubmitIdentityRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createIdentityJobId();
        job = {
          kind: "canonical-identity-job",
          jobId,
          status: "job-open",
          identityContext: input.identityContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createIdentityRequestId();
      const identityContext = input.identityContext ??
        job.identityContext ?? {
          kind: "canonical-identity-context" as const,
          jobId: job.jobId,
          requestId,
          findingId: input.findingId,
        };
      const request: IdentityRequest = {
        kind: "canonical-identity-request",
        requestId,
        jobId: job.jobId,
        findingId: input.findingId,
        status: "submitted",
        metadata: input.metadata,
        identityContext,
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
        code: "IDENTITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Identity Runtime structural submitRequest (S2-02 foundation — no identity dispatch).",
        identityContext,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "IDENTITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerFinding(
    input: RegisterIdentityFindingInput,
  ): Promise<RegisterIdentityFindingResult> {
    return this.runOperation("registerFinding", input, async () => {
      const stamp = nowIso(this.now);
      const findingId = input.findingId ?? createIdentityFindingId();
      const identityContext = input.identityContext ?? {
        kind: "canonical-identity-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        findingId,
      };
      const finding: IdentityFinding = {
        kind: "canonical-identity-finding",
        findingId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        identityType: input.identityType,
        issues: [],
        metadata: input.metadata,
        identityContext,
        createdAt: stamp,
        updatedAt: stamp,
        identityEngineImplemented: false,
        automaticIdentityImplemented: false,
        identitySuggestionsImplemented: false,
        tissIdentityImplemented: false,
        operatorIdentityImplemented: false,
      };
      this.store.setFinding(finding);
      const result = this.buildResult({
        operation: "registerFinding",
        status: "registered",
        finding,
        stamp,
        code: "IDENTITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Identity Runtime structural registerFinding (S2-02 foundation — no identity engine).",
        identityContext,
      });
      return {
        ok: true,
        result,
        finding,
        code: "IDENTITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetIdentityResultInput): Promise<GetIdentityResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const finding = input.findingId ? this.store.getFinding(input.findingId) : undefined;
      if (!job && !request && !finding) {
        return {
          ok: false,
          code: "IDENTITY_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Identity job/request/finding not found.",
        };
      }
      const stamp = nowIso(this.now);
      const identityContext =
        request?.identityContext ?? job?.identityContext ?? finding?.identityContext;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? finding?.status ?? "processed",
        job,
        request,
        finding,
        stamp,
        code: "IDENTITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Identity Runtime structural getResult (S2-02 foundation — no real identity).",
        identityContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        finding,
        code: "IDENTITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: IdentityStatsInput = {}): Promise<IdentityStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "IDENTITY_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Identity Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "IDENTITY_RUNTIME_OK",
        message: `Identity Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalFindings} findings.`,
      };
    });
  }

  private buildResult(args: {
    operation: IdentityResult["operation"];
    status: IdentityResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: IdentityJob;
    request?: IdentityRequest;
    finding?: IdentityFinding;
    identityContext?: IdentityResult["identityContext"];
  }): IdentityResult {
    return {
      kind: "canonical-identity-result",
      ok: true,
      resultId: createIdentityResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      finding: args.finding,
      identityContext: args.identityContext,
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
    input: IdentityRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & IdentityRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createIdentityRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: IdentityRuntimeStructuredLog[] = [];
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
            code: "IDENTITY_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & IdentityRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "IDENTITY_RUNTIME_RETRY",
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
              reject(new Error("Identity Runtime operation timed out."));
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
        code: "IDENTITY_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Identity Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & IdentityRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Identity Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "IDENTITY_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & IdentityRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (S2-02). */
export const EnterpriseIdentityRuntimeAdapter = DefaultIdentityRuntimeAdapter;
