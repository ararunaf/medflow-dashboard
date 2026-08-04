/**
 * DefaultValidationRuntimeAdapter — F3-CAP-08.
 *
 * Adapter oficial do Enterprise Validation Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerDocument/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem validação real. Sem auditoria. Sem IA. Sem ML. Sem LLM.
 * Sem correção automática. Sem regras TISS. Sem regras de operadoras.
 * Sem aprovação/rejeição automática.
 */
import {
  DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalValidationCapabilities,
} from "../ports/capabilities";
import {
  VALIDATION_RUNTIME_IDENTITY,
  createValidationCapRequestId,
  createValidationDocumentId,
  createValidationJobId,
  createValidationResultId,
  createValidationRuntimeRequestId,
} from "../ports/identity";
import type { ValidationRuntimePort } from "../ports/validation-runtime-port";
import type {
  ValidationDocument,
  ValidationJob,
  ValidationRequest,
  ValidationResult,
} from "../ports/canonical";
import type {
  CloseValidationJobInput,
  CloseValidationJobResult,
  GetValidationResultInput,
  GetValidationResultResult,
  OpenValidationJobInput,
  OpenValidationJobResult,
  RegisterValidationDocumentInput,
  RegisterValidationDocumentResult,
  SubmitValidationRequestInput,
  SubmitValidationRequestResult,
  ValidationRuntimeCapabilities,
  ValidationRuntimeEnterpriseDeps,
  ValidationRuntimeHealth,
  ValidationRuntimeInfo,
  ValidationRuntimeOperationalControls,
  ValidationRuntimeOperationEnvelope,
  ValidationRuntimeProviderId,
  ValidationRuntimeProviderMetadata,
  ValidationRuntimeStructuredLog,
  ValidationStatsInput,
  ValidationStatsResult,
} from "../ports/types";
import { InMemoryValidationRuntimeStore, type ValidationRuntimeStore } from "../store";

export const DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID = "default-enterprise-validation-runtime";
export const DEFAULT_VALIDATION_RUNTIME_VERSION = VALIDATION_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultValidationRuntimeAdapterOptions = {
  provider?: Extract<ValidationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: ValidationRuntimeStore;
  enterpriseDeps?: ValidationRuntimeEnterpriseDeps;
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

function readSignal(input: ValidationRuntimeOperationalControls): AbortSignal | undefined {
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
    fieldValidationImplemented: false,
    documentValidationImplemented: false,
    templateValidationImplemented: false,
    operatorValidationImplemented: false,
    tissValidationImplemented: false,
    confidenceValidationImplemented: false,
    qualityValidationImplemented: false,
    mandatoryFieldValidationImplemented: false,
    crossFieldValidationImplemented: false,
    businessRuleValidationImplemented: false,
    automaticApprovalImplemented: false,
    automaticRejectionImplemented: false,
  } as const;
}

function emptyFutureRules() {
  return {
    kind: "canonical-future-validation-rule-contracts" as const,
    templateMatchesOperatorDeclared: false as const,
    tissVersionCompatibleDeclared: false as const,
    documentCompatibleWithTemplateDeclared: false as const,
    minimumQualityDeclared: false as const,
    minimumConfidenceDeclared: false as const,
    mandatoryFieldsDeclared: false as const,
    crossFieldConsistencyDeclared: false as const,
    guideOperatorCompatibilityDeclared: false as const,
    documentConsistencyDeclared: false as const,
    overallValidationScoreDeclared: false as const,
  };
}

/**
 * Adapter oficial F3-CAP-08 — Validation Runtime default / enterprise.
 */
export class DefaultValidationRuntimeAdapter implements ValidationRuntimePort {
  readonly providerId: Extract<ValidationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: ValidationRuntimeProviderMetadata;
  private readonly store: ValidationRuntimeStore;
  private readonly enterpriseDeps: ValidationRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultValidationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Validation Runtime ready (structural only — no real validation).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Validation Runtime"
          : VALIDATION_RUNTIME_IDENTITY.name,
      version: DEFAULT_VALIDATION_RUNTIME_VERSION,
      vendor: VALIDATION_RUNTIME_IDENTITY.vendor,
      layer: VALIDATION_RUNTIME_IDENTITY.layer,
      vendorAgnostic: VALIDATION_RUNTIME_IDENTITY.vendorAgnostic,
      description: VALIDATION_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryValidationRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): ValidationRuntimeStore {
    return this.store;
  }

  capabilities(): ValidationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalValidation: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      engine: { ...DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalValidationCapabilities(DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): ValidationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "VALIDATION_RUNTIME",
      capabilities: { ...DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ValidationRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // F3-CAP-08 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
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
      storedDocumentCount: this.store.documentCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Validation Runtime pronto (estrutural F3-CAP-08 — sem validação real)."
          : "Validation Runtime degradado — ver Ports Enterprise."
        : "Validation Runtime unhealthy.",
    };
  }

  async openJob(input: OpenValidationJobInput): Promise<OpenValidationJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createValidationJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "VALIDATION_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical ValidationJob already open.",
          job: existing,
        };
      }
      const validationContext = input.validationContext ?? {
        kind: "canonical-validation-context" as const,
        jobId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        futureRules: emptyFutureRules(),
      };
      const job: ValidationJob = {
        kind: "canonical-validation-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-validation-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        validationContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
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
        code: "VALIDATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Validation Runtime structural openJob (F3-CAP-08 foundation — no real validation).",
        validationContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
      });
      return {
        ok: true,
        result,
        job,
        code: "VALIDATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseValidationJobInput): Promise<CloseValidationJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "VALIDATION_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical ValidationJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: ValidationJob = {
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
        code: "VALIDATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Validation Runtime structural closeJob (F3-CAP-08 foundation — no real teardown).",
        validationContext: job.validationContext,
        classificationContext: job.classificationContext,
        extractionResult: job.extractionResult,
      });
      return {
        ok: true,
        result,
        job,
        code: "VALIDATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitValidationRequestInput): Promise<SubmitValidationRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createValidationJobId();
        job = {
          kind: "canonical-validation-job",
          jobId,
          status: "job-open",
          classificationContext: input.classificationContext,
          extractionResult: input.extractionResult,
          validationContext: input.validationContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createValidationCapRequestId();
      const validationContext = input.validationContext ??
        job.validationContext ?? {
          kind: "canonical-validation-context" as const,
          jobId: job.jobId,
          requestId,
          documentId: input.documentId,
          classificationContext: input.classificationContext ?? job.classificationContext,
          extractionResult: input.extractionResult ?? job.extractionResult,
          futureRules: emptyFutureRules(),
        };
      const request: ValidationRequest = {
        kind: "canonical-validation-request",
        requestId,
        jobId: job.jobId,
        documentId: input.documentId,
        status: "submitted",
        metadata: input.metadata,
        validationContext,
        classificationContext: input.classificationContext ?? job.classificationContext,
        extractionResult: input.extractionResult ?? job.extractionResult,
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
        code: "VALIDATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Validation Runtime structural submitRequest (F3-CAP-08 foundation — no engine dispatch).",
        validationContext,
        classificationContext: request.classificationContext,
        extractionResult: request.extractionResult,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "VALIDATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerDocument(
    input: RegisterValidationDocumentInput,
  ): Promise<RegisterValidationDocumentResult> {
    return this.runOperation("registerDocument", input, async () => {
      const stamp = nowIso(this.now);
      const documentId = input.documentId ?? createValidationDocumentId();
      const validationContext = input.validationContext ?? {
        kind: "canonical-validation-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        documentId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        futureRules: emptyFutureRules(),
      };
      const document: ValidationDocument = {
        kind: "canonical-validation-document",
        documentId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        metadata: input.metadata,
        validationContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setDocument(document);
      const result = this.buildResult({
        operation: "registerDocument",
        status: "registered",
        document,
        stamp,
        code: "VALIDATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Validation Runtime structural registerDocument (F3-CAP-08 foundation — no field validation).",
        validationContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
      });
      return {
        ok: true,
        result,
        document,
        code: "VALIDATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetValidationResultInput): Promise<GetValidationResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const document = input.documentId ? this.store.getDocument(input.documentId) : undefined;
      if (!job && !request && !document) {
        return {
          ok: false,
          code: "VALIDATION_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Validation job/request/document not found.",
        };
      }
      const stamp = nowIso(this.now);
      const validationContext =
        request?.validationContext ?? job?.validationContext ?? document?.validationContext;
      const classificationContext =
        request?.classificationContext ??
        job?.classificationContext ??
        document?.classificationContext;
      const extractionResult =
        request?.extractionResult ?? job?.extractionResult ?? document?.extractionResult;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? document?.status ?? "processed",
        job,
        request,
        document,
        stamp,
        code: "VALIDATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Validation Runtime structural getResult (F3-CAP-08 foundation — no real validation).",
        validationContext,
        classificationContext,
        extractionResult,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        document,
        code: "VALIDATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: ValidationStatsInput = {}): Promise<ValidationStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "VALIDATION_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Validation Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "VALIDATION_RUNTIME_OK",
        message: `Validation Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalDocuments} documents.`,
      };
    });
  }

  private buildResult(args: {
    operation: ValidationResult["operation"];
    status: ValidationResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: ValidationJob;
    request?: ValidationRequest;
    document?: ValidationDocument;
    validationContext?: ValidationResult["validationContext"];
    classificationContext?: ValidationResult["classificationContext"];
    extractionResult?: ValidationResult["extractionResult"];
  }): ValidationResult {
    return {
      kind: "canonical-validation-result",
      ok: true,
      resultId: createValidationResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      document: args.document,
      issues: [],
      warnings: [],
      errors: [],
      summary: {
        kind: "canonical-validation-summary",
        issueCount: 0,
        warningCount: 0,
        errorCount: 0,
        status: args.status,
        validationContext: args.validationContext,
        fieldValidationImplemented: false,
        documentValidationImplemented: false,
        templateValidationImplemented: false,
        operatorValidationImplemented: false,
        tissValidationImplemented: false,
        automaticApprovalImplemented: false,
        automaticRejectionImplemented: false,
      },
      provider: {
        kind: "canonical-validation-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_VALIDATION_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      validationContext: args.validationContext,
      classificationContext: args.classificationContext,
      extractionResult: args.extractionResult,
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
    input: ValidationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & ValidationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createValidationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: ValidationRuntimeStructuredLog[] = [];
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
            code: "VALIDATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & ValidationRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "VALIDATION_RUNTIME_RETRY",
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
              reject(new Error("Validation Runtime operation timed out."));
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
        code: "VALIDATION_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Validation Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ValidationRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Validation Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "VALIDATION_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ValidationRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (F3-CAP-08). */
export const EnterpriseValidationRuntimeAdapter = DefaultValidationRuntimeAdapter;
