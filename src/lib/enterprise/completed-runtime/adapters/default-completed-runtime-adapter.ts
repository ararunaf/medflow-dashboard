/**
 * DefaultCompletedRuntimeAdapter — A10-02.
 *
 * Adapter oficial do Enterprise Completed Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerFinding/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem completedoria real. Sem IA. Sem OpenAI. Sem Azure OpenAI. Sem Gemini.
 * Sem Claude. Sem ML. Sem regras TISS. Sem regras de operadoras.
 * Sem justificativas/correções/aprovação/rejeição automáticas.
 */
import {
  DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalCompletedCapabilities,
} from "../ports/capabilities";
import {
  COMPLETED_RUNTIME_IDENTITY,
  createCompletedFindingId,
  createCompletedJobId,
  createCompletedRequestId,
  createCompletedResultId,
  createCompletedRuntimeRequestId,
} from "../ports/identity";
import type { CompletedRuntimePort } from "../ports/completed-runtime-port";
import type {
  CompletedFinding,
  CompletedJob,
  CompletedRequest,
  CompletedResult,
} from "../ports/canonical";
import type {
  CompletedRuntimeCapabilities,
  CompletedRuntimeEnterpriseDeps,
  CompletedRuntimeHealth,
  CompletedRuntimeInfo,
  CompletedRuntimeOperationalControls,
  CompletedRuntimeOperationEnvelope,
  CompletedRuntimeProviderId,
  CompletedRuntimeProviderMetadata,
  CompletedRuntimeStructuredLog,
  CompletedStatsInput,
  CompletedStatsResult,
  CloseCompletedJobInput,
  CloseCompletedJobResult,
  GetCompletedResultInput,
  GetCompletedResultResult,
  OpenCompletedJobInput,
  OpenCompletedJobResult,
  RegisterCompletedFindingInput,
  RegisterCompletedFindingResult,
  SubmitCompletedRequestInput,
  SubmitCompletedRequestResult,
} from "../ports/types";
import { InMemoryCompletedRuntimeStore, type CompletedRuntimeStore } from "../store";

export const DEFAULT_COMPLETED_RUNTIME_ADAPTER_ID = "default-enterprise-completed-runtime";
export const DEFAULT_COMPLETED_RUNTIME_VERSION = COMPLETED_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultCompletedRuntimeAdapterOptions = {
  provider?: Extract<CompletedRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: CompletedRuntimeStore;
  enterpriseDeps?: CompletedRuntimeEnterpriseDeps;
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

function readSignal(input: CompletedRuntimeOperationalControls): AbortSignal | undefined {
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

function structuralFlags() {
  return {
    completedEngineImplemented: false,
    businessRulesImplemented: false,
    tissCompletedImplemented: false,
    operatorCompletedImplemented: false,
    automaticCompletedImplemented: false,
    completedSuggestionsImplemented: false,
    completedJustificationImplemented: false,
    completedScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial A10-02 — Completed Runtime default / enterprise.
 */
export class DefaultCompletedRuntimeAdapter implements CompletedRuntimePort {
  readonly providerId: Extract<CompletedRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: CompletedRuntimeProviderMetadata;
  private readonly store: CompletedRuntimeStore;
  private readonly enterpriseDeps: CompletedRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultCompletedRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Completed Runtime ready (structural only — no real completed).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Completed Runtime"
          : COMPLETED_RUNTIME_IDENTITY.name,
      version: DEFAULT_COMPLETED_RUNTIME_VERSION,
      vendor: COMPLETED_RUNTIME_IDENTITY.vendor,
      layer: COMPLETED_RUNTIME_IDENTITY.layer,
      vendorAgnostic: COMPLETED_RUNTIME_IDENTITY.vendorAgnostic,
      description: COMPLETED_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryCompletedRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): CompletedRuntimeStore {
    return this.store;
  }

  capabilities(): CompletedRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_COMPLETED_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalCompleted: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAIOrchestrationRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      engine: { ...DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalCompletedCapabilities(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): CompletedRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "COMPLETED_RUNTIME",
      capabilities: { ...DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<CompletedRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // A10-02 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
    let aiOrchestrationRuntimeOk = true;
    let validationRuntimeOk = true;
    let documentExtractionRuntimeOk = true;
    let documentClassificationRuntimeOk = true;
    let ocrRuntimeOk = true;
    let intelligentCaptureRuntimeOk = true;
    let scannerRuntimeOk = true;
    let watchFolderRuntimeOk = true;
    let uploadRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let workerRuntimeOk = true;
    let observabilityRuntimeOk = true;
    let scalabilityRuntimeOk = true;

    if (typeof this.enterpriseDeps.getAIOrchestrationRuntimePort === "function") {
      aiOrchestrationRuntimeOk = portShapeOk(this.enterpriseDeps.getAIOrchestrationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getValidationRuntimePort === "function") {
      validationRuntimeOk = portShapeOk(this.enterpriseDeps.getValidationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getDocumentExtractionRuntimePort === "function") {
      documentExtractionRuntimeOk = portShapeOk(
        this.enterpriseDeps.getDocumentExtractionRuntimePort(),
      );
    }
    if (typeof this.enterpriseDeps.getDocumentClassificationRuntimePort === "function") {
      documentClassificationRuntimeOk = portShapeOk(
        this.enterpriseDeps.getDocumentClassificationRuntimePort(),
      );
    }
    if (typeof this.enterpriseDeps.getOCRRuntimePort === "function") {
      ocrRuntimeOk = portShapeOk(this.enterpriseDeps.getOCRRuntimePort());
    }
    if (typeof this.enterpriseDeps.getIntelligentCaptureRuntimePort === "function") {
      intelligentCaptureRuntimeOk = portShapeOk(
        this.enterpriseDeps.getIntelligentCaptureRuntimePort(),
      );
    }
    if (typeof this.enterpriseDeps.getScannerRuntimePort === "function") {
      scannerRuntimeOk = portShapeOk(this.enterpriseDeps.getScannerRuntimePort());
    }
    if (typeof this.enterpriseDeps.getWatchFolderRuntimePort === "function") {
      watchFolderRuntimeOk = portShapeOk(this.enterpriseDeps.getWatchFolderRuntimePort());
    }
    if (typeof this.enterpriseDeps.getUploadRuntimePort === "function") {
      uploadRuntimeOk = portShapeOk(this.enterpriseDeps.getUploadRuntimePort());
    }
    if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort === "function") {
      persistentQueueRuntimeOk = portShapeOk(this.enterpriseDeps.getPersistentQueueRuntimePort());
    }
    if (typeof this.enterpriseDeps.getSchedulerRuntimePort === "function") {
      schedulerRuntimeOk = portShapeOk(this.enterpriseDeps.getSchedulerRuntimePort());
    }
    if (typeof this.enterpriseDeps.getWorkerRuntimePort === "function") {
      workerRuntimeOk = portShapeOk(this.enterpriseDeps.getWorkerRuntimePort());
    }
    if (typeof this.enterpriseDeps.getObservabilityRuntimePort === "function") {
      observabilityRuntimeOk = portShapeOk(this.enterpriseDeps.getObservabilityRuntimePort());
    }
    if (typeof this.enterpriseDeps.getScalabilityRuntimePort === "function") {
      scalabilityRuntimeOk = portShapeOk(this.enterpriseDeps.getScalabilityRuntimePort());
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      aiOrchestrationRuntimeOk &&
      validationRuntimeOk &&
      documentExtractionRuntimeOk &&
      documentClassificationRuntimeOk &&
      ocrRuntimeOk &&
      intelligentCaptureRuntimeOk &&
      scannerRuntimeOk &&
      watchFolderRuntimeOk &&
      uploadRuntimeOk &&
      persistentQueueRuntimeOk &&
      schedulerRuntimeOk &&
      workerRuntimeOk &&
      observabilityRuntimeOk &&
      scalabilityRuntimeOk;

    return {
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      aiOrchestrationRuntimeOk,
      validationRuntimeOk,
      documentExtractionRuntimeOk,
      documentClassificationRuntimeOk,
      ocrRuntimeOk,
      intelligentCaptureRuntimeOk,
      scannerRuntimeOk,
      watchFolderRuntimeOk,
      uploadRuntimeOk,
      persistentQueueRuntimeOk,
      schedulerRuntimeOk,
      workerRuntimeOk,
      observabilityRuntimeOk,
      scalabilityRuntimeOk,
      storedJobCount: this.store.jobCount(),
      storedRequestCount: this.store.requestCount(),
      storedFindingCount: this.store.findingCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Completed Runtime pronto (estrutural A10-02 — sem completedoria real)."
          : "Completed Runtime degradado — ver Ports Enterprise."
        : "Completed Runtime unhealthy.",
    };
  }

  async openJob(input: OpenCompletedJobInput): Promise<OpenCompletedJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createCompletedJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "COMPLETED_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical CompletedJob already open.",
          job: existing,
        };
      }
      const completedContext = input.completedContext ?? {
        kind: "canonical-completed-context" as const,
        jobId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      };
      const job: CompletedJob = {
        kind: "canonical-completed-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-completed-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        completedContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
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
        code: "COMPLETED_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Completed Runtime structural openJob (A10-02 foundation — no real completed).",
        completedContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "COMPLETED_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseCompletedJobInput): Promise<CloseCompletedJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "COMPLETED_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical CompletedJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: CompletedJob = {
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
        code: "COMPLETED_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Completed Runtime structural closeJob (A10-02 foundation — no real teardown).",
        completedContext: job.completedContext,
        classificationContext: job.classificationContext,
        extractionResult: job.extractionResult,
        validationResult: job.validationResult,
        aiOrchestrationContext: job.aiOrchestrationContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "COMPLETED_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitCompletedRequestInput): Promise<SubmitCompletedRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createCompletedJobId();
        job = {
          kind: "canonical-completed-job",
          jobId,
          status: "job-open",
          classificationContext: input.classificationContext,
          extractionResult: input.extractionResult,
          validationResult: input.validationResult,
          aiOrchestrationContext: input.aiOrchestrationContext,
          completedContext: input.completedContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createCompletedRequestId();
      const completedContext = input.completedContext ??
        job.completedContext ?? {
          kind: "canonical-completed-context" as const,
          jobId: job.jobId,
          requestId,
          findingId: input.findingId,
          classificationContext: input.classificationContext ?? job.classificationContext,
          extractionResult: input.extractionResult ?? job.extractionResult,
          validationResult: input.validationResult ?? job.validationResult,
          aiOrchestrationContext: input.aiOrchestrationContext ?? job.aiOrchestrationContext,
        };
      const request: CompletedRequest = {
        kind: "canonical-completed-request",
        requestId,
        jobId: job.jobId,
        findingId: input.findingId,
        status: "submitted",
        metadata: input.metadata,
        completedContext,
        classificationContext: input.classificationContext ?? job.classificationContext,
        extractionResult: input.extractionResult ?? job.extractionResult,
        validationResult: input.validationResult ?? job.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext ?? job.aiOrchestrationContext,
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
        code: "COMPLETED_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Completed Runtime structural submitRequest (A10-02 foundation — no completed dispatch).",
        completedContext,
        classificationContext: request.classificationContext,
        extractionResult: request.extractionResult,
        validationResult: request.validationResult,
        aiOrchestrationContext: request.aiOrchestrationContext,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "COMPLETED_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerFinding(
    input: RegisterCompletedFindingInput,
  ): Promise<RegisterCompletedFindingResult> {
    return this.runOperation("registerFinding", input, async () => {
      const stamp = nowIso(this.now);
      const findingId = input.findingId ?? createCompletedFindingId();
      const completedContext = input.completedContext ?? {
        kind: "canonical-completed-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        findingId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      };
      const finding: CompletedFinding = {
        kind: "canonical-completed-finding",
        findingId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        completedType: input.completedType,
        issues: [],
        metadata: input.metadata,
        completedContext,
        createdAt: stamp,
        updatedAt: stamp,
        completedEngineImplemented: false,
        automaticCompletedImplemented: false,
        completedSuggestionsImplemented: false,
        tissCompletedImplemented: false,
        operatorCompletedImplemented: false,
      };
      this.store.setFinding(finding);
      const result = this.buildResult({
        operation: "registerFinding",
        status: "registered",
        finding,
        stamp,
        code: "COMPLETED_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Completed Runtime structural registerFinding (A10-02 foundation — no completed engine).",
        completedContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      });
      return {
        ok: true,
        result,
        finding,
        code: "COMPLETED_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetCompletedResultInput): Promise<GetCompletedResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const finding = input.findingId ? this.store.getFinding(input.findingId) : undefined;
      if (!job && !request && !finding) {
        return {
          ok: false,
          code: "COMPLETED_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Completed job/request/finding not found.",
        };
      }
      const stamp = nowIso(this.now);
      const completedContext =
        request?.completedContext ?? job?.completedContext ?? finding?.completedContext;
      const classificationContext = request?.classificationContext ?? job?.classificationContext;
      const extractionResult = request?.extractionResult ?? job?.extractionResult;
      const validationResult = request?.validationResult ?? job?.validationResult;
      const aiOrchestrationContext = request?.aiOrchestrationContext ?? job?.aiOrchestrationContext;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? finding?.status ?? "processed",
        job,
        request,
        finding,
        stamp,
        code: "COMPLETED_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Completed Runtime structural getResult (A10-02 foundation — no real completed).",
        completedContext,
        classificationContext,
        extractionResult,
        validationResult,
        aiOrchestrationContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        finding,
        code: "COMPLETED_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: CompletedStatsInput = {}): Promise<CompletedStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "COMPLETED_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Completed Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "COMPLETED_RUNTIME_OK",
        message: `Completed Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalFindings} findings.`,
      };
    });
  }

  private buildResult(args: {
    operation: CompletedResult["operation"];
    status: CompletedResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: CompletedJob;
    request?: CompletedRequest;
    finding?: CompletedFinding;
    completedContext?: CompletedResult["completedContext"];
    classificationContext?: CompletedResult["classificationContext"];
    extractionResult?: CompletedResult["extractionResult"];
    validationResult?: CompletedResult["validationResult"];
    aiOrchestrationContext?: CompletedResult["aiOrchestrationContext"];
  }): CompletedResult {
    return {
      kind: "canonical-completed-result",
      ok: true,
      resultId: createCompletedResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      finding: args.finding,
      completedContext: args.completedContext,
      classificationContext: args.classificationContext,
      extractionResult: args.extractionResult,
      validationResult: args.validationResult,
      aiOrchestrationContext: args.aiOrchestrationContext,
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
    input: CompletedRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & CompletedRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createCompletedRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: CompletedRuntimeStructuredLog[] = [];
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
            code: "COMPLETED_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & CompletedRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "COMPLETED_RUNTIME_RETRY",
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
              reject(new Error("Completed Runtime operation timed out."));
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
        code: "COMPLETED_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Completed Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & CompletedRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Completed Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "COMPLETED_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & CompletedRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (A10-02). */
export const EnterpriseCompletedRuntimeAdapter = DefaultCompletedRuntimeAdapter;
