/**
 * DefaultGovernanceRuntimeAdapter — S6-02.
 *
 * Adapter oficial do Enterprise Governance Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerFinding/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem identidade real. Sem criptografia. Sem assinatura digital.
 * Sem cadeia de custódia. Sem Key Vault. Sem HSM. Sem SIEM.
 * Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 */
import {
  DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalGovernanceCapabilities,
} from "../ports/capabilities";
import {
  GOVERNANCE_RUNTIME_IDENTITY,
  createGovernanceFindingId,
  createGovernanceJobId,
  createGovernanceRequestId,
  createGovernanceResultId,
  createGovernanceRuntimeRequestId,
} from "../ports/governance";
import type { GovernanceRuntimePort } from "../ports/governance-runtime-port";
import type {
  GovernanceFinding,
  GovernanceJob,
  GovernanceRequest,
  GovernanceResult,
} from "../ports/canonical";
import type {
  GovernanceRuntimeCapabilities,
  GovernanceRuntimeEnterpriseDeps,
  GovernanceRuntimeHealth,
  GovernanceRuntimeInfo,
  GovernanceRuntimeOperationalControls,
  GovernanceRuntimeOperationEnvelope,
  GovernanceRuntimeProviderId,
  GovernanceRuntimeProviderMetadata,
  GovernanceRuntimeStructuredLog,
  GovernanceStatsInput,
  GovernanceStatsResult,
  CloseGovernanceJobInput,
  CloseGovernanceJobResult,
  GetGovernanceResultInput,
  GetGovernanceResultResult,
  OpenGovernanceJobInput,
  OpenGovernanceJobResult,
  RegisterGovernanceFindingInput,
  RegisterGovernanceFindingResult,
  SubmitGovernanceRequestInput,
  SubmitGovernanceRequestResult,
} from "../ports/types";
import { InMemoryGovernanceRuntimeStore, type GovernanceRuntimeStore } from "../store";

export const DEFAULT_GOVERNANCE_RUNTIME_ADAPTER_ID = "default-enterprise-governance-runtime";
export const DEFAULT_GOVERNANCE_RUNTIME_VERSION = GOVERNANCE_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultGovernanceRuntimeAdapterOptions = {
  provider?: Extract<GovernanceRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: GovernanceRuntimeStore;
  enterpriseDeps?: GovernanceRuntimeEnterpriseDeps;
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

function readSignal(input: GovernanceRuntimeOperationalControls): AbortSignal | undefined {
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
    governanceEngineImplemented: false,
    lgpdImplemented: false,
    privacyImplemented: false,
    dataClassificationImplemented: false,
    consentManagementImplemented: false,
    auditGovernanceImplemented: false,
    retentionImplemented: false,
    chainOfCustodyImplemented: false,
    digitalSignatureImplemented: false,
    encryptionImplemented: false,
    hsmImplemented: false,
    keyVaultImplemented: false,
    siemImplemented: false,
    openTelemetryImplemented: false,
    businessRulesImplemented: false,
    tissGovernanceImplemented: false,
    operatorGovernanceImplemented: false,
    automaticGovernanceImplemented: false,
    governanceSuggestionsImplemented: false,
    governanceJustificationImplemented: false,
    governanceScoreImplemented: false,
    governanceImplemented: false,
    automaticCorrectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial S6-02 — Governance Runtime default / enterprise.
 */
export class DefaultGovernanceRuntimeAdapter implements GovernanceRuntimePort {
  readonly providerId: Extract<GovernanceRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: GovernanceRuntimeProviderMetadata;
  private readonly store: GovernanceRuntimeStore;
  private readonly enterpriseDeps: GovernanceRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultGovernanceRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Governance Runtime ready (structural only — no real governance).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Governance Runtime"
          : GOVERNANCE_RUNTIME_IDENTITY.name,
      version: DEFAULT_GOVERNANCE_RUNTIME_VERSION,
      vendor: GOVERNANCE_RUNTIME_IDENTITY.vendor,
      layer: GOVERNANCE_RUNTIME_IDENTITY.layer,
      vendorAgnostic: GOVERNANCE_RUNTIME_IDENTITY.vendorAgnostic,
      description: GOVERNANCE_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryGovernanceRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): GovernanceRuntimeStore {
    return this.store;
  }

  capabilities(): GovernanceRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_GOVERNANCE_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalGovernance: true,
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
      engine: { ...DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalGovernanceCapabilities(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): GovernanceRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "GOVERNANCE_RUNTIME",
      capabilities: { ...DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<GovernanceRuntimeHealth> {
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
          ? "Governance Runtime pronto (estrutural S6-02 — sem identidade real)."
          : "Governance Runtime degradado — ver store."
        : "Governance Runtime unhealthy.",
    };
  }

  async openJob(input: OpenGovernanceJobInput): Promise<OpenGovernanceJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createGovernanceJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "GOVERNANCE_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical GovernanceJob already open.",
          job: existing,
        };
      }
      const governanceContext = input.governanceContext ?? {
        kind: "canonical-governance-context" as const,
        jobId,
      };
      const job: GovernanceJob = {
        kind: "canonical-governance-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-governance-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        governanceContext,
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
        code: "GOVERNANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Governance Runtime structural openJob (S6-02 foundation — no real governance).",
        governanceContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "GOVERNANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseGovernanceJobInput): Promise<CloseGovernanceJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "GOVERNANCE_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical GovernanceJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: GovernanceJob = {
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
        code: "GOVERNANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Governance Runtime structural closeJob (S6-02 foundation — no real teardown).",
        governanceContext: job.governanceContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "GOVERNANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitGovernanceRequestInput): Promise<SubmitGovernanceRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createGovernanceJobId();
        job = {
          kind: "canonical-governance-job",
          jobId,
          status: "job-open",
          governanceContext: input.governanceContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createGovernanceRequestId();
      const governanceContext = input.governanceContext ??
        job.governanceContext ?? {
          kind: "canonical-governance-context" as const,
          jobId: job.jobId,
          requestId,
          findingId: input.findingId,
        };
      const request: GovernanceRequest = {
        kind: "canonical-governance-request",
        requestId,
        jobId: job.jobId,
        findingId: input.findingId,
        status: "submitted",
        metadata: input.metadata,
        governanceContext,
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
        code: "GOVERNANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Governance Runtime structural submitRequest (S6-02 foundation — no governance dispatch).",
        governanceContext,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "GOVERNANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerFinding(
    input: RegisterGovernanceFindingInput,
  ): Promise<RegisterGovernanceFindingResult> {
    return this.runOperation("registerFinding", input, async () => {
      const stamp = nowIso(this.now);
      const findingId = input.findingId ?? createGovernanceFindingId();
      const governanceContext = input.governanceContext ?? {
        kind: "canonical-governance-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        findingId,
      };
      const finding: GovernanceFinding = {
        kind: "canonical-governance-finding",
        findingId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        governanceType: input.governanceType,
        issues: [],
        metadata: input.metadata,
        governanceContext,
        createdAt: stamp,
        updatedAt: stamp,
        governanceEngineImplemented: false,
        lgpdImplemented: false,
        privacyImplemented: false,
        dataClassificationImplemented: false,
        consentManagementImplemented: false,
        auditGovernanceImplemented: false,
        retentionImplemented: false,
        chainOfCustodyImplemented: false,
        digitalSignatureImplemented: false,
        encryptionImplemented: false,
        hsmImplemented: false,
        keyVaultImplemented: false,
        siemImplemented: false,
        openTelemetryImplemented: false,
        automaticGovernanceImplemented: false,
        governanceSuggestionsImplemented: false,
        tissGovernanceImplemented: false,
        operatorGovernanceImplemented: false,
      };
      this.store.setFinding(finding);
      const result = this.buildResult({
        operation: "registerFinding",
        status: "registered",
        finding,
        stamp,
        code: "GOVERNANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Governance Runtime structural registerFinding (S6-02 foundation — no governance engine).",
        governanceContext,
      });
      return {
        ok: true,
        result,
        finding,
        code: "GOVERNANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetGovernanceResultInput): Promise<GetGovernanceResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const finding = input.findingId ? this.store.getFinding(input.findingId) : undefined;
      if (!job && !request && !finding) {
        return {
          ok: false,
          code: "GOVERNANCE_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Governance job/request/finding not found.",
        };
      }
      const stamp = nowIso(this.now);
      const governanceContext =
        request?.governanceContext ?? job?.governanceContext ?? finding?.governanceContext;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? finding?.status ?? "processed",
        job,
        request,
        finding,
        stamp,
        code: "GOVERNANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Governance Runtime structural getResult (S6-02 foundation — no real governance).",
        governanceContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        finding,
        code: "GOVERNANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: GovernanceStatsInput = {}): Promise<GovernanceStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "GOVERNANCE_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Governance Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "GOVERNANCE_RUNTIME_OK",
        message: `Governance Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalFindings} findings.`,
      };
    });
  }

  private buildResult(args: {
    operation: GovernanceResult["operation"];
    status: GovernanceResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: GovernanceJob;
    request?: GovernanceRequest;
    finding?: GovernanceFinding;
    governanceContext?: GovernanceResult["governanceContext"];
  }): GovernanceResult {
    return {
      kind: "canonical-governance-result",
      ok: true,
      resultId: createGovernanceResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      finding: args.finding,
      governanceContext: args.governanceContext,
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
    input: GovernanceRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & GovernanceRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createGovernanceRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: GovernanceRuntimeStructuredLog[] = [];
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
            code: "GOVERNANCE_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & GovernanceRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "GOVERNANCE_RUNTIME_RETRY",
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
              reject(new Error("Governance Runtime operation timed out."));
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
        code: "GOVERNANCE_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Governance Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & GovernanceRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Governance Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "GOVERNANCE_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & GovernanceRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (S6-02). */
export const EnterpriseGovernanceRuntimeAdapter = DefaultGovernanceRuntimeAdapter;
