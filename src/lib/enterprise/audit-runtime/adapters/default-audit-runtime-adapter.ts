/**
 * DefaultAuditRuntimeAdapter — F3-CAP-10.
 *
 * Adapter oficial do Enterprise Audit Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerFinding/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem auditoria real. Sem IA. Sem OpenAI. Sem Azure OpenAI. Sem Gemini.
 * Sem Claude. Sem ML. Sem regras TISS. Sem regras de operadoras.
 * Sem justificativas/correções/aprovação/rejeição automáticas.
 */
import {
  DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalAuditCapabilities,
} from "../ports/capabilities";
import {
  AUDIT_RUNTIME_IDENTITY,
  createAuditFindingId,
  createAuditJobId,
  createAuditRequestId,
  createAuditResultId,
  createAuditRuntimeRequestId,
} from "../ports/identity";
import type { AuditRuntimePort } from "../ports/audit-runtime-port";
import type { AuditFinding, AuditJob, AuditRequest, AuditResult } from "../ports/canonical";
import type {
  AuditRuntimeCapabilities,
  AuditRuntimeEnterpriseDeps,
  AuditRuntimeHealth,
  AuditRuntimeInfo,
  AuditRuntimeOperationalControls,
  AuditRuntimeOperationEnvelope,
  AuditRuntimeProviderId,
  AuditRuntimeProviderMetadata,
  AuditRuntimeStructuredLog,
  AuditStatsInput,
  AuditStatsResult,
  CloseAuditJobInput,
  CloseAuditJobResult,
  GetAuditResultInput,
  GetAuditResultResult,
  OpenAuditJobInput,
  OpenAuditJobResult,
  RegisterAuditFindingInput,
  RegisterAuditFindingResult,
  SubmitAuditRequestInput,
  SubmitAuditRequestResult,
} from "../ports/types";
import { InMemoryAuditRuntimeStore, type AuditRuntimeStore } from "../store";

export const DEFAULT_AUDIT_RUNTIME_ADAPTER_ID = "default-enterprise-audit-runtime";
export const DEFAULT_AUDIT_RUNTIME_VERSION = AUDIT_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultAuditRuntimeAdapterOptions = {
  provider?: Extract<AuditRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: AuditRuntimeStore;
  enterpriseDeps?: AuditRuntimeEnterpriseDeps;
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

function readSignal(input: AuditRuntimeOperationalControls): AbortSignal | undefined {
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
    auditEngineImplemented: false,
    businessRulesImplemented: false,
    tissAuditImplemented: false,
    operatorAuditImplemented: false,
    automaticAuditImplemented: false,
    auditSuggestionsImplemented: false,
    auditJustificationImplemented: false,
    auditScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial F3-CAP-10 — Audit Runtime default / enterprise.
 */
export class DefaultAuditRuntimeAdapter implements AuditRuntimePort {
  readonly providerId: Extract<AuditRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: AuditRuntimeProviderMetadata;
  private readonly store: AuditRuntimeStore;
  private readonly enterpriseDeps: AuditRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultAuditRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Audit Runtime ready (structural only — no real audit).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default Audit Runtime" : AUDIT_RUNTIME_IDENTITY.name,
      version: DEFAULT_AUDIT_RUNTIME_VERSION,
      vendor: AUDIT_RUNTIME_IDENTITY.vendor,
      layer: AUDIT_RUNTIME_IDENTITY.layer,
      vendorAgnostic: AUDIT_RUNTIME_IDENTITY.vendorAgnostic,
      description: AUDIT_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryAuditRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): AuditRuntimeStore {
    return this.store;
  }

  capabilities(): AuditRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_AUDIT_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalAudit: true,
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
      engine: { ...DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalAuditCapabilities(DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): AuditRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUDIT_RUNTIME",
      capabilities: { ...DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AuditRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // F3-CAP-10 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
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
          ? "Audit Runtime pronto (estrutural F3-CAP-10 — sem auditoria real)."
          : "Audit Runtime degradado — ver Ports Enterprise."
        : "Audit Runtime unhealthy.",
    };
  }

  async openJob(input: OpenAuditJobInput): Promise<OpenAuditJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createAuditJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "AUDIT_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical AuditJob already open.",
          job: existing,
        };
      }
      const auditContext = input.auditContext ?? {
        kind: "canonical-audit-context" as const,
        jobId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      };
      const job: AuditJob = {
        kind: "canonical-audit-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-audit-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        auditContext,
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
        code: "AUDIT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Audit Runtime structural openJob (F3-CAP-10 foundation — no real audit).",
        auditContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "AUDIT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseAuditJobInput): Promise<CloseAuditJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "AUDIT_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical AuditJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: AuditJob = {
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
        code: "AUDIT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Audit Runtime structural closeJob (F3-CAP-10 foundation — no real teardown).",
        auditContext: job.auditContext,
        classificationContext: job.classificationContext,
        extractionResult: job.extractionResult,
        validationResult: job.validationResult,
        aiOrchestrationContext: job.aiOrchestrationContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "AUDIT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitAuditRequestInput): Promise<SubmitAuditRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createAuditJobId();
        job = {
          kind: "canonical-audit-job",
          jobId,
          status: "job-open",
          classificationContext: input.classificationContext,
          extractionResult: input.extractionResult,
          validationResult: input.validationResult,
          aiOrchestrationContext: input.aiOrchestrationContext,
          auditContext: input.auditContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createAuditRequestId();
      const auditContext = input.auditContext ??
        job.auditContext ?? {
          kind: "canonical-audit-context" as const,
          jobId: job.jobId,
          requestId,
          findingId: input.findingId,
          classificationContext: input.classificationContext ?? job.classificationContext,
          extractionResult: input.extractionResult ?? job.extractionResult,
          validationResult: input.validationResult ?? job.validationResult,
          aiOrchestrationContext: input.aiOrchestrationContext ?? job.aiOrchestrationContext,
        };
      const request: AuditRequest = {
        kind: "canonical-audit-request",
        requestId,
        jobId: job.jobId,
        findingId: input.findingId,
        status: "submitted",
        metadata: input.metadata,
        auditContext,
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
        code: "AUDIT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Audit Runtime structural submitRequest (F3-CAP-10 foundation — no audit dispatch).",
        auditContext,
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
        code: "AUDIT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerFinding(input: RegisterAuditFindingInput): Promise<RegisterAuditFindingResult> {
    return this.runOperation("registerFinding", input, async () => {
      const stamp = nowIso(this.now);
      const findingId = input.findingId ?? createAuditFindingId();
      const auditContext = input.auditContext ?? {
        kind: "canonical-audit-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        findingId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      };
      const finding: AuditFinding = {
        kind: "canonical-audit-finding",
        findingId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        auditType: input.auditType,
        issues: [],
        metadata: input.metadata,
        auditContext,
        createdAt: stamp,
        updatedAt: stamp,
        auditEngineImplemented: false,
        automaticAuditImplemented: false,
        auditSuggestionsImplemented: false,
        tissAuditImplemented: false,
        operatorAuditImplemented: false,
      };
      this.store.setFinding(finding);
      const result = this.buildResult({
        operation: "registerFinding",
        status: "registered",
        finding,
        stamp,
        code: "AUDIT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Audit Runtime structural registerFinding (F3-CAP-10 foundation — no audit engine).",
        auditContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      });
      return {
        ok: true,
        result,
        finding,
        code: "AUDIT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetAuditResultInput): Promise<GetAuditResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const finding = input.findingId ? this.store.getFinding(input.findingId) : undefined;
      if (!job && !request && !finding) {
        return {
          ok: false,
          code: "AUDIT_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Audit job/request/finding not found.",
        };
      }
      const stamp = nowIso(this.now);
      const auditContext = request?.auditContext ?? job?.auditContext ?? finding?.auditContext;
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
        code: "AUDIT_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Audit Runtime structural getResult (F3-CAP-10 foundation — no real audit).",
        auditContext,
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
        code: "AUDIT_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: AuditStatsInput = {}): Promise<AuditStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "AUDIT_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Audit Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "AUDIT_RUNTIME_OK",
        message: `Audit Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalFindings} findings.`,
      };
    });
  }

  private buildResult(args: {
    operation: AuditResult["operation"];
    status: AuditResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: AuditJob;
    request?: AuditRequest;
    finding?: AuditFinding;
    auditContext?: AuditResult["auditContext"];
    classificationContext?: AuditResult["classificationContext"];
    extractionResult?: AuditResult["extractionResult"];
    validationResult?: AuditResult["validationResult"];
    aiOrchestrationContext?: AuditResult["aiOrchestrationContext"];
  }): AuditResult {
    return {
      kind: "canonical-audit-result",
      ok: true,
      resultId: createAuditResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      finding: args.finding,
      auditContext: args.auditContext,
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
    input: AuditRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & AuditRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createAuditRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: AuditRuntimeStructuredLog[] = [];
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
            code: "AUDIT_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & AuditRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "AUDIT_RUNTIME_RETRY",
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
              reject(new Error("Audit Runtime operation timed out."));
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
        code: "AUDIT_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Audit Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AuditRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Audit Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "AUDIT_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AuditRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (F3-CAP-10). */
export const EnterpriseAuditRuntimeAdapter = DefaultAuditRuntimeAdapter;
