/**
 * DefaultDocumentExtractionRuntimeAdapter — F3-CAP-07.
 *
 * Adapter oficial do Enterprise Document Extraction Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerDocument/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem extração real. Sem OCR. Sem IA. Sem ML. Sem LLM. Sem Regex.
 * Sem Template Matching. Sem leitura de campos. Sem preenchimento de guias.
 */
import {
  DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalExtractionCapabilities,
} from "../ports/capabilities";
import {
  DOCUMENT_EXTRACTION_RUNTIME_IDENTITY,
  createDocumentExtractionCapRequestId,
  createDocumentExtractionDocumentId,
  createDocumentExtractionResultId,
  createDocumentExtractionRuntimeRequestId,
  createExtractionJobId,
} from "../ports/identity";
import type { DocumentExtractionRuntimePort } from "../ports/document-extraction-runtime-port";
import type {
  DocumentExtractionDocument,
  DocumentExtractionRequest,
  DocumentExtractionResult,
  ExtractionJob,
} from "../ports/canonical";
import type {
  CloseExtractionJobInput,
  CloseExtractionJobResult,
  DocumentExtractionRuntimeCapabilities,
  DocumentExtractionRuntimeEnterpriseDeps,
  DocumentExtractionRuntimeHealth,
  DocumentExtractionRuntimeInfo,
  DocumentExtractionRuntimeOperationalControls,
  DocumentExtractionRuntimeOperationEnvelope,
  DocumentExtractionRuntimeProviderId,
  DocumentExtractionRuntimeProviderMetadata,
  DocumentExtractionRuntimeStructuredLog,
  ExtractionStatsInput,
  ExtractionStatsResult,
  GetExtractionResultInput,
  GetExtractionResultResult,
  OpenExtractionJobInput,
  OpenExtractionJobResult,
  RegisterExtractionDocumentInput,
  RegisterExtractionDocumentResult,
  SubmitExtractionRequestInput,
  SubmitExtractionRequestResult,
} from "../ports/types";
import {
  InMemoryDocumentExtractionRuntimeStore,
  type DocumentExtractionRuntimeStore,
} from "../store";

export const DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID =
  "default-enterprise-document-extraction-runtime";
export const DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_VERSION =
  DOCUMENT_EXTRACTION_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultDocumentExtractionRuntimeAdapterOptions = {
  provider?: Extract<DocumentExtractionRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: DocumentExtractionRuntimeStore;
  enterpriseDeps?: DocumentExtractionRuntimeEnterpriseDeps;
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

function readSignal(input: DocumentExtractionRuntimeOperationalControls): AbortSignal | undefined {
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
    fieldExtractionImplemented: false,
    structuredExtractionImplemented: false,
    medicalGuideExtractionImplemented: false,
    tableExtractionImplemented: false,
    templateExtractionImplemented: false,
    automaticMappingImplemented: false,
    confidenceScoreImplemented: false,
    barcodeExtractionImplemented: false,
    qrExtractionImplemented: false,
    pipelineSelectionImplemented: false,
  } as const;
}

/**
 * Adapter oficial F3-CAP-07 — Document Extraction Runtime default / enterprise.
 */
export class DefaultDocumentExtractionRuntimeAdapter implements DocumentExtractionRuntimePort {
  readonly providerId: Extract<DocumentExtractionRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: DocumentExtractionRuntimeProviderMetadata;
  private readonly store: DocumentExtractionRuntimeStore;
  private readonly enterpriseDeps: DocumentExtractionRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultDocumentExtractionRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Document Extraction Runtime ready (structural only — no real extraction).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Document Extraction Runtime"
          : DOCUMENT_EXTRACTION_RUNTIME_IDENTITY.name,
      version: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
      vendor: DOCUMENT_EXTRACTION_RUNTIME_IDENTITY.vendor,
      layer: DOCUMENT_EXTRACTION_RUNTIME_IDENTITY.layer,
      vendorAgnostic: DOCUMENT_EXTRACTION_RUNTIME_IDENTITY.vendorAgnostic,
      description: DOCUMENT_EXTRACTION_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryDocumentExtractionRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): DocumentExtractionRuntimeStore {
    return this.store;
  }

  capabilities(): DocumentExtractionRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalExtraction: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      engine: { ...DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalExtractionCapabilities(
        DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): DocumentExtractionRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_EXTRACTION_RUNTIME",
      capabilities: { ...DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<DocumentExtractionRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // F3-CAP-07 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
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
          ? "Document Extraction Runtime pronto (estrutural F3-CAP-07 — sem extração real)."
          : "Document Extraction Runtime degradado — ver Ports Enterprise."
        : "Document Extraction Runtime unhealthy.",
    };
  }

  async openJob(input: OpenExtractionJobInput): Promise<OpenExtractionJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createExtractionJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "DOCUMENT_EXTRACTION_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical ExtractionJob already open.",
          job: existing,
        };
      }
      const job: ExtractionJob = {
        kind: "canonical-extraction-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-extraction-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        classificationContext: input.classificationContext,
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
        code: "DOCUMENT_EXTRACTION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Extraction Runtime structural openJob (F3-CAP-07 foundation — no real extraction).",
        classificationContext: input.classificationContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "DOCUMENT_EXTRACTION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseExtractionJobInput): Promise<CloseExtractionJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "DOCUMENT_EXTRACTION_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical ExtractionJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: ExtractionJob = {
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
        code: "DOCUMENT_EXTRACTION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Extraction Runtime structural closeJob (F3-CAP-07 foundation — no real teardown).",
        classificationContext: job.classificationContext,
      });
      return {
        ok: true,
        result,
        job,
        code: "DOCUMENT_EXTRACTION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitExtractionRequestInput): Promise<SubmitExtractionRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createExtractionJobId();
        job = {
          kind: "canonical-extraction-job",
          jobId,
          status: "job-open",
          classificationContext: input.classificationContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createDocumentExtractionCapRequestId();
      const request: DocumentExtractionRequest = {
        kind: "canonical-document-extraction-request",
        requestId,
        jobId: job.jobId,
        documentId: input.documentId,
        status: "submitted",
        metadata: input.metadata,
        classificationContext: input.classificationContext ?? job.classificationContext,
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
        code: "DOCUMENT_EXTRACTION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Extraction Runtime structural submitRequest (F3-CAP-07 foundation — no engine dispatch).",
        classificationContext: request.classificationContext,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "DOCUMENT_EXTRACTION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerDocument(
    input: RegisterExtractionDocumentInput,
  ): Promise<RegisterExtractionDocumentResult> {
    return this.runOperation("registerDocument", input, async () => {
      const stamp = nowIso(this.now);
      const documentId = input.documentId ?? createDocumentExtractionDocumentId();
      const document: DocumentExtractionDocument = {
        kind: "canonical-document-extraction-document",
        documentId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        metadata: input.metadata,
        classificationContext: input.classificationContext,
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
        code: "DOCUMENT_EXTRACTION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Extraction Runtime structural registerDocument (F3-CAP-07 foundation — no field reading).",
        classificationContext: input.classificationContext,
      });
      return {
        ok: true,
        result,
        document,
        code: "DOCUMENT_EXTRACTION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetExtractionResultInput): Promise<GetExtractionResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const document = input.documentId ? this.store.getDocument(input.documentId) : undefined;
      if (!job && !request && !document) {
        return {
          ok: false,
          code: "DOCUMENT_EXTRACTION_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Extraction job/request/document not found.",
        };
      }
      const stamp = nowIso(this.now);
      const classificationContext =
        request?.classificationContext ??
        job?.classificationContext ??
        document?.classificationContext;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? document?.status ?? "processed",
        job,
        request,
        document,
        stamp,
        code: "DOCUMENT_EXTRACTION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Extraction Runtime structural getResult (F3-CAP-07 foundation — no real field extraction).",
        classificationContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        document,
        code: "DOCUMENT_EXTRACTION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: ExtractionStatsInput = {}): Promise<ExtractionStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "DOCUMENT_EXTRACTION_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Document Extraction Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "DOCUMENT_EXTRACTION_RUNTIME_OK",
        message: `Document Extraction Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalDocuments} documents.`,
      };
    });
  }

  private buildResult(args: {
    operation: DocumentExtractionResult["operation"];
    status: DocumentExtractionResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: ExtractionJob;
    request?: DocumentExtractionRequest;
    document?: DocumentExtractionDocument;
    classificationContext?: DocumentExtractionResult["classificationContext"];
  }): DocumentExtractionResult {
    return {
      kind: "canonical-document-extraction-result",
      ok: true,
      resultId: createDocumentExtractionResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      document: args.document,
      fields: [],
      tables: [],
      summary: {
        kind: "canonical-extraction-summary",
        fieldCount: 0,
        tableCount: 0,
        status: args.status,
        classificationContext: args.classificationContext,
        fieldExtractionImplemented: false,
        structuredExtractionImplemented: false,
        tableExtractionImplemented: false,
        medicalGuideExtractionImplemented: false,
      },
      provider: {
        kind: "canonical-extraction-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      classificationContext: args.classificationContext,
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
    input: DocumentExtractionRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & DocumentExtractionRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createDocumentExtractionRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: DocumentExtractionRuntimeStructuredLog[] = [];
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
            code: "DOCUMENT_EXTRACTION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & DocumentExtractionRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "DOCUMENT_EXTRACTION_RUNTIME_RETRY",
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
              reject(new Error("Document Extraction Runtime operation timed out."));
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
        code: "DOCUMENT_EXTRACTION_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error
            ? lastError.message
            : "Document Extraction Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & DocumentExtractionRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Document Extraction Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "DOCUMENT_EXTRACTION_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & DocumentExtractionRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (F3-CAP-07). */
export const EnterpriseDocumentExtractionRuntimeAdapter = DefaultDocumentExtractionRuntimeAdapter;
