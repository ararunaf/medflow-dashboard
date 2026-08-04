/**
 * DefaultQualityRuntimeAdapter — F3-CAP-13.
 *
 * Adapter oficial do Enterprise Quality Runtime.
 * Responde estruturalmente (prepareQualityAssessment/getResult/stats) sem
 * depender de Ports Enterprise.
 *
 * Sem avaliação automática. Sem score funcional. Sem decisão automática.
 * Sem IA. Sem banco. Sem persistência.
 */
import {
  DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
  toQualityCapabilities,
} from "../ports/capabilities";
import {
  QUALITY_RUNTIME_IDENTITY,
  createQualityAssessmentId,
  createQualityResultId,
  createQualityRuntimeRequestId,
} from "../ports/identity";
import type { QualityRuntimePort } from "../ports/quality-runtime-port";
import type { QualityAssessment, QualityResult } from "../ports/canonical";
import {
  STRUCTURAL_QUALITY_METRIC_KINDS,
  createDisabledQualityDecision,
  createDisabledQualityMetric,
  createDisabledQualityScore,
} from "../ports/canonical";
import type {
  QualityRuntimeCapabilities,
  QualityRuntimeEnterpriseDeps,
  QualityRuntimeHealth,
  QualityRuntimeInfo,
  QualityRuntimeOperationalControls,
  QualityRuntimeOperationEnvelope,
  QualityRuntimeProviderId,
  QualityRuntimeProviderMetadata,
  QualityRuntimeStructuredLog,
  QualityStatsInput,
  QualityStatsResult,
  GetQualityResultInput,
  GetQualityResultResult,
  PrepareQualityAssessmentInput,
  PrepareQualityAssessmentResult,
} from "../ports/types";
import { InMemoryQualityRuntimeStore, type QualityRuntimeStore } from "../store";

export const DEFAULT_QUALITY_RUNTIME_ADAPTER_ID = "default-enterprise-quality-runtime";
export const DEFAULT_QUALITY_RUNTIME_VERSION = QUALITY_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultQualityRuntimeAdapterOptions = {
  provider?: Extract<QualityRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: QualityRuntimeStore;
  enterpriseDeps?: QualityRuntimeEnterpriseDeps;
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

function readSignal(input: QualityRuntimeOperationalControls): AbortSignal | undefined {
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
    qualityEngineImplemented: false,
    qualityScoreImplemented: false,
    ocrQualityImplemented: false,
    classificationQualityImplemented: false,
    extractionQualityImplemented: false,
    validationQualityImplemented: false,
    mappingQualityImplemented: false,
    autoFillQualityImplemented: false,
    auditQualityImplemented: false,
    approvalDecisionImplemented: false,
  } as const;
}

/**
 * Adapter oficial F3-CAP-13 — Quality Runtime default / enterprise.
 */
export class DefaultQualityRuntimeAdapter implements QualityRuntimePort {
  readonly providerId: Extract<QualityRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: QualityRuntimeProviderMetadata;
  private readonly store: QualityRuntimeStore;
  private readonly enterpriseDeps: QualityRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultQualityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Quality Runtime ready (structural only — no functional quality assessment).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default Quality Runtime" : QUALITY_RUNTIME_IDENTITY.name,
      version: DEFAULT_QUALITY_RUNTIME_VERSION,
      vendor: QUALITY_RUNTIME_IDENTITY.vendor,
      layer: QUALITY_RUNTIME_IDENTITY.layer,
      vendorAgnostic: QUALITY_RUNTIME_IDENTITY.vendorAgnostic,
      description: QUALITY_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryQualityRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): QualityRuntimeStore {
    return this.store;
  }

  capabilities(): QualityRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_QUALITY_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareQualityAssessment: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalQuality: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesAIOrchestrationRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      engine: { ...DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toQualityCapabilities(DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): QualityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "QUALITY_RUNTIME",
      capabilities: { ...DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<QualityRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // F3-CAP-13 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
    let autoFillRuntimeOk = true;
    let tissMappingRuntimeOk = true;
    let auditRuntimeOk = true;
    let validationRuntimeOk = true;
    let documentExtractionRuntimeOk = true;
    let documentClassificationRuntimeOk = true;
    let ocrRuntimeOk = true;
    let aiOrchestrationRuntimeOk = true;
    let intelligentCaptureRuntimeOk = true;
    let scannerRuntimeOk = true;
    let watchFolderRuntimeOk = true;
    let uploadRuntimeOk = true;

    if (typeof this.enterpriseDeps.getAutoFillRuntimePort === "function") {
      autoFillRuntimeOk = portShapeOk(this.enterpriseDeps.getAutoFillRuntimePort());
    }
    if (typeof this.enterpriseDeps.getTISSMappingRuntimePort === "function") {
      tissMappingRuntimeOk = portShapeOk(this.enterpriseDeps.getTISSMappingRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuditRuntimePort === "function") {
      auditRuntimeOk = portShapeOk(this.enterpriseDeps.getAuditRuntimePort());
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
    if (typeof this.enterpriseDeps.getAIOrchestrationRuntimePort === "function") {
      aiOrchestrationRuntimeOk = portShapeOk(this.enterpriseDeps.getAIOrchestrationRuntimePort());
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

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      autoFillRuntimeOk &&
      tissMappingRuntimeOk &&
      auditRuntimeOk &&
      validationRuntimeOk &&
      documentExtractionRuntimeOk &&
      documentClassificationRuntimeOk &&
      ocrRuntimeOk &&
      aiOrchestrationRuntimeOk &&
      intelligentCaptureRuntimeOk &&
      scannerRuntimeOk &&
      watchFolderRuntimeOk &&
      uploadRuntimeOk;

    return {
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      autoFillRuntimeOk,
      tissMappingRuntimeOk,
      auditRuntimeOk,
      validationRuntimeOk,
      documentExtractionRuntimeOk,
      documentClassificationRuntimeOk,
      ocrRuntimeOk,
      aiOrchestrationRuntimeOk,
      intelligentCaptureRuntimeOk,
      scannerRuntimeOk,
      watchFolderRuntimeOk,
      uploadRuntimeOk,
      storedAssessmentCount: this.store.assessmentCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Quality Runtime pronto (estrutural F3-CAP-13 — sem avaliação automática)."
          : "Quality Runtime degradado — ver Ports Enterprise."
        : "Quality Runtime unhealthy.",
    };
  }

  async prepareQualityAssessment(
    input: PrepareQualityAssessmentInput,
  ): Promise<PrepareQualityAssessmentResult> {
    return this.runOperation("prepareQualityAssessment", input, async () => {
      const stamp = nowIso(this.now);
      const assessmentId = input.assessmentId ?? createQualityAssessmentId();
      const existing = this.store.getAssessment(assessmentId);
      if (existing) {
        return {
          ok: false,
          code: "QUALITY_RUNTIME_ASSESSMENT_ALREADY_PREPARED",
          message: "Quality assessment already prepared.",
          assessment: existing,
        };
      }
      const qualityContext = input.qualityContext ?? {
        kind: "canonical-quality-context" as const,
        assessmentId,
        ocrResult: input.ocrResult,
        classificationResult: input.classificationResult,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        mappingResult: input.mappingResult,
        autoFillResult: input.autoFillResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      };
      const metrics =
        input.metrics ??
        STRUCTURAL_QUALITY_METRIC_KINDS.map((metricKind) =>
          createDisabledQualityMetric(metricKind, metricKind),
        );
      const score = input.score ?? createDisabledQualityScore();
      const decision = input.decision ?? createDisabledQualityDecision();
      const assessment: QualityAssessment = {
        kind: "canonical-quality-assessment",
        assessmentId,
        status: "prepared",
        qualityContext,
        metrics,
        score,
        decision,
        issues: [],
        ocrResult: input.ocrResult,
        classificationResult: input.classificationResult,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        mappingResult: input.mappingResult,
        autoFillResult: input.autoFillResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setAssessment(assessment);
      const result = this.buildResult({
        operation: "prepareQualityAssessment",
        status: "prepared",
        assessment,
        stamp,
        code: "QUALITY_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Quality Runtime structural prepareQualityAssessment (F3-CAP-13 foundation — no functional quality assessment).",
        qualityContext,
        metrics,
        score,
        decision,
        ocrResult: input.ocrResult,
        classificationResult: input.classificationResult,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        mappingResult: input.mappingResult,
        autoFillResult: input.autoFillResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        assessment,
        code: "QUALITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetQualityResultInput): Promise<GetQualityResultResult> {
    return this.runOperation("getResult", input, async () => {
      const assessment = input.assessmentId
        ? this.store.getAssessment(input.assessmentId)
        : undefined;
      const storedResult = input.resultId ? this.store.getResult(input.resultId) : undefined;
      if (!assessment && !storedResult) {
        return {
          ok: false,
          code: "QUALITY_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Quality assessment/result not found.",
        };
      }
      const stamp = nowIso(this.now);
      const result =
        storedResult ??
        this.buildResult({
          operation: "getResult",
          status: assessment?.status ?? "processed",
          assessment,
          stamp,
          code: "QUALITY_RUNTIME_STRUCTURAL_OK",
          messageText:
            "Canonical Quality Runtime structural getResult (F3-CAP-13 foundation — no functional quality assessment).",
          qualityContext: assessment?.qualityContext,
          metrics: assessment?.metrics,
          score: assessment?.score,
          decision: assessment?.decision,
          ocrResult: assessment?.ocrResult,
          classificationResult: assessment?.classificationResult,
          extractionResult: assessment?.extractionResult,
          validationResult: assessment?.validationResult,
          mappingResult: assessment?.mappingResult,
          autoFillResult: assessment?.autoFillResult,
          auditResult: assessment?.auditResult,
          aiOrchestrationContext: assessment?.aiOrchestrationContext,
        });
      if (!storedResult) {
        this.store.setResult(result);
      }
      return {
        ok: true,
        result,
        assessment: assessment ?? storedResult?.assessment,
        code: "QUALITY_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: QualityStatsInput = {}): Promise<QualityStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "QUALITY_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Quality Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "QUALITY_RUNTIME_OK",
        message: `Quality Runtime stats: ${statistics.totalAssessments} assessments, ${statistics.totalResults} results.`,
      };
    });
  }

  private buildResult(args: {
    operation: QualityResult["operation"];
    status: QualityResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    assessment?: QualityAssessment;
    qualityContext?: QualityResult["qualityContext"];
    metrics?: QualityResult["metrics"];
    score?: QualityResult["score"];
    decision?: QualityResult["decision"];
    ocrResult?: QualityResult["ocrResult"];
    classificationResult?: QualityResult["classificationResult"];
    extractionResult?: QualityResult["extractionResult"];
    validationResult?: QualityResult["validationResult"];
    mappingResult?: QualityResult["mappingResult"];
    autoFillResult?: QualityResult["autoFillResult"];
    auditResult?: QualityResult["auditResult"];
    aiOrchestrationContext?: QualityResult["aiOrchestrationContext"];
  }): QualityResult {
    return {
      kind: "canonical-quality-result",
      ok: true,
      resultId: createQualityResultId(),
      operation: args.operation,
      assessment: args.assessment,
      metrics: args.metrics,
      score: args.score,
      decision: args.decision,
      qualityContext: args.qualityContext,
      ocrResult: args.ocrResult,
      classificationResult: args.classificationResult,
      extractionResult: args.extractionResult,
      validationResult: args.validationResult,
      mappingResult: args.mappingResult,
      autoFillResult: args.autoFillResult,
      auditResult: args.auditResult,
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
    input: QualityRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & QualityRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createQualityRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: QualityRuntimeStructuredLog[] = [];
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
            code: "QUALITY_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & QualityRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "QUALITY_RUNTIME_RETRY",
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
              reject(new Error("Quality Runtime operation timed out."));
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
        code: "QUALITY_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Quality Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & QualityRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Quality Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "QUALITY_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & QualityRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (F3-CAP-13). */
export const EnterpriseQualityRuntimeAdapter = DefaultQualityRuntimeAdapter;
