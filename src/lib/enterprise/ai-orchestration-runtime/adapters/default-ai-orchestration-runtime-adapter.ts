/**
 * DefaultAIOrchestrationRuntimeAdapter — F3-CAP-09.
 *
 * Adapter oficial do Enterprise AI Orchestration Runtime.
 * Responde estruturalmente (openJob/closeJob/submitRequest/registerTask/
 * getResult/stats) sem depender de Ports Enterprise.
 *
 * Sem IA real. Sem OpenAI. Sem Azure OpenAI. Sem Gemini. Sem Claude.
 * Sem Ollama. Sem Llama. Sem ML. Sem Prompt Engineering. Sem HTTP.
 * Sem agentes funcionais. Sem workflow. Sem decisão automática.
 */
import {
  DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalAICapabilities,
} from "../ports/capabilities";
import {
  AI_ORCHESTRATION_RUNTIME_IDENTITY,
  createAIExecutionResultId,
  createAIJobId,
  createAIOrchestrationRuntimeRequestId,
  createAIRequestId,
  createAITaskId,
} from "../ports/identity";
import type { AIOrchestrationRuntimePort } from "../ports/ai-orchestration-runtime-port";
import {
  createDisabledFutureAIProviderCatalog,
  type AIExecutionResult,
  type AIJob,
  type AIRequest,
  type AITask,
} from "../ports/canonical";
import type {
  AIOrchestrationRuntimeCapabilities,
  AIOrchestrationRuntimeEnterpriseDeps,
  AIOrchestrationRuntimeHealth,
  AIOrchestrationRuntimeInfo,
  AIOrchestrationRuntimeOperationalControls,
  AIOrchestrationRuntimeOperationEnvelope,
  AIOrchestrationRuntimeProviderId,
  AIOrchestrationRuntimeProviderMetadata,
  AIOrchestrationRuntimeStructuredLog,
  AIOrchestrationStatsInput,
  AIOrchestrationStatsResult,
  CloseAIOrchestrationJobInput,
  CloseAIOrchestrationJobResult,
  GetAIResultInput,
  GetAIResultResult,
  OpenAIOrchestrationJobInput,
  OpenAIOrchestrationJobResult,
  RegisterAITaskInput,
  RegisterAITaskResult,
  SubmitAIRequestInput,
  SubmitAIRequestResult,
} from "../ports/types";
import { InMemoryAIOrchestrationRuntimeStore, type AIOrchestrationRuntimeStore } from "../store";

export const DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID =
  "default-enterprise-ai-orchestration-runtime";
export const DEFAULT_AI_ORCHESTRATION_RUNTIME_VERSION = AI_ORCHESTRATION_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultAIOrchestrationRuntimeAdapterOptions = {
  provider?: Extract<AIOrchestrationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: AIOrchestrationRuntimeStore;
  enterpriseDeps?: AIOrchestrationRuntimeEnterpriseDeps;
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

function readSignal(input: AIOrchestrationRuntimeOperationalControls): AbortSignal | undefined {
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
    llmImplemented: false,
    agentExecutionImplemented: false,
    providerSelectionImplemented: false,
    promptExecutionImplemented: false,
    multiAgentImplemented: false,
    workflowOrchestrationImplemented: false,
    aiSupervisorImplemented: false,
    contextManagementImplemented: false,
    memoryImplemented: false,
    reasoningImplemented: false,
    decisionEngineImplemented: false,
  } as const;
}

/**
 * Adapter oficial F3-CAP-09 — AI Orchestration Runtime default / enterprise.
 */
export class DefaultAIOrchestrationRuntimeAdapter implements AIOrchestrationRuntimePort {
  readonly providerId: Extract<AIOrchestrationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: AIOrchestrationRuntimeProviderMetadata;
  private readonly store: AIOrchestrationRuntimeStore;
  private readonly enterpriseDeps: AIOrchestrationRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultAIOrchestrationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} AI Orchestration Runtime ready (structural only — no real AI).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default AI Orchestration Runtime"
          : AI_ORCHESTRATION_RUNTIME_IDENTITY.name,
      version: DEFAULT_AI_ORCHESTRATION_RUNTIME_VERSION,
      vendor: AI_ORCHESTRATION_RUNTIME_IDENTITY.vendor,
      layer: AI_ORCHESTRATION_RUNTIME_IDENTITY.layer,
      vendorAgnostic: AI_ORCHESTRATION_RUNTIME_IDENTITY.vendorAgnostic,
      description: AI_ORCHESTRATION_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryAIOrchestrationRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): AIOrchestrationRuntimeStore {
    return this.store;
  }

  capabilities(): AIOrchestrationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterTask: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalAIOrchestration: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      engine: { ...DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalAICapabilities(DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): AIOrchestrationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AI_ORCHESTRATION_RUNTIME",
      capabilities: { ...DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AIOrchestrationRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // F3-CAP-09 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
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
      storedTaskCount: this.store.taskCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "AI Orchestration Runtime pronto (estrutural F3-CAP-09 — sem IA real)."
          : "AI Orchestration Runtime degradado — ver Ports Enterprise."
        : "AI Orchestration Runtime unhealthy.",
    };
  }

  async openJob(input: OpenAIOrchestrationJobInput): Promise<OpenAIOrchestrationJobResult> {
    return this.runOperation("openJob", input, async () => {
      const stamp = nowIso(this.now);
      const jobId = input.jobId ?? createAIJobId();
      const existing = this.store.getJob(jobId);
      if (existing) {
        return {
          ok: false,
          code: "AI_ORCHESTRATION_RUNTIME_JOB_ALREADY_OPEN",
          message: "Canonical AIJob already open.",
          job: existing,
        };
      }
      const orchestrationContext = input.orchestrationContext ?? {
        kind: "canonical-ai-orchestration-context" as const,
        jobId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        futureProviders: createDisabledFutureAIProviderCatalog(),
      };
      const job: AIJob = {
        kind: "canonical-ai-job",
        jobId,
        status: "job-open",
        identity: {
          kind: "canonical-ai-identity",
          jobId,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        orchestrationContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
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
        code: "AI_ORCHESTRATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical AI Orchestration Runtime structural openJob (F3-CAP-09 foundation — no real AI).",
        orchestrationContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
      });
      return {
        ok: true,
        result,
        job,
        code: "AI_ORCHESTRATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeJob(input: CloseAIOrchestrationJobInput): Promise<CloseAIOrchestrationJobResult> {
    return this.runOperation("closeJob", input, async () => {
      const existing = this.store.getJob(input.jobId);
      if (!existing) {
        return {
          ok: false,
          code: "AI_ORCHESTRATION_RUNTIME_JOB_NOT_FOUND",
          message: "Canonical AIJob not found.",
        };
      }
      const stamp = nowIso(this.now);
      const job: AIJob = {
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
        code: "AI_ORCHESTRATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical AI Orchestration Runtime structural closeJob (F3-CAP-09 foundation — no real teardown).",
        orchestrationContext: job.orchestrationContext,
        classificationContext: job.classificationContext,
        extractionResult: job.extractionResult,
        validationResult: job.validationResult,
      });
      return {
        ok: true,
        result,
        job,
        code: "AI_ORCHESTRATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async submitRequest(input: SubmitAIRequestInput): Promise<SubmitAIRequestResult> {
    return this.runOperation("submitRequest", input, async () => {
      const stamp = nowIso(this.now);
      let job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      if (!job) {
        const jobId = input.jobId ?? createAIJobId();
        job = {
          kind: "canonical-ai-job",
          jobId,
          status: "job-open",
          classificationContext: input.classificationContext,
          extractionResult: input.extractionResult,
          validationResult: input.validationResult,
          orchestrationContext: input.orchestrationContext,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setJob(job);
      }
      const requestId = input.requestId ?? createAIRequestId();
      const orchestrationContext = input.orchestrationContext ??
        job.orchestrationContext ?? {
          kind: "canonical-ai-orchestration-context" as const,
          jobId: job.jobId,
          requestId,
          taskId: input.taskId,
          planId: input.planId,
          classificationContext: input.classificationContext ?? job.classificationContext,
          extractionResult: input.extractionResult ?? job.extractionResult,
          validationResult: input.validationResult ?? job.validationResult,
          futureProviders: createDisabledFutureAIProviderCatalog(),
        };
      const request: AIRequest = {
        kind: "canonical-ai-request",
        requestId,
        jobId: job.jobId,
        taskId: input.taskId,
        planId: input.planId,
        status: "submitted",
        metadata: input.metadata,
        orchestrationContext,
        classificationContext: input.classificationContext ?? job.classificationContext,
        extractionResult: input.extractionResult ?? job.extractionResult,
        validationResult: input.validationResult ?? job.validationResult,
        createdAt: stamp,
        updatedAt: stamp,
        llmImplemented: false,
        promptExecutionImplemented: false,
        agentExecutionImplemented: false,
        providerSelectionImplemented: false,
        memoryImplemented: false,
        reasoningImplemented: false,
        decisionEngineImplemented: false,
      };
      this.store.setRequest(request);
      const result = this.buildResult({
        operation: "submitRequest",
        status: "submitted",
        job,
        request,
        stamp,
        code: "AI_ORCHESTRATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical AI Orchestration Runtime structural submitRequest (F3-CAP-09 foundation — no LLM dispatch).",
        orchestrationContext,
        classificationContext: request.classificationContext,
        extractionResult: request.extractionResult,
        validationResult: request.validationResult,
      });
      return {
        ok: true,
        result,
        job,
        request,
        code: "AI_ORCHESTRATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async registerTask(input: RegisterAITaskInput): Promise<RegisterAITaskResult> {
    return this.runOperation("registerTask", input, async () => {
      const stamp = nowIso(this.now);
      const taskId = input.taskId ?? createAITaskId();
      const orchestrationContext = input.orchestrationContext ?? {
        kind: "canonical-ai-orchestration-context" as const,
        jobId: input.jobId,
        requestId: input.requestId,
        taskId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        futureProviders: createDisabledFutureAIProviderCatalog(),
      };
      const task: AITask = {
        kind: "canonical-ai-task",
        taskId,
        jobId: input.jobId,
        requestId: input.requestId,
        status: "registered",
        agentKind: input.agentKind,
        metadata: input.metadata,
        orchestrationContext,
        createdAt: stamp,
        updatedAt: stamp,
        agentExecutionImplemented: false,
        llmImplemented: false,
        promptExecutionImplemented: false,
        reasoningImplemented: false,
        decisionEngineImplemented: false,
      };
      this.store.setTask(task);
      const result = this.buildResult({
        operation: "registerTask",
        status: "registered",
        task,
        stamp,
        code: "AI_ORCHESTRATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical AI Orchestration Runtime structural registerTask (F3-CAP-09 foundation — no agent execution).",
        orchestrationContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
      });
      return {
        ok: true,
        result,
        task,
        code: "AI_ORCHESTRATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetAIResultInput): Promise<GetAIResultResult> {
    return this.runOperation("getResult", input, async () => {
      const job = input.jobId ? this.store.getJob(input.jobId) : undefined;
      const request = input.requestId ? this.store.getRequest(input.requestId) : undefined;
      const task = input.taskId ? this.store.getTask(input.taskId) : undefined;
      if (!job && !request && !task) {
        return {
          ok: false,
          code: "AI_ORCHESTRATION_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical AI job/request/task not found.",
        };
      }
      const stamp = nowIso(this.now);
      const orchestrationContext =
        request?.orchestrationContext ?? job?.orchestrationContext ?? task?.orchestrationContext;
      const classificationContext = request?.classificationContext ?? job?.classificationContext;
      const extractionResult = request?.extractionResult ?? job?.extractionResult;
      const validationResult = request?.validationResult ?? job?.validationResult;
      const result = this.buildResult({
        operation: "getResult",
        status: request?.status ?? job?.status ?? task?.status ?? "processed",
        job,
        request,
        task,
        stamp,
        code: "AI_ORCHESTRATION_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical AI Orchestration Runtime structural getResult (F3-CAP-09 foundation — no real AI).",
        orchestrationContext,
        classificationContext,
        extractionResult,
        validationResult,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        job,
        request,
        task,
        code: "AI_ORCHESTRATION_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: AIOrchestrationStatsInput = {}): Promise<AIOrchestrationStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "AI_ORCHESTRATION_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical AI Orchestration Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "AI_ORCHESTRATION_RUNTIME_OK",
        message: `AI Orchestration Runtime stats: ${statistics.totalJobs} jobs, ${statistics.totalRequests} requests, ${statistics.totalTasks} tasks.`,
      };
    });
  }

  private buildResult(args: {
    operation: AIExecutionResult["operation"];
    status: AIExecutionResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    job?: AIJob;
    request?: AIRequest;
    task?: AITask;
    orchestrationContext?: AIExecutionResult["orchestrationContext"];
    classificationContext?: AIExecutionResult["classificationContext"];
    extractionResult?: AIExecutionResult["extractionResult"];
    validationResult?: AIExecutionResult["validationResult"];
  }): AIExecutionResult {
    return {
      kind: "canonical-ai-execution-result",
      ok: true,
      resultId: createAIExecutionResultId(),
      operation: args.operation,
      job: args.job,
      request: args.request,
      task: args.task,
      provider: {
        kind: "canonical-ai-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
        enabled: false,
        connected: false,
        llmImplemented: false,
        httpImplemented: false,
      },
      orchestrationContext: args.orchestrationContext,
      classificationContext: args.classificationContext,
      extractionResult: args.extractionResult,
      validationResult: args.validationResult,
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
    input: AIOrchestrationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & AIOrchestrationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createAIOrchestrationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: AIOrchestrationRuntimeStructuredLog[] = [];
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
            code: "AI_ORCHESTRATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & AIOrchestrationRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "AI_ORCHESTRATION_RUNTIME_RETRY",
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
              reject(new Error("AI Orchestration Runtime operation timed out."));
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
        code: "AI_ORCHESTRATION_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error
            ? lastError.message
            : "AI Orchestration Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AIOrchestrationRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "AI Orchestration Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "AI_ORCHESTRATION_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AIOrchestrationRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (F3-CAP-09). */
export const EnterpriseAIOrchestrationRuntimeAdapter = DefaultAIOrchestrationRuntimeAdapter;
