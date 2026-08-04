/**
 * DefaultOCRRuntimeAdapter — F3-CAP-05 (+ DIP-03 / OCR-01 preservado).
 *
 * Adapter oficial do Enterprise OCR Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerDocument/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Coordenação/execução real (DIP-03/OCR-01) permanece exclusiva de:
 *   Canonical Execution Orchestrator → OCRProviderPort → Adapter
 * NÃO chama Azure/HTTP diretamente. Todo OCR real passa por OCRProviderPort.process().
 */
import {
  DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalOCRCapabilities,
} from "../ports/capabilities";
import {
  OCR_RUNTIME_IDENTITY,
  createOCRCapRequestId,
  createOCRDocumentId,
  createOCRJobId,
  createOCRResultId,
  createOCRRuntimeRequestId,
  createOCRRuntimeSessionId,
} from "../ports/identity";
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type { CanonicalOCRSession } from "../ports/models";
import type { OCRDocument, OCRJob, OCRRequest, OCRResult } from "../ports/canonical";
import type { OCRProcessInput } from "../../ocr-provider/ports/types";
import type {
  CloseOCRJobInput,
  CloseOCRJobResult,
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRResultInput,
  GetOCRResultResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRRuntimeCapabilities,
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeHealth,
  OCRRuntimeInfo,
  OCRRuntimeOperationalControls,
  OCRRuntimeOperationEnvelope,
  OCRRuntimeProviderId,
  OCRRuntimeProviderMetadata,
  OCRRuntimeStructuredLog,
  OCRStatsInput,
  OCRStatsResult,
  OpenOCRJobInput,
  OpenOCRJobResult,
  ProcessOCRInput,
  ProcessOCRResult,
  RegisterOCRDocumentInput,
  RegisterOCRDocumentResult,
  SubmitOCRRequestInput,
  SubmitOCRRequestResult,
} from "../ports/types";
import {
  STRUCTURAL_OCR_PROVIDER_REFERENCES,
  resolveStructuralProviderReference,
} from "../ports/types";
import { InMemoryOCRRuntimeStore, type OCRRuntimeStore } from "../store";

export const DEFAULT_OCR_RUNTIME_ADAPTER_ID = "default-enterprise-ocr-runtime";
export const DEFAULT_OCR_RUNTIME_VERSION = OCR_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultOCRRuntimeAdapterOptions = {
  provider?: Extract<OCRRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: OCRRuntimeStore;
  /** Ports Enterprise estruturais — opcionais (obrigatórios apenas para process()/coordinateOcr() real). */
  enterpriseDeps?: OCRRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
  /** Compat DIP-03 — probe alternativo de health(). */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(input: OCRRuntimeOperationalControls): AbortSignal | undefined {
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
    ocrEngineImplemented: false,
    pdfOcrImplemented: false,
    imageOcrImplemented: false,
    documentRecognitionImplemented: false,
    textExtractionImplemented: false,
    barcodeRecognitionImplemented: false,
    qrRecognitionImplemented: false,
    layoutAnalysisImplemented: false,
    tableRecognitionImplemented: false,
    handwritingRecognitionImplemented: false,
    multiEngineImplemented: false,
    confidenceScoreImplemented: false,
    languageDetectionImplemented: false,
  } as const;
}

function toProviderReferenceId(
  providerId: string,
): ReturnType<typeof resolveStructuralProviderReference>["providerReferenceId"] {
  switch (providerId) {
    case "azure":
    case "google-vision":
    case "aws-textract":
    case "tesseract":
    case "mock":
      return providerId;
    case "test":
    case "default":
      return "mock";
    default:
      return "azure";
  }
}

/**
 * Adapter oficial F3-CAP-05 — OCR Runtime default / enterprise.
 */
export class DefaultOCRRuntimeAdapter implements OCRRuntimePort {
  readonly providerId: Extract<OCRRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: OCRRuntimeProviderMetadata;
  private readonly store: OCRRuntimeStore;
  private readonly enterpriseDeps: OCRRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private failAttemptsRemaining: number;

  constructor(options: DefaultOCRRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} OCR Runtime ready (structural only — no real OCR engine).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default OCR Runtime" : OCR_RUNTIME_IDENTITY.name,
      version: DEFAULT_OCR_RUNTIME_VERSION,
      vendor: OCR_RUNTIME_IDENTITY.vendor,
      layer: OCR_RUNTIME_IDENTITY.layer,
      vendorAgnostic: OCR_RUNTIME_IDENTITY.vendorAgnostic,
      description: OCR_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryOCRRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createOCRRuntimeSessionId;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): OCRRuntimeStore {
    return this.store;
  }

  capabilities(): OCRRuntimeCapabilities {
    const hasOcrProvider = typeof this.enterpriseDeps.getOCRProviderPort === "function";
    return {
      provider: this.providerId,
      adapterId: DEFAULT_OCR_RUNTIME_ADAPTER_ID,
      supportsCoordinateOcr: true,
      supportsProcess: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: true,
      usesCanonicalExecutionOrchestrator: true,
      usesOCRProviderAdapter: true,
      usesCaptureEngineRuntime: true,
      supportsPdf: true,
      supportsImage: true,
      supportsBatch: false,
      supportsStreaming: false,
      supportsHandwriting: true,
      supportsTables: true,
      supportsForms: false,
      supportsConfidenceScore: true,
      implementsRealOcr: hasOcrProvider,
      implementsAzure: false,
      implementsGoogleVision: false,
      implementsAwsTextract: false,
      implementsTesseract: false,
      implementsAi: false,
      implementsClassification: false,
      implementsXml: false,
      implementsTiss: false,
      // F3-CAP-05 — operações estruturais.
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalOcr: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      engine: { ...DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalOCRCapabilities(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): OCRRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "OCR_RUNTIME",
      capabilities: { ...DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<OCRRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: this.providerId,
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
        realOcrAvailable: false,
        status: probe.ok ? "ready" : "unhealthy",
        runtimeReady: true,
        ...structuralFlags(),
      };
    }

    const storeHealth = this.store.health();

    let enterpriseOrchestratorOk = true;
    let ocrProviderAdapterOk = true;
    let realOcrAvailable = false;
    if (typeof this.enterpriseDeps.getOrchestratorPort === "function") {
      const orchestratorHealth = await this.enterpriseDeps.getOrchestratorPort().health();
      enterpriseOrchestratorOk = orchestratorHealth.ok;
    }
    if (typeof this.enterpriseDeps.getOCRProviderPort === "function") {
      const ocrProvider = this.enterpriseDeps.getOCRProviderPort();
      const ocrProviderHealth = await ocrProvider.health();
      ocrProviderAdapterOk = ocrProviderHealth.ok;
      realOcrAvailable = ocrProvider.providerId === "azure" && ocrProviderHealth.ok;
    }

    // F3-CAP-05 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
    let intelligentCaptureRuntimeOk = true;
    let scannerRuntimeOk = true;
    let watchFolderRuntimeOk = true;
    let uploadRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let workerRuntimeOk = true;
    let observabilityRuntimeOk = true;
    let scalabilityRuntimeOk = true;

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
      enterpriseOrchestratorOk &&
      ocrProviderAdapterOk &&
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
      enterpriseOrchestratorOk,
      ocrProviderAdapterOk,
      realOcrAvailable,
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
          ? "OCR Runtime pronto (estrutural F3-CAP-05 + Orchestrator/OCRProviderPort quando presentes — sem OCR real)."
          : "OCR Runtime degradado — ver Ports Enterprise."
        : "OCR Runtime unhealthy.",
    };
  }

  // ---------------------------------------------------------------------
  // F3-CAP-05 — operações estruturais canônicas.
  // ---------------------------------------------------------------------

  async openJob(input: OpenOCRJobInput): Promise<OpenOCRJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createOCRJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "OCR_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical OCRJob already open.",
          job: existing,
        };
      }
      const job: OCRJob = {
        kind: "canonical-ocr-job",
        jobId,
        status: "job-open",
        engine: input.engine ?? "structural",
        identity: {
          kind: "canonical-ocr-cap-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
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
        code: "OCR_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical OCR Runtime structural openJob (F3-CAP-05 foundation — no real OCR).",
      });
      return {
        ok: true,
        result,
        job,
        code: "OCR_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseOCRJobInput): Promise<CloseOCRJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "OCR_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical OCRJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: OCRJob = { ...existing, status: "job-closed", closedAt: stamp, updatedAt: stamp };
      this.store.setJob(job);
      const result = this.buildResult({
        operation: "closeJob",
        status: "job-closed",
        job,
        stamp,
        code: "OCR_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical OCR Runtime structural closeJob (F3-CAP-05 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        job,
        code: "OCR_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitOCRRequestInput): Promise<SubmitOCRRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createOCRJobId();
        job = {
          kind: "canonical-ocr-job",
          jobId,
          status: "job-open",
          engine: input.engine ?? "structural",
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createOCRCapRequestId();
      const request: OCRRequest = {
        kind: "canonical-ocr-cap-request",
        requestId,
        jobId: job.jobId,
        documentId: input.documentId,
        status: "submitted",
        engine: input.engine ?? job.engine,
        language: input.language,
        metadata: input.metadata,
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
        code: "OCR_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical OCR Runtime structural submitRequest (F3-CAP-05 foundation — no engine dispatch).",
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "OCR_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerDocument(input: RegisterOCRDocumentInput): Promise<RegisterOCRDocumentResult> {
    return this.runOperation("registerDocument", input, async () => {
      const stamp = nowIso(this.now);
      const documentId = input.documentId ?? createOCRDocumentId();
      const document: OCRDocument = {
        kind: "canonical-ocr-document",
        documentId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        metadata: input.metadata,
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
        code: "OCR_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical OCR Runtime structural registerDocument (F3-CAP-05 foundation — no byte/page reading).",
      });
      return {
        ok: true,
        result,
        document,
        code: "OCR_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetOCRResultInput): Promise<GetOCRResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const document = input.documentId ? this.store.getDocument(input.documentId) : undefined;
      if (!job && !request && !document) {
        return {
          ok: false,
          code: "OCR_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical OCR job/request/document not found.",
        };
      }
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? document?.status ?? "processed",
        job,
        request,
        document,
        stamp,
        code: "OCR_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical OCR Runtime structural getResult (F3-CAP-05 foundation — no real text extraction).",
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        document,
        code: "OCR_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: OCRStatsInput = {}): Promise<OCRStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "OCR_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical OCR Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "OCR_RUNTIME_OK",
        message: `OCR Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalDocuments} documents.`,
      };
    });
  }

  private buildResult(args: {
    operation: OCRResult["operation"];
    status: OCRResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: OCRJob;
    request?: OCRRequest;
    document?: OCRDocument;
  }): OCRResult {
    return {
      kind: "canonical-ocr-cap-result",
      ok: true,
      resultId: createOCRResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      document: args.document,
      provider: {
        kind: "canonical-ocr-cap-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_OCR_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
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
    input: OCRRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & OCRRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createOCRRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: OCRRuntimeStructuredLog[] = [];
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
            code: "OCR_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & OCRRuntimeOperationEnvelope;
        }

        try {
          if (this.failAttemptsRemaining > 0) {
            this.failAttemptsRemaining -= 1;
            throw new Error("Forced transient failure (test).");
          }

          const body = await this.withTimeout(fn(), timeoutMs, signal);
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          logs.push({
            level: "info",
            code: body.code ?? "OCR_RUNTIME_OK",
            message: body.message ?? `${operation} completed`,
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          return {
            ...body,
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
        } catch (err) {
          lastError = err;
          logs.push({
            level: "warn",
            code: "OCR_RUNTIME_RETRY",
            message: err instanceof Error ? err.message : String(err),
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          if (attempt < retryCount) {
            await this.sleep(this.defaultRetryBackoffMs * (attempt + 1));
          }
        }
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        lastError instanceof Error ? lastError.message : String(lastError ?? "unknown error");
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "OCR_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & OCRRuntimeOperationEnvelope;
    } catch (err) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const isTimeout =
        err instanceof Error && (err.name === "TimeoutError" || /timeout/i.test(err.message));
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "OCR_RUNTIME_CANCELLED"
          : isTimeout
            ? "OCR_RUNTIME_TIMEOUT"
            : "OCR_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & OCRRuntimeOperationEnvelope;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<T> {
    if (timeoutMs <= 0 && !signal) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          if (timeoutMs > 0) {
            timer = setTimeout(() => {
              const err = new Error(`OCR Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("OCR Runtime operation aborted");
              err.name = "AbortError";
              reject(err);
            };
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
          }
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    }
  }

  // ---------------------------------------------------------------------
  // DIP-03 / OCR-01 — coordenação e execução real preservadas.
  // ---------------------------------------------------------------------

  async coordinateOcr(input: CoordinateOCRInput): Promise<CoordinateOCRResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-ocr-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realOcrExecuted: false,
      };
    }

    if (
      typeof this.enterpriseDeps.getOrchestratorPort !== "function" ||
      typeof this.enterpriseDeps.getOCRProviderPort !== "function"
    ) {
      return {
        kind: "canonical-ocr-result",
        ok: false,
        message:
          "OCR Runtime coordinateOcr exige enterpriseDeps.getOrchestratorPort + getOCRProviderPort.",
        code: "OCR_RUNTIME_PROVIDER_DEPS_MISSING",
        realOcrExecuted: false,
      };
    }

    const providerReference = resolveStructuralProviderReference(
      input.configuration?.preferredProviderReference ??
        input.reference?.providerReferenceId ??
        "azure",
    );

    let session: CanonicalOCRSession = {
      kind: "canonical-ocr-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      providerReferenceId: providerReference.providerReferenceId,
      createdAt: stamp,
      updatedAt: stamp,
      realOcrExecuted: false,
    };
    this.store.setSession(session);

    try {
      session = {
        ...session,
        status: "coordinating",
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);

      const orchestrator = this.enterpriseDeps.getOrchestratorPort();
      const channel = input.configuration?.channel ?? input.metadata.channel ?? "ocr-runtime";

      const execution = await orchestrator.startExecution({
        correlationId: input.metadata.correlationId,
        tenantRef: input.metadata.tenantRef,
        channel,
        intakeRef: input.metadata.sessionId,
        documentRef: input.identity.documentId,
        tags: ["ocr-01", "ocr-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: "ocr-runtime-coordination",
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          providerReferenceId: providerReference.providerReferenceId,
          captureRuntimeSessionId: input.reference?.captureRuntimeSessionId ?? null,
          realOcrExecuted: false,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "OCR-01: OCR coordinated via OCR Runtime (execution via process()/OCRProviderPort).",
      });

      if (!execution.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          updatedAt: nowIso(this.now),
          message: execution.message ?? "Orchestrator startExecution falhou.",
          code: execution.code ?? "ORCHESTRATOR_FAILED",
          errors: [execution.message ?? "ORCHESTRATOR_FAILED"],
          realOcrExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-ocr-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realOcrExecuted: false,
        };
      }

      const ocrProvider = this.enterpriseDeps.getOCRProviderPort();
      const providerCaps = ocrProvider.capabilities();
      const providerHealth = await ocrProvider.health();

      if (!providerHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          ocrProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: providerHealth.message ?? "OCR Provider Adapter health falhou.",
          code: "OCR_PROVIDER_ADAPTER_UNHEALTHY",
          errors: [providerHealth.message ?? "OCR_PROVIDER_ADAPTER_UNHEALTHY"],
          realOcrExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-ocr-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realOcrExecuted: false,
        };
      }

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        ocrProviderAdapterId: providerCaps.adapterId,
        updatedAt: nowIso(this.now),
        message:
          "OCR coordinated via OCR Runtime (Orchestrator + OCRProviderPort — execution via process()).",
        code: "COORDINATED",
        realOcrExecuted: false,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-ocr-result",
        ok: true,
        runtimeSessionId,
        session,
        executionId: execution.context?.executionId,
        providerReferenceId: providerReference.providerReferenceId,
        message: session.message,
        code: session.code,
        realOcrExecuted: false,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        updatedAt: nowIso(this.now),
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        errors: [message],
        realOcrExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-ocr-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realOcrExecuted: false,
      };
    }
  }

  async process(input: ProcessOCRInput): Promise<ProcessOCRResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const documentId = input.documentId ?? input.documentIdentityReference?.documentId ?? "unknown";
    const sessionId = input.sessionId ?? String(input.attributes?.sessionId ?? runtimeSessionId);

    if (
      typeof this.enterpriseDeps.getOrchestratorPort !== "function" ||
      typeof this.enterpriseDeps.getOCRProviderPort !== "function"
    ) {
      const session: CanonicalOCRSession = {
        kind: "canonical-ocr-session",
        runtimeSessionId,
        status: "failed",
        request: {
          kind: "canonical-ocr-request",
          identity: { kind: "canonical-ocr-identity", documentId },
          metadata: { kind: "canonical-ocr-metadata", sessionId },
        },
        createdAt: stamp,
        updatedAt: stamp,
        message:
          "OCR Runtime process exige enterpriseDeps.getOrchestratorPort + getOCRProviderPort.",
        code: "OCR_RUNTIME_PROVIDER_DEPS_MISSING",
        realOcrExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-ocr-result",
        ok: false,
        runtimeSessionId,
        session,
        message: session.message,
        code: session.code,
        realOcrExecuted: false,
      };
    }

    const ocrProvider = this.enterpriseDeps.getOCRProviderPort();
    const providerCaps = ocrProvider.capabilities();
    const providerReferenceId = toProviderReferenceId(ocrProvider.providerId);

    let session: CanonicalOCRSession = {
      kind: "canonical-ocr-session",
      runtimeSessionId,
      status: "pending",
      request: {
        kind: "canonical-ocr-request",
        identity: {
          kind: "canonical-ocr-identity",
          documentId,
          documentKind: "capture-document",
        },
        metadata: {
          kind: "canonical-ocr-metadata",
          sessionId,
          tenantRef:
            input.tenantRef ??
            (input.attributes?.tenantId != null ? String(input.attributes.tenantId) : undefined),
          correlationId: input.correlationId,
          channel: "ocr-runtime-process",
          tags: ["ocr-01", "ocr-runtime", "process"],
        },
        reference: {
          kind: "canonical-ocr-reference",
          storageKey: String(input.attributes?.storagePath ?? "") || undefined,
          captureRuntimeSessionId: input.captureRuntimeSessionId,
          providerReferenceId: input.preferredProviderReference ?? providerReferenceId,
        },
        configuration: {
          kind: "canonical-ocr-configuration",
          preferredProviderReference: input.preferredProviderReference ?? providerReferenceId,
          contentTypeHint: input.contentType,
          languageHint: input.language,
          channel: "ocr-runtime-process",
          notes: "OCR-01: process via OCRProviderPort (no direct Azure access).",
        },
        structuralNotes: "OCR-01: OCR Runtime process → OCRProviderPort.process().",
      },
      providerReferenceId,
      ocrProviderAdapterId: providerCaps.adapterId,
      createdAt: stamp,
      updatedAt: stamp,
      realOcrExecuted: false,
    };
    this.store.setSession(session);

    try {
      session = { ...session, status: "processing", updatedAt: nowIso(this.now) };
      this.store.setSession(session);

      try {
        const orchestrator = this.enterpriseDeps.getOrchestratorPort();
        const execution = await orchestrator.startExecution({
          correlationId: input.correlationId,
          tenantRef: input.tenantRef,
          channel: "ocr-runtime-process",
          intakeRef: sessionId,
          documentRef: documentId,
          tags: ["ocr-01", "ocr-runtime", "process"],
          customAttributes: {
            source: "ocr-runtime-process",
            requestId: input.requestId ?? null,
            providerId: ocrProvider.providerId,
            adapterId: providerCaps.adapterId,
            captureRuntimeSessionId: input.captureRuntimeSessionId ?? null,
          },
          structuralNotes: "OCR-01: OCR execution coordinated via OCR Runtime → OCRProviderPort.",
        });
        if (execution.ok) {
          session = {
            ...session,
            executionId: execution.context?.executionId,
            updatedAt: nowIso(this.now),
          };
          this.store.setSession(session);
        }
      } catch {
        // Orchestrator best-effort — OCR Provider Port permanece obrigatório.
      }

      const processInput: OCRProcessInput = {
        requestId: input.requestId,
        contentType: input.contentType,
        language: input.language,
        documentIdentityReference: input.documentIdentityReference ?? {
          documentId,
          kind: "document",
        },
        metadataReference: input.metadataReference,
        rawDataReference: input.rawDataReference,
        fileBytes: input.fileBytes,
        signal: input.signal,
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
        attributes: {
          ...(input.attributes ?? {}),
          sessionId,
          documentId,
          tenantId: input.tenantRef ?? null,
          storagePath: input.attributes?.storagePath ?? null,
        },
      };

      const providerResult = await ocrProvider.process(processInput);

      session = {
        ...session,
        status: providerResult.ok ? "completed" : "failed",
        updatedAt: nowIso(this.now),
        message: providerResult.message,
        code: providerResult.ok ? "OCR_PROCESSED" : "OCR_PROVIDER_FAILED",
        errors: providerResult.ok ? undefined : [providerResult.message ?? "OCR_PROVIDER_FAILED"],
        realOcrExecuted: providerResult.simulated !== true,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-ocr-result",
        ok: providerResult.ok,
        runtimeSessionId,
        session,
        executionId: session.executionId,
        providerReferenceId,
        message: providerResult.message,
        code: session.code,
        realOcrExecuted: session.realOcrExecuted,
        processing: providerResult.processing,
        output: providerResult.output,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        updatedAt: nowIso(this.now),
        message,
        code: "RUNTIME_PROCESS_ERROR",
        errors: [message],
        realOcrExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-ocr-result",
        ok: false,
        runtimeSessionId,
        session,
        providerReferenceId,
        message,
        code: "RUNTIME_PROCESS_ERROR",
        realOcrExecuted: false,
      };
    }
  }

  async getSession(input: GetOCRRuntimeSessionInput): Promise<GetOCRRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListOCRRuntimeSessionsInput = {},
  ): Promise<ListOCRRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListOCRProviderReferencesResult> {
    return { ok: true, references: STRUCTURAL_OCR_PROVIDER_REFERENCES };
  }
}

function matchesList(session: CanonicalOCRSession, input: ListOCRRuntimeSessionsInput): boolean {
  if (input.status != null && session.status !== input.status) return false;
  if (input.documentId != null && session.request.identity.documentId !== input.documentId) {
    return false;
  }
  if (input.sessionId != null && session.request.metadata.sessionId !== input.sessionId) {
    return false;
  }
  if (input.idPrefix != null && !session.runtimeSessionId.startsWith(input.idPrefix)) {
    return false;
  }
  if (
    input.captureRuntimeSessionId != null &&
    session.request.reference?.captureRuntimeSessionId !== input.captureRuntimeSessionId
  ) {
    return false;
  }
  return true;
}

/** Alias oficial do adapter enterprise (F3-CAP-05). */
export const EnterpriseOCRRuntimeAdapter = DefaultOCRRuntimeAdapter;
