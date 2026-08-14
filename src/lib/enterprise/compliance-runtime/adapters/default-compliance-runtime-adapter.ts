/**
 * DefaultComplianceRuntimeAdapter — S3-02.
 *
 * Adapter oficial do Enterprise Compliance Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerFinding/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem identidade real. Sem criptografia. Sem assinatura digital.
 * Sem cadeia de custódia. Sem Key Vault. Sem HSM. Sem SIEM.
 * Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 */
import {
  DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalComplianceCapabilities,
} from "../ports/capabilities";
import {
  COMPLIANCE_RUNTIME_IDENTITY,
  createComplianceFindingId,
  createComplianceJobId,
  createComplianceRequestId,
  createComplianceResultId,
  createComplianceRuntimeRequestId,
} from "../ports/compliance";
import type { ComplianceRuntimePort } from "../ports/compliance-runtime-port";
import type {
  ComplianceFinding,
  ComplianceJob,
  ComplianceRequest,
  ComplianceResult,
} from "../ports/canonical";
import type {
  ComplianceRuntimeCapabilities,
  ComplianceRuntimeEnterpriseDeps,
  ComplianceRuntimeHealth,
  ComplianceRuntimeInfo,
  ComplianceRuntimeOperationalControls,
  ComplianceRuntimeOperationEnvelope,
  ComplianceRuntimeProviderId,
  ComplianceRuntimeProviderMetadata,
  ComplianceRuntimeStructuredLog,
  ComplianceStatsInput,
  ComplianceStatsResult,
  CloseComplianceJobInput,
  CloseComplianceJobResult,
  GetComplianceResultInput,
  GetComplianceResultResult,
  OpenComplianceJobInput,
  OpenComplianceJobResult,
  RegisterComplianceFindingInput,
  RegisterComplianceFindingResult,
  SubmitComplianceRequestInput,
  SubmitComplianceRequestResult,
} from "../ports/types";
import { InMemoryComplianceRuntimeStore, type ComplianceRuntimeStore } from "../store";

export const DEFAULT_COMPLIANCE_RUNTIME_ADAPTER_ID = "default-enterprise-compliance-runtime";
export const DEFAULT_COMPLIANCE_RUNTIME_VERSION = COMPLIANCE_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultComplianceRuntimeAdapterOptions = {
  provider?: Extract<ComplianceRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: ComplianceRuntimeStore;
  enterpriseDeps?: ComplianceRuntimeEnterpriseDeps;
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

function readSignal(input: ComplianceRuntimeOperationalControls): AbortSignal | undefined {
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
    complianceEngineImplemented: false,
    lgpdImplemented: false,
    privacyImplemented: false,
    dataClassificationImplemented: false,
    consentManagementImplemented: false,
    auditComplianceImplemented: false,
    retentionImplemented: false,
    chainOfCustodyImplemented: false,
    digitalSignatureImplemented: false,
    encryptionImplemented: false,
    hsmImplemented: false,
    keyVaultImplemented: false,
    siemImplemented: false,
    openTelemetryImplemented: false,
    businessRulesImplemented: false,
    tissComplianceImplemented: false,
    operatorComplianceImplemented: false,
    automaticComplianceImplemented: false,
    complianceSuggestionsImplemented: false,
    complianceJustificationImplemented: false,
    complianceScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial S3-02 — Compliance Runtime default / enterprise.
 */
export class DefaultComplianceRuntimeAdapter implements ComplianceRuntimePort {
  readonly providerId: Extract<ComplianceRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: ComplianceRuntimeProviderMetadata;
  private readonly store: ComplianceRuntimeStore;
  private readonly enterpriseDeps: ComplianceRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultComplianceRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Compliance Runtime ready (structural only — no real compliance).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Compliance Runtime"
          : COMPLIANCE_RUNTIME_IDENTITY.name,
      version: DEFAULT_COMPLIANCE_RUNTIME_VERSION,
      vendor: COMPLIANCE_RUNTIME_IDENTITY.vendor,
      layer: COMPLIANCE_RUNTIME_IDENTITY.layer,
      vendorAgnostic: COMPLIANCE_RUNTIME_IDENTITY.vendorAgnostic,
      description: COMPLIANCE_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryComplianceRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): ComplianceRuntimeStore {
    return this.store;
  }

  capabilities(): ComplianceRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_COMPLIANCE_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalCompliance: true,
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
      engine: { ...DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalComplianceCapabilities(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): ComplianceRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "COMPLIANCE_RUNTIME",
      capabilities: { ...DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ComplianceRuntimeHealth> {
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
          ? "Compliance Runtime pronto (estrutural S3-02 — sem identidade real)."
          : "Compliance Runtime degradado — ver store."
        : "Compliance Runtime unhealthy.",
    };
  }

  async openJob(input: OpenComplianceJobInput): Promise<OpenComplianceJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createComplianceJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "COMPLIANCE_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical ComplianceJob already open.",
          job: existing,
        };
      }
      const complianceContext = input.complianceContext ?? {
        kind: "canonical-compliance-context" as const,
        jobId,
      };
      const job: ComplianceJob = {
        kind: "canonical-compliance-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-compliance-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        complianceContext,
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
        code: "COMPLIANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Compliance Runtime structural openJob (S3-02 foundation — no real compliance).",
        complianceContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "COMPLIANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseComplianceJobInput): Promise<CloseComplianceJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "COMPLIANCE_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical ComplianceJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: ComplianceJob = {
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
        code: "COMPLIANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Compliance Runtime structural closeJob (S3-02 foundation — no real teardown).",
        complianceContext: job.complianceContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "COMPLIANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitComplianceRequestInput): Promise<SubmitComplianceRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createComplianceJobId();
        job = {
          kind: "canonical-compliance-job",
          jobId,
          status: "job-open",
          complianceContext: input.complianceContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createComplianceRequestId();
      const complianceContext = input.complianceContext ??
        job.complianceContext ?? {
          kind: "canonical-compliance-context" as const,
          jobId: job.jobId,
          requestId,
          findingId: input.findingId,
        };
      const request: ComplianceRequest = {
        kind: "canonical-compliance-request",
        requestId,
        jobId: job.jobId,
        findingId: input.findingId,
        status: "submitted",
        metadata: input.metadata,
        complianceContext,
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
        code: "COMPLIANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Compliance Runtime structural submitRequest (S3-02 foundation — no compliance dispatch).",
        complianceContext,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "COMPLIANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerFinding(
    input: RegisterComplianceFindingInput,
  ): Promise<RegisterComplianceFindingResult> {
    return this.runOperation("registerFinding", input, async () => {
      const stamp = nowIso(this.now);
      const findingId = input.findingId ?? createComplianceFindingId();
      const complianceContext = input.complianceContext ?? {
        kind: "canonical-compliance-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        findingId,
      };
      const finding: ComplianceFinding = {
        kind: "canonical-compliance-finding",
        findingId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        complianceType: input.complianceType,
        issues: [],
        metadata: input.metadata,
        complianceContext,
        createdAt: stamp,
        updatedAt: stamp,
        complianceEngineImplemented: false,
        lgpdImplemented: false,
        privacyImplemented: false,
        dataClassificationImplemented: false,
        consentManagementImplemented: false,
        auditComplianceImplemented: false,
        retentionImplemented: false,
        chainOfCustodyImplemented: false,
        digitalSignatureImplemented: false,
        encryptionImplemented: false,
        hsmImplemented: false,
        keyVaultImplemented: false,
        siemImplemented: false,
        openTelemetryImplemented: false,
        automaticComplianceImplemented: false,
        complianceSuggestionsImplemented: false,
        tissComplianceImplemented: false,
        operatorComplianceImplemented: false,
      };
      this.store.setFinding(finding);
      const result = this.buildResult({
        operation: "registerFinding",
        status: "registered",
        finding,
        stamp,
        code: "COMPLIANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Compliance Runtime structural registerFinding (S3-02 foundation — no compliance engine).",
        complianceContext,
      });
      return {
        ok: true,
        result,
        finding,
        code: "COMPLIANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetComplianceResultInput): Promise<GetComplianceResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const finding = input.findingId ? this.store.getFinding(input.findingId) : undefined;
      if (!job && !request && !finding) {
        return {
          ok: false,
          code: "COMPLIANCE_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Compliance job/request/finding not found.",
        };
      }
      const stamp = nowIso(this.now);
      const complianceContext =
        request?.complianceContext ?? job?.complianceContext ?? finding?.complianceContext;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? finding?.status ?? "processed",
        job,
        request,
        finding,
        stamp,
        code: "COMPLIANCE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Compliance Runtime structural getResult (S3-02 foundation — no real compliance).",
        complianceContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        finding,
        code: "COMPLIANCE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: ComplianceStatsInput = {}): Promise<ComplianceStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "COMPLIANCE_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Compliance Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "COMPLIANCE_RUNTIME_OK",
        message: `Compliance Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalFindings} findings.`,
      };
    });
  }

  private buildResult(args: {
    operation: ComplianceResult["operation"];
    status: ComplianceResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: ComplianceJob;
    request?: ComplianceRequest;
    finding?: ComplianceFinding;
    complianceContext?: ComplianceResult["complianceContext"];
  }): ComplianceResult {
    return {
      kind: "canonical-compliance-result",
      ok: true,
      resultId: createComplianceResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      finding: args.finding,
      complianceContext: args.complianceContext,
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
    input: ComplianceRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & ComplianceRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createComplianceRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: ComplianceRuntimeStructuredLog[] = [];
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
            code: "COMPLIANCE_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & ComplianceRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "COMPLIANCE_RUNTIME_RETRY",
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
              reject(new Error("Compliance Runtime operation timed out."));
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
        code: "COMPLIANCE_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Compliance Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ComplianceRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Compliance Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "COMPLIANCE_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ComplianceRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (S3-02). */
export const EnterpriseComplianceRuntimeAdapter = DefaultComplianceRuntimeAdapter;
