/**
 * DefaultTISSMappingRuntimeAdapter — F3-CAP-11.
 *
 * Adapter oficial do Enterprise TISS Mapping Runtime.
 * Responde estruturalmente (prepareMapping/getResult/stats) sem depender
 * de Ports Enterprise.
 *
 * Sem mapeamento funcional. Sem operadoras. Sem XML. Sem preenchimento
 * automático. Sem IA. Sem banco. Sem persistência.
 */
import {
  DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalMappingCapabilities,
} from "../ports/capabilities";
import {
  TISS_MAPPING_RUNTIME_IDENTITY,
  createCanonicalGuideId,
  createCanonicalMappingId,
  createCanonicalMappingResultId,
  createTISSMappingRuntimeRequestId,
} from "../ports/identity";
import type { TISSMappingRuntimePort } from "../ports/tiss-mapping-runtime-port";
import type { CanonicalGuide, CanonicalMapping, CanonicalMappingResult } from "../ports/canonical";
import type {
  GetTISSMappingResultInput,
  GetTISSMappingResultResult,
  PrepareTISSMappingInput,
  PrepareTISSMappingResult,
  TISSMappingRuntimeCapabilities,
  TISSMappingRuntimeEnterpriseDeps,
  TISSMappingRuntimeHealth,
  TISSMappingRuntimeInfo,
  TISSMappingRuntimeOperationalControls,
  TISSMappingRuntimeOperationEnvelope,
  TISSMappingRuntimeProviderId,
  TISSMappingRuntimeProviderMetadata,
  TISSMappingRuntimeStructuredLog,
  TISSMappingStatsInput,
  TISSMappingStatsResult,
} from "../ports/types";
import { InMemoryTISSMappingRuntimeStore, type TISSMappingRuntimeStore } from "../store";

export const DEFAULT_TISS_MAPPING_RUNTIME_ADAPTER_ID = "default-enterprise-tiss-mapping-runtime";
export const DEFAULT_TISS_MAPPING_RUNTIME_VERSION = TISS_MAPPING_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultTISSMappingRuntimeAdapterOptions = {
  provider?: Extract<TISSMappingRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: TISSMappingRuntimeStore;
  enterpriseDeps?: TISSMappingRuntimeEnterpriseDeps;
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

function readSignal(input: TISSMappingRuntimeOperationalControls): AbortSignal | undefined {
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
    mappingEngineImplemented: false,
    operatorMappingImplemented: false,
    templateMappingImplemented: false,
    canonicalModelImplemented: false,
    guideTransformationImplemented: false,
    fieldNormalizationImplemented: false,
    tissVersionMappingImplemented: false,
    layoutMappingImplemented: false,
    xmlMappingImplemented: false,
    autoFillPreparationImplemented: false,
  } as const;
}

/**
 * Adapter oficial F3-CAP-11 — TISS Mapping Runtime default / enterprise.
 */
export class DefaultTISSMappingRuntimeAdapter implements TISSMappingRuntimePort {
  readonly providerId: Extract<TISSMappingRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: TISSMappingRuntimeProviderMetadata;
  private readonly store: TISSMappingRuntimeStore;
  private readonly enterpriseDeps: TISSMappingRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultTISSMappingRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} TISS Mapping Runtime ready (structural only — no functional mapping).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default TISS Mapping Runtime"
          : TISS_MAPPING_RUNTIME_IDENTITY.name,
      version: DEFAULT_TISS_MAPPING_RUNTIME_VERSION,
      vendor: TISS_MAPPING_RUNTIME_IDENTITY.vendor,
      layer: TISS_MAPPING_RUNTIME_IDENTITY.layer,
      vendorAgnostic: TISS_MAPPING_RUNTIME_IDENTITY.vendorAgnostic,
      description: TISS_MAPPING_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryTISSMappingRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): TISSMappingRuntimeStore {
    return this.store;
  }

  capabilities(): TISSMappingRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_TISS_MAPPING_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareMapping: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalMapping: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAIOrchestrationRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      engine: { ...DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalMappingCapabilities(DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): TISSMappingRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TISS_MAPPING_RUNTIME",
      capabilities: { ...DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<TISSMappingRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // F3-CAP-11 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
    let aiOrchestrationRuntimeOk = true;
    let auditRuntimeOk = true;
    let validationRuntimeOk = true;
    let documentExtractionRuntimeOk = true;
    let documentClassificationRuntimeOk = true;
    let ocrRuntimeOk = true;
    let intelligentCaptureRuntimeOk = true;
    let scannerRuntimeOk = true;
    let watchFolderRuntimeOk = true;
    let uploadRuntimeOk = true;

    if (typeof this.enterpriseDeps.getAIOrchestrationRuntimePort === "function") {
      aiOrchestrationRuntimeOk = portShapeOk(this.enterpriseDeps.getAIOrchestrationRuntimePort());
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
      aiOrchestrationRuntimeOk &&
      auditRuntimeOk &&
      validationRuntimeOk &&
      documentExtractionRuntimeOk &&
      documentClassificationRuntimeOk &&
      ocrRuntimeOk &&
      intelligentCaptureRuntimeOk &&
      scannerRuntimeOk &&
      watchFolderRuntimeOk &&
      uploadRuntimeOk;

    return {
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      aiOrchestrationRuntimeOk,
      auditRuntimeOk,
      validationRuntimeOk,
      documentExtractionRuntimeOk,
      documentClassificationRuntimeOk,
      ocrRuntimeOk,
      intelligentCaptureRuntimeOk,
      scannerRuntimeOk,
      watchFolderRuntimeOk,
      uploadRuntimeOk,
      storedMappingCount: this.store.mappingCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "TISS Mapping Runtime pronto (estrutural F3-CAP-11 — sem mapeamento funcional)."
          : "TISS Mapping Runtime degradado — ver Ports Enterprise."
        : "TISS Mapping Runtime unhealthy.",
    };
  }

  async prepareMapping(input: PrepareTISSMappingInput): Promise<PrepareTISSMappingResult> {
    return this.runOperation("prepareMapping", input, async () => {
      const stamp = nowIso(this.now);
      const mappingId = input.mappingId ?? createCanonicalMappingId();
      const existing = this.store.getMapping(mappingId);
      if (existing) {
        return {
          ok: false,
          code: "TISS_MAPPING_RUNTIME_MAPPING_ALREADY_PREPARED",
          message: "Canonical Mapping already prepared.",
          mapping: existing,
        };
      }
      const mappingContext = input.mappingContext ?? {
        kind: "canonical-tiss-mapping-context" as const,
        mappingId,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
        guideType: input.guideType,
        tissVersion: input.tissVersion,
        operator: input.operator,
      };
      const guide: CanonicalGuide | undefined =
        input.guide ??
        (input.guideType
          ? {
              kind: "canonical-tiss-guide",
              guideId: createCanonicalGuideId(),
              guideType: input.guideType,
              tissVersion: input.tissVersion,
              operator: input.operator,
              status: "prepared",
              ...structuralFlags(),
            }
          : undefined);
      const mapping: CanonicalMapping = {
        kind: "canonical-tiss-mapping",
        mappingId,
        status: "prepared",
        guide,
        guideType: input.guideType ?? guide?.guideType,
        tissVersion: input.tissVersion,
        operator: input.operator,
        mappingContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setMapping(mapping);
      const result = this.buildResult({
        operation: "prepareMapping",
        status: "prepared",
        mapping,
        guide,
        stamp,
        code: "TISS_MAPPING_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical TISS Mapping Runtime structural prepareMapping (F3-CAP-11 foundation — no functional mapping).",
        mappingContext,
        classificationContext: input.classificationContext,
        extractionResult: input.extractionResult,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        mapping,
        code: "TISS_MAPPING_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetTISSMappingResultInput): Promise<GetTISSMappingResultResult> {
    return this.runOperation("getResult", input, async () => {
      const mapping = input.mappingId ? this.store.getMapping(input.mappingId) : undefined;
      const storedResult = input.resultId ? this.store.getResult(input.resultId) : undefined;
      if (!mapping && !storedResult) {
        return {
          ok: false,
          code: "TISS_MAPPING_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical TISS Mapping mapping/result not found.",
        };
      }
      const stamp = nowIso(this.now);
      const result =
        storedResult ??
        this.buildResult({
          operation: "getResult",
          status: mapping?.status ?? "processed",
          mapping,
          guide: mapping?.guide,
          stamp,
          code: "TISS_MAPPING_RUNTIME_STRUCTURAL_OK",
          messageText:
            "Canonical TISS Mapping Runtime structural getResult (F3-CAP-11 foundation — no functional mapping).",
          mappingContext: mapping?.mappingContext,
          classificationContext: mapping?.classificationContext,
          extractionResult: mapping?.extractionResult,
          validationResult: mapping?.validationResult,
          auditResult: mapping?.auditResult,
          aiOrchestrationContext: mapping?.aiOrchestrationContext,
        });
      if (!storedResult) {
        this.store.setResult(result);
      }
      return {
        ok: true,
        result,
        mapping: mapping ?? storedResult?.mapping,
        code: "TISS_MAPPING_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: TISSMappingStatsInput = {}): Promise<TISSMappingStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "TISS_MAPPING_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical TISS Mapping Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "TISS_MAPPING_RUNTIME_OK",
        message: `TISS Mapping Runtime stats: ${statistics.totalMappings} mappings, ${statistics.totalResults} results.`,
      };
    });
  }

  private buildResult(args: {
    operation: CanonicalMappingResult["operation"];
    status: CanonicalMappingResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    mapping?: CanonicalMapping;
    guide?: CanonicalGuide;
    mappingContext?: CanonicalMappingResult["mappingContext"];
    classificationContext?: CanonicalMappingResult["classificationContext"];
    extractionResult?: CanonicalMappingResult["extractionResult"];
    validationResult?: CanonicalMappingResult["validationResult"];
    auditResult?: CanonicalMappingResult["auditResult"];
    aiOrchestrationContext?: CanonicalMappingResult["aiOrchestrationContext"];
  }): CanonicalMappingResult {
    return {
      kind: "canonical-tiss-mapping-result",
      ok: true,
      resultId: createCanonicalMappingResultId(),
      operation: args.operation,
      mapping: args.mapping,
      guide: args.guide,
      mappingContext: args.mappingContext,
      classificationContext: args.classificationContext,
      extractionResult: args.extractionResult,
      validationResult: args.validationResult,
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
    input: TISSMappingRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & TISSMappingRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createTISSMappingRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: TISSMappingRuntimeStructuredLog[] = [];
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
            code: "TISS_MAPPING_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & TISSMappingRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "TISS_MAPPING_RUNTIME_RETRY",
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
              reject(new Error("TISS Mapping Runtime operation timed out."));
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
        code: "TISS_MAPPING_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error
            ? lastError.message
            : "TISS Mapping Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & TISSMappingRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "TISS Mapping Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "TISS_MAPPING_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & TISSMappingRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (F3-CAP-11). */
export const EnterpriseTISSMappingRuntimeAdapter = DefaultTISSMappingRuntimeAdapter;
