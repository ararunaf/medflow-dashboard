/**
 * DefaultDocumentClassificationRuntimeAdapter — F3-CAP-06 (+ DIP-04 / CLASS-01 preservado).
 *
 * Adapter oficial do Enterprise Document Classification Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerDocument/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Coordenação/execução real (DIP-04/CLASS-01) permanece exclusiva de:
 *   Canonical Execution Orchestrator → OCR Runtime → DocumentClassificationProviderPort → Adapter
 * NÃO usa IA/LLM/ML/embeddings. Todo classificação real passa por
 * DocumentClassificationProviderPort.classify().
 */
import {
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalClassificationCapabilities,
} from "../ports/capabilities";
import {
  DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY,
  createDocumentClassificationCapRequestId,
  createDocumentClassificationDocumentId,
  createDocumentClassificationJobId,
  createDocumentClassificationResultId,
  createDocumentClassificationRuntimeRequestId,
  createDocumentClassificationRuntimeSessionId,
} from "../ports/identity";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type { CanonicalDocumentClassificationSession } from "../ports/models";
import type { DocumentClassificationProcessInput } from "../../document-classification-provider/ports/types";
import type {
  DocumentClassificationDocument,
  DocumentClassificationJob,
  DocumentClassificationRequest,
  DocumentClassificationResult,
} from "../ports/canonical";
import type {
  ClassificationStatsInput,
  ClassificationStatsResult,
  ClassifyDocumentInput,
  ClassifyDocumentResult,
  CloseClassificationJobInput,
  CloseClassificationJobResult,
  CoordinateClassificationInput,
  CoordinateClassificationResult,
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeEnterpriseDeps,
  DocumentClassificationRuntimeHealth,
  DocumentClassificationRuntimeInfo,
  DocumentClassificationRuntimeOperationalControls,
  DocumentClassificationRuntimeOperationEnvelope,
  DocumentClassificationRuntimeProviderId,
  DocumentClassificationRuntimeProviderMetadata,
  DocumentClassificationRuntimeStructuredLog,
  GetClassificationResultInput,
  GetClassificationResultResult,
  GetDocumentClassificationRuntimeSessionInput,
  GetDocumentClassificationRuntimeSessionResult,
  ListDocumentClassificationProviderReferencesResult,
  ListDocumentClassificationRuntimeSessionsInput,
  ListDocumentClassificationRuntimeSessionsResult,
  OpenClassificationJobInput,
  OpenClassificationJobResult,
  RegisterClassificationDocumentInput,
  RegisterClassificationDocumentResult,
  SubmitClassificationRequestInput,
  SubmitClassificationRequestResult,
} from "../ports/types";
import {
  STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES,
  resolveStructuralClassificationProviderReference,
} from "../ports/types";
import {
  InMemoryDocumentClassificationRuntimeStore,
  type DocumentClassificationRuntimeStore,
} from "../store";

export const DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID =
  "default-enterprise-document-classification-runtime";
export const DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION =
  DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.version;

/** @deprecated CLASS-01 — prefer adapterId do DocumentClassificationProviderPort. */
export const STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID =
  "structural-classification-provider-adapter";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultDocumentClassificationRuntimeAdapterOptions = {
  provider?: Extract<DocumentClassificationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: DocumentClassificationRuntimeStore;
  /** Ports Enterprise estruturais — opcionais (obrigatórios apenas para classify()/coordinateClassification() real). */
  enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
  /** Compat DIP-04 — probe alternativo de health(). */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(
  input: DocumentClassificationRuntimeOperationalControls,
): AbortSignal | undefined {
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
    classificationImplemented: false,
    documentRecognitionImplemented: false,
    templateRecognitionImplemented: false,
    medicalGuideRecognitionImplemented: false,
    documentCategoryImplemented: false,
    automaticRoutingImplemented: false,
    confidenceScoreImplemented: false,
    multiClassifierImplemented: false,
    layoutClassificationImplemented: false,
    semanticClassificationImplemented: false,
  } as const;
}

function toProviderReferenceId(
  providerId: string,
): ReturnType<typeof resolveStructuralClassificationProviderReference>["providerReferenceId"] {
  switch (providerId) {
    case "rule-based":
    case "default":
      return "rule-based-classifier";
    case "mock":
    case "test":
      return "mock";
    case "ai-classifier":
    case "ml-classifier":
    case "hybrid-classifier":
      return providerId;
    default:
      return "rule-based-classifier";
  }
}

/**
 * Adapter oficial F3-CAP-06 — Document Classification Runtime default / enterprise.
 */
export class DefaultDocumentClassificationRuntimeAdapter implements DocumentClassificationRuntimePort {
  readonly providerId: Extract<DocumentClassificationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: DocumentClassificationRuntimeProviderMetadata;
  private readonly store: DocumentClassificationRuntimeStore;
  private readonly enterpriseDeps: DocumentClassificationRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private failAttemptsRemaining: number;

  constructor(options: DefaultDocumentClassificationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Document Classification Runtime ready (structural only — no real classification).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Document Classification Runtime"
          : DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.name,
      version: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
      vendor: DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.vendor,
      layer: DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.layer,
      vendorAgnostic: DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.vendorAgnostic,
      description: DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryDocumentClassificationRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createDocumentClassificationRuntimeSessionId;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): DocumentClassificationRuntimeStore {
    return this.store;
  }

  capabilities(): DocumentClassificationRuntimeCapabilities {
    const hasProviderDeps =
      typeof this.enterpriseDeps.getDocumentClassificationProviderPort === "function";
    return {
      provider: this.providerId,
      adapterId: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
      supportsCoordinateClassification: true,
      supportsClassify: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: true,
      usesCanonicalExecutionOrchestrator: true,
      usesOCRRuntime: true,
      usesCaptureEngineRuntime: true,
      usesDocumentClassificationProviderAdapter: true,
      supportsMedicalGuideClassification: true,
      supportsInvoiceClassification: true,
      supportsContractClassification: false,
      supportsBatchClassification: false,
      supportsConfidenceScore: true,
      supportsMultiLabelClassification: false,
      supportsCustomModels: false,
      supportsRuleBasedClassification: true,
      implementsRealClassification: hasProviderDeps,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      implementsEmbeddings: false,
      implementsLlm: false,
      implementsOcrForClassification: false,
      // F3-CAP-06 — operações estruturais.
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalClassification: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      engine: { ...DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalClassificationCapabilities(
        DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): DocumentClassificationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_CLASSIFICATION_RUNTIME",
      capabilities: { ...DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<DocumentClassificationRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: this.providerId,
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
        realClassificationAvailable: false,
        status: probe.ok ? "ready" : "unhealthy",
        runtimeReady: true,
        ...structuralFlags(),
      };
    }

    const storeHealth = this.store.health();

    let enterpriseOrchestratorOk = true;
    let ocrRuntimeOk = true;
    let classificationProviderAdapterOk = true;
    let realClassificationAvailable = false;
    if (typeof this.enterpriseDeps.getOrchestratorPort === "function") {
      const orchestratorHealth = await this.enterpriseDeps.getOrchestratorPort().health();
      enterpriseOrchestratorOk = orchestratorHealth.ok;
    }
    if (typeof this.enterpriseDeps.getOCRRuntimePort === "function") {
      const ocrHealth = await this.enterpriseDeps.getOCRRuntimePort().health();
      ocrRuntimeOk = ocrHealth.ok;
    }
    if (typeof this.enterpriseDeps.getDocumentClassificationProviderPort === "function") {
      const providerHealth = await this.enterpriseDeps
        .getDocumentClassificationProviderPort()
        .health();
      classificationProviderAdapterOk = providerHealth.ok;
      realClassificationAvailable = providerHealth.ok;
    }

    // F3-CAP-06 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
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
      ocrRuntimeOk &&
      classificationProviderAdapterOk &&
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
      ocrRuntimeOk,
      classificationProviderAdapterOk,
      realClassificationAvailable,
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
          ? "Document Classification Runtime pronto (estrutural F3-CAP-06 + Orchestrator/OCR Runtime/Classification Provider quando presentes — sem classificação real)."
          : "Document Classification Runtime degradado — ver Ports Enterprise."
        : "Document Classification Runtime unhealthy.",
    };
  }

  // ---------------------------------------------------------------------
  // F3-CAP-06 — operações estruturais canônicas.
  // ---------------------------------------------------------------------

  async openJob(input: OpenClassificationJobInput): Promise<OpenClassificationJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createDocumentClassificationJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "CLASSIFICATION_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical DocumentClassificationJob already open.",
          job: existing,
        };
      }
      const job: DocumentClassificationJob = {
        kind: "canonical-classification-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-classification-cap-identity",
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
        code: "CLASSIFICATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Classification Runtime structural openJob (F3-CAP-06 foundation — no real classification).",
      });
      return {
        ok: true,
        result,
        job,
        code: "CLASSIFICATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseClassificationJobInput): Promise<CloseClassificationJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "CLASSIFICATION_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical DocumentClassificationJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: DocumentClassificationJob = {
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
        code: "CLASSIFICATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Classification Runtime structural closeJob (F3-CAP-06 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        job,
        code: "CLASSIFICATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(
    input: SubmitClassificationRequestInput,
  ): Promise<SubmitClassificationRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createDocumentClassificationJobId();
        job = {
          kind: "canonical-classification-job",
          jobId,
          status: "job-open",
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createDocumentClassificationCapRequestId();
      const request: DocumentClassificationRequest = {
        kind: "canonical-classification-cap-request",
        requestId,
        jobId: job.jobId,
        documentId: input.documentId,
        status: "submitted",
        documentCategory: input.documentCategory,
        documentType: input.documentType,
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
        code: "CLASSIFICATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Classification Runtime structural submitRequest (F3-CAP-06 foundation — no classifier dispatch).",
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "CLASSIFICATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerDocument(
    input: RegisterClassificationDocumentInput,
  ): Promise<RegisterClassificationDocumentResult> {
    return this.runOperation("registerDocument", input, async () => {
      const stamp = nowIso(this.now);
      const documentId = input.documentId ?? createDocumentClassificationDocumentId();
      const document: DocumentClassificationDocument = {
        kind: "canonical-classification-document",
        documentId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        documentCategory: input.documentCategory,
        documentType: input.documentType,
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
        code: "CLASSIFICATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Classification Runtime structural registerDocument (F3-CAP-06 foundation — no content reading).",
      });
      return {
        ok: true,
        result,
        document,
        code: "CLASSIFICATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetClassificationResultInput): Promise<GetClassificationResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const document = input.documentId ? this.store.getDocument(input.documentId) : undefined;
      if (!job && !request && !document) {
        return {
          ok: false,
          code: "CLASSIFICATION_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical classification job/request/document not found.",
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
        code: "CLASSIFICATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Document Classification Runtime structural getResult (F3-CAP-06 foundation — no real classification).",
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        document,
        code: "CLASSIFICATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: ClassificationStatsInput = {}): Promise<ClassificationStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "CLASSIFICATION_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Document Classification Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "CLASSIFICATION_RUNTIME_OK",
        message: `Document Classification Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalDocuments} documents.`,
      };
    });
  }

  private buildResult(args: {
    operation: DocumentClassificationResult["operation"];
    status: DocumentClassificationResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: DocumentClassificationJob;
    request?: DocumentClassificationRequest;
    document?: DocumentClassificationDocument;
  }): DocumentClassificationResult {
    return {
      kind: "canonical-classification-cap-result",
      ok: true,
      resultId: createDocumentClassificationResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      document: args.document,
      provider: {
        kind: "canonical-classification-cap-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
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
    input: DocumentClassificationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & DocumentClassificationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createDocumentClassificationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: DocumentClassificationRuntimeStructuredLog[] = [];
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
            code: "CLASSIFICATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & DocumentClassificationRuntimeOperationEnvelope;
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
            code: body.code ?? "CLASSIFICATION_RUNTIME_OK",
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
            code: "CLASSIFICATION_RUNTIME_RETRY",
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
        code: "CLASSIFICATION_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & DocumentClassificationRuntimeOperationEnvelope;
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
          ? "CLASSIFICATION_RUNTIME_CANCELLED"
          : isTimeout
            ? "CLASSIFICATION_RUNTIME_TIMEOUT"
            : "CLASSIFICATION_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & DocumentClassificationRuntimeOperationEnvelope;
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
              const err = new Error(
                `Document Classification Runtime operation timed out after ${timeoutMs}ms`,
              );
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Document Classification Runtime operation aborted");
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
  // DIP-04 / CLASS-01 — coordenação e execução real preservadas.
  // ---------------------------------------------------------------------

  async coordinateClassification(
    input: CoordinateClassificationInput,
  ): Promise<CoordinateClassificationResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realClassificationExecuted: false,
      };
    }

    const getOrchestrator = this.enterpriseDeps.getOrchestratorPort;
    const getOcrRuntime = this.enterpriseDeps.getOCRRuntimePort;
    const getProvider = this.enterpriseDeps.getDocumentClassificationProviderPort;
    if (
      typeof getOrchestrator !== "function" ||
      typeof getOcrRuntime !== "function" ||
      typeof getProvider !== "function"
    ) {
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        message:
          "Document Classification Runtime coordinateClassification exige enterpriseDeps.getOrchestratorPort + getOCRRuntimePort + getDocumentClassificationProviderPort.",
        code: "CLASSIFICATION_RUNTIME_PROVIDER_DEPS_MISSING",
        realClassificationExecuted: false,
      };
    }

    const classificationProvider = getProvider();
    const providerCaps = classificationProvider.capabilities();
    const providerReference = resolveStructuralClassificationProviderReference(
      input.configuration?.preferredProviderReference ??
        input.reference?.providerReferenceId ??
        toProviderReferenceId(classificationProvider.providerId),
    );

    let session: CanonicalDocumentClassificationSession = {
      kind: "canonical-document-classification-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      providerReferenceId: providerReference.providerReferenceId,
      createdAt: stamp,
      updatedAt: stamp,
      realClassificationExecuted: false,
    };
    this.store.setSession(session);

    try {
      session = {
        ...session,
        status: "coordinating",
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);

      const orchestrator = getOrchestrator();
      const channel =
        input.configuration?.channel ?? input.metadata.channel ?? "document-classification-runtime";

      const execution = await orchestrator.startExecution({
        correlationId: input.metadata.correlationId,
        tenantRef: input.metadata.tenantRef,
        channel,
        intakeRef: input.metadata.sessionId,
        documentRef: input.identity.documentId,
        tags: ["class-01", "document-classification-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: "document-classification-runtime-coordination",
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          providerReferenceId: providerReference.providerReferenceId,
          captureRuntimeSessionId: input.reference?.captureRuntimeSessionId ?? null,
          ocrRuntimeSessionId: input.reference?.ocrRuntimeSessionId ?? null,
          realClassificationExecuted: false,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "CLASS-01: Classification coordinated via Document Classification Runtime (execution via classify()).",
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
          realClassificationExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-document-classification-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realClassificationExecuted: false,
        };
      }

      const ocrRuntime = getOcrRuntime();
      const ocrCaps = ocrRuntime.capabilities();
      const ocrHealth = await ocrRuntime.health();

      if (!ocrHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          classificationProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: ocrHealth.message ?? "OCR Runtime health falhou.",
          code: "OCR_RUNTIME_UNHEALTHY",
          errors: [ocrHealth.message ?? "OCR_RUNTIME_UNHEALTHY"],
          realClassificationExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-document-classification-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realClassificationExecuted: false,
        };
      }

      const providerHealth = await classificationProvider.health();
      if (!providerHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          classificationProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: providerHealth.message ?? "Classification Provider Adapter health falhou.",
          code: "CLASSIFICATION_PROVIDER_ADAPTER_UNHEALTHY",
          errors: [providerHealth.message ?? "CLASSIFICATION_PROVIDER_ADAPTER_UNHEALTHY"],
          realClassificationExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-document-classification-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realClassificationExecuted: false,
        };
      }

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        classificationProviderAdapterId: providerCaps.adapterId,
        updatedAt: nowIso(this.now),
        message:
          "Classification coordinated via Document Classification Runtime " +
          `(Orchestrator + OCR Runtime adapter=${ocrCaps.adapterId} + ` +
          `Classification Provider adapter=${providerCaps.adapterId} — execution via classify()).`,
        code: "COORDINATED",
        realClassificationExecuted: false,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-document-classification-result",
        ok: true,
        runtimeSessionId,
        session,
        executionId: execution.context?.executionId,
        providerReferenceId: providerReference.providerReferenceId,
        message: session.message,
        code: session.code,
        realClassificationExecuted: false,
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
        realClassificationExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realClassificationExecuted: false,
      };
    }
  }

  async classify(input: ClassifyDocumentInput): Promise<ClassifyDocumentResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const documentId = input.documentId ?? String(input.attributes?.documentId ?? "unknown");
    const sessionId = input.sessionId ?? String(input.attributes?.sessionId ?? runtimeSessionId);

    const getProvider = this.enterpriseDeps.getDocumentClassificationProviderPort;
    if (typeof getProvider !== "function") {
      const session: CanonicalDocumentClassificationSession = {
        kind: "canonical-document-classification-session",
        runtimeSessionId,
        status: "failed",
        request: {
          kind: "canonical-document-classification-request",
          identity: { kind: "canonical-document-classification-identity", documentId },
          metadata: { kind: "canonical-document-classification-metadata", sessionId },
        },
        createdAt: stamp,
        updatedAt: stamp,
        message:
          "Document Classification Runtime classify exige enterpriseDeps.getDocumentClassificationProviderPort().",
        code: "CLASSIFICATION_RUNTIME_PROVIDER_DEPS_MISSING",
        realClassificationExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        runtimeSessionId,
        session,
        message: session.message,
        code: session.code,
        realClassificationExecuted: false,
      };
    }

    const classificationProvider = getProvider();
    const providerCaps = classificationProvider.capabilities();
    const providerReferenceId = toProviderReferenceId(classificationProvider.providerId);

    let session: CanonicalDocumentClassificationSession = {
      kind: "canonical-document-classification-session",
      runtimeSessionId,
      status: "pending",
      request: {
        kind: "canonical-document-classification-request",
        identity: {
          kind: "canonical-document-classification-identity",
          documentId,
          documentKind: "capture-document",
        },
        metadata: {
          kind: "canonical-document-classification-metadata",
          sessionId,
          tenantRef:
            input.tenantRef ??
            (input.attributes?.tenantId != null ? String(input.attributes.tenantId) : undefined),
          correlationId: input.correlationId,
          channel: "document-classification-runtime-classify",
          tags: ["class-01", "document-classification-runtime", "classify"],
        },
        reference: {
          kind: "canonical-document-classification-reference",
          captureRuntimeSessionId: input.captureRuntimeSessionId,
          ocrRuntimeSessionId: input.ocrRuntimeSessionId,
          providerReferenceId: input.preferredProviderReference ?? providerReferenceId,
        },
        configuration: {
          kind: "canonical-document-classification-configuration",
          preferredProviderReference: input.preferredProviderReference ?? providerReferenceId,
          contentTypeHint: input.contentType,
          languageHint: input.language,
          channel: "document-classification-runtime-classify",
          notes: "CLASS-01: classify via DocumentClassificationProviderPort (no AI).",
        },
        structuralNotes:
          "CLASS-01: Classification Runtime classify → DocumentClassificationProviderPort.classify().",
      },
      providerReferenceId,
      classificationProviderAdapterId: providerCaps.adapterId,
      createdAt: stamp,
      updatedAt: stamp,
      realClassificationExecuted: false,
    };
    this.store.setSession(session);

    try {
      session = { ...session, status: "processing", updatedAt: nowIso(this.now) };
      this.store.setSession(session);

      try {
        const orchestrator = this.enterpriseDeps.getOrchestratorPort?.();
        if (orchestrator) {
          const execution = await orchestrator.startExecution({
            correlationId: input.correlationId,
            tenantRef: input.tenantRef,
            channel: "document-classification-runtime-classify",
            intakeRef: sessionId,
            documentRef: documentId,
            tags: ["class-01", "document-classification-runtime", "classify"],
            customAttributes: {
              source: "document-classification-runtime-classify",
              requestId: input.requestId ?? null,
              providerId: classificationProvider.providerId,
              adapterId: providerCaps.adapterId,
              captureRuntimeSessionId: input.captureRuntimeSessionId ?? null,
              ocrRuntimeSessionId: input.ocrRuntimeSessionId ?? null,
            },
            structuralNotes:
              "CLASS-01: Classification execution coordinated via Runtime → ProviderPort.",
          });
          if (execution.ok) {
            session = {
              ...session,
              executionId: execution.context?.executionId,
              updatedAt: nowIso(this.now),
            };
            this.store.setSession(session);
          }
        }
      } catch {
        // Orchestrator best-effort — Classification Provider Port permanece obrigatório.
      }

      const processInput: DocumentClassificationProcessInput = {
        requestId: input.requestId,
        ocrText: input.ocrText,
        ocrStructuredData: input.ocrStructuredData,
        documentId,
        sessionId,
        contentType: input.contentType,
        language: input.language,
        signal: input.signal,
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
        rules: input.rules,
        attributes: {
          ...(input.attributes ?? {}),
          sessionId,
          documentId,
          tenantId: input.tenantRef ?? null,
          ocrRuntimeSessionId: input.ocrRuntimeSessionId ?? null,
          captureRuntimeSessionId: input.captureRuntimeSessionId ?? null,
        },
      };

      const providerResult = await classificationProvider.classify(processInput);

      session = {
        ...session,
        status: providerResult.ok ? "completed" : "failed",
        updatedAt: nowIso(this.now),
        message: providerResult.message,
        code: providerResult.code ?? (providerResult.ok ? "CLASSIFIED" : "CLASSIFICATION_FAILED"),
        realClassificationExecuted: true,
        documentType: providerResult.documentType,
        confidence: providerResult.confidence,
        matchedRules: providerResult.matchedRules,
        errors: providerResult.ok
          ? undefined
          : [providerResult.message ?? providerResult.code ?? "CLASSIFICATION_FAILED"],
      };
      this.store.setSession(session);

      return {
        kind: "canonical-document-classification-result",
        ok: providerResult.ok,
        runtimeSessionId,
        session,
        executionId: session.executionId,
        providerReferenceId,
        message: providerResult.message,
        code: session.code,
        realClassificationExecuted: true,
        documentType: providerResult.documentType,
        confidence: providerResult.confidence,
        matchedRules: providerResult.matchedRules,
        telemetry: providerResult.telemetry,
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
        realClassificationExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realClassificationExecuted: false,
      };
    }
  }

  async getSession(
    input: GetDocumentClassificationRuntimeSessionInput,
  ): Promise<GetDocumentClassificationRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListDocumentClassificationRuntimeSessionsInput = {},
  ): Promise<ListDocumentClassificationRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListDocumentClassificationProviderReferencesResult> {
    return { ok: true, references: STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES };
  }
}

function matchesList(
  session: CanonicalDocumentClassificationSession,
  input: ListDocumentClassificationRuntimeSessionsInput,
): boolean {
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
  if (
    input.ocrRuntimeSessionId != null &&
    session.request.reference?.ocrRuntimeSessionId !== input.ocrRuntimeSessionId
  ) {
    return false;
  }
  return true;
}

/** Alias oficial do adapter enterprise (F3-CAP-06). */
export const EnterpriseDocumentClassificationRuntimeAdapter =
  DefaultDocumentClassificationRuntimeAdapter;
