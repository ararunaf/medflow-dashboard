/**
 * DefaultAutoFillRuntimeAdapter — F3-CAP-12.
 *
 * Adapter oficial do Enterprise Auto-Fill Runtime.
 * Responde estruturalmente (prepareAutoFill/getResult/stats) sem depender
 * de Ports Enterprise.
 *
 * Sem preenchimento automático. Sem geração de XML. Sem escrita em guias.
 * Sem integração com operadoras. Sem IA. Sem banco. Sem persistência.
 */
import {
  DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
  toAutoFillCapabilities,
} from "../ports/capabilities";
import {
  AUTO_FILL_RUNTIME_IDENTITY,
  createAutoFillGuideId,
  createAutoFillId,
  createAutoFillResultId,
  createAutoFillRuntimeRequestId,
} from "../ports/identity";
import type { AutoFillRuntimePort } from "../ports/auto-fill-runtime-port";
import type { AutoFillGuide, AutoFillResult, AutoFillSession } from "../ports/canonical";
import type {
  AutoFillRuntimeCapabilities,
  AutoFillRuntimeEnterpriseDeps,
  AutoFillRuntimeHealth,
  AutoFillRuntimeInfo,
  AutoFillRuntimeOperationalControls,
  AutoFillRuntimeOperationEnvelope,
  AutoFillRuntimeProviderId,
  AutoFillRuntimeProviderMetadata,
  AutoFillRuntimeStructuredLog,
  AutoFillStatsInput,
  AutoFillStatsResult,
  GetAutoFillResultInput,
  GetAutoFillResultResult,
  PrepareAutoFillInput,
  PrepareAutoFillResult,
} from "../ports/types";
import { InMemoryAutoFillRuntimeStore, type AutoFillRuntimeStore } from "../store";

export const DEFAULT_AUTO_FILL_RUNTIME_ADAPTER_ID = "default-enterprise-auto-fill-runtime";
export const DEFAULT_AUTO_FILL_RUNTIME_VERSION = AUTO_FILL_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultAutoFillRuntimeAdapterOptions = {
  provider?: Extract<AutoFillRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: AutoFillRuntimeStore;
  enterpriseDeps?: AutoFillRuntimeEnterpriseDeps;
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

function readSignal(input: AutoFillRuntimeOperationalControls): AbortSignal | undefined {
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
    autoFillEngineImplemented: false,
    guideGenerationImplemented: false,
    fieldPopulationImplemented: false,
    templatePopulationImplemented: false,
    operatorPopulationImplemented: false,
    xmlPopulationImplemented: false,
    validationIntegrationImplemented: false,
    auditIntegrationImplemented: false,
    qualityIntegrationImplemented: false,
    automaticCompletionImplemented: false,
  } as const;
}

/**
 * Adapter oficial F3-CAP-12 — Auto-Fill Runtime default / enterprise.
 */
export class DefaultAutoFillRuntimeAdapter implements AutoFillRuntimePort {
  readonly providerId: Extract<AutoFillRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: AutoFillRuntimeProviderMetadata;
  private readonly store: AutoFillRuntimeStore;
  private readonly enterpriseDeps: AutoFillRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultAutoFillRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Auto-Fill Runtime ready (structural only — no functional auto-fill).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Auto-Fill Runtime"
          : AUTO_FILL_RUNTIME_IDENTITY.name,
      version: DEFAULT_AUTO_FILL_RUNTIME_VERSION,
      vendor: AUTO_FILL_RUNTIME_IDENTITY.vendor,
      layer: AUTO_FILL_RUNTIME_IDENTITY.layer,
      vendorAgnostic: AUTO_FILL_RUNTIME_IDENTITY.vendorAgnostic,
      description: AUTO_FILL_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryAutoFillRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): AutoFillRuntimeStore {
    return this.store;
  }

  capabilities(): AutoFillRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_AUTO_FILL_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareAutoFill: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalAutoFill: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      engine: { ...DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toAutoFillCapabilities(DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): AutoFillRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUTO_FILL_RUNTIME",
      capabilities: { ...DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AutoFillRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // F3-CAP-12 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
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
      storedSessionCount: this.store.sessionCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Auto-Fill Runtime pronto (estrutural F3-CAP-12 — sem preenchimento automático)."
          : "Auto-Fill Runtime degradado — ver Ports Enterprise."
        : "Auto-Fill Runtime unhealthy.",
    };
  }

  async prepareAutoFill(input: PrepareAutoFillInput): Promise<PrepareAutoFillResult> {
    return this.runOperation("prepareAutoFill", input, async () => {
      const stamp = nowIso(this.now);
      const autoFillId = input.autoFillId ?? createAutoFillId();
      const existing = this.store.getSession(autoFillId);
      if (existing) {
        return {
          ok: false,
          code: "AUTO_FILL_RUNTIME_SESSION_ALREADY_PREPARED",
          message: "Auto-Fill session already prepared.",
          session: existing,
        };
      }
      const autoFillContext = input.autoFillContext ?? {
        kind: "canonical-auto-fill-context" as const,
        autoFillId,
        canonicalGuide: input.canonicalGuide,
        mappingResult: input.mappingResult,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
        guideType: input.guideType,
        operator: input.operator,
      };
      const guide: AutoFillGuide | undefined =
        input.guide ??
        (input.guideType
          ? {
              kind: "canonical-auto-fill-guide",
              guideId: createAutoFillGuideId(),
              guideType: input.guideType,
              operator:
                input.operator?.kind === "canonical-tiss-operator" ? input.operator : undefined,
              canonicalGuide: input.canonicalGuide,
              status: "prepared",
              ...structuralFlags(),
            }
          : undefined);
      const session: AutoFillSession = {
        kind: "canonical-auto-fill-session",
        autoFillId,
        status: "prepared",
        guide,
        guideType: input.guideType ?? guide?.guideType,
        operator: input.operator,
        autoFillContext,
        canonicalGuide: input.canonicalGuide,
        mappingResult: input.mappingResult,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setSession(session);
      const result = this.buildResult({
        operation: "prepareAutoFill",
        status: "prepared",
        session,
        guide,
        stamp,
        code: "AUTO_FILL_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Auto-Fill Runtime structural prepareAutoFill (F3-CAP-12 foundation — no functional auto-fill).",
        autoFillContext,
        canonicalGuide: input.canonicalGuide,
        mappingResult: input.mappingResult,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        session,
        code: "AUTO_FILL_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetAutoFillResultInput): Promise<GetAutoFillResultResult> {
    return this.runOperation("getResult", input, async () => {
      const session = input.autoFillId ? this.store.getSession(input.autoFillId) : undefined;
      const storedResult = input.resultId ? this.store.getResult(input.resultId) : undefined;
      if (!session && !storedResult) {
        return {
          ok: false,
          code: "AUTO_FILL_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical Auto-Fill session/result not found.",
        };
      }
      const stamp = nowIso(this.now);
      const result =
        storedResult ??
        this.buildResult({
          operation: "getResult",
          status: session?.status ?? "processed",
          session,
          guide: session?.guide,
          stamp,
          code: "AUTO_FILL_RUNTIME_STRUCTURAL_OK",
          messageText:
            "Canonical Auto-Fill Runtime structural getResult (F3-CAP-12 foundation — no functional auto-fill).",
          autoFillContext: session?.autoFillContext,
          canonicalGuide: session?.canonicalGuide,
          mappingResult: session?.mappingResult,
          validationResult: session?.validationResult,
          auditResult: session?.auditResult,
          aiOrchestrationContext: session?.aiOrchestrationContext,
        });
      if (!storedResult) {
        this.store.setResult(result);
      }
      return {
        ok: true,
        result,
        session: session ?? storedResult?.session,
        code: "AUTO_FILL_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: AutoFillStatsInput = {}): Promise<AutoFillStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "AUTO_FILL_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Auto-Fill Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "AUTO_FILL_RUNTIME_OK",
        message: `Auto-Fill Runtime stats: ${statistics.totalSessions} sessions, ${statistics.totalResults} results.`,
      };
    });
  }

  private buildResult(args: {
    operation: AutoFillResult["operation"];
    status: AutoFillResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    session?: AutoFillSession;
    guide?: AutoFillGuide;
    autoFillContext?: AutoFillResult["autoFillContext"];
    canonicalGuide?: AutoFillResult["canonicalGuide"];
    mappingResult?: AutoFillResult["mappingResult"];
    validationResult?: AutoFillResult["validationResult"];
    auditResult?: AutoFillResult["auditResult"];
    aiOrchestrationContext?: AutoFillResult["aiOrchestrationContext"];
  }): AutoFillResult {
    return {
      kind: "canonical-auto-fill-result",
      ok: true,
      resultId: createAutoFillResultId(),
      operation: args.operation,
      session: args.session,
      guide: args.guide,
      autoFillContext: args.autoFillContext,
      canonicalGuide: args.canonicalGuide,
      mappingResult: args.mappingResult,
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
    input: AutoFillRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & AutoFillRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createAutoFillRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: AutoFillRuntimeStructuredLog[] = [];
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
            code: "AUTO_FILL_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & AutoFillRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "AUTO_FILL_RUNTIME_RETRY",
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
              reject(new Error("Auto-Fill Runtime operation timed out."));
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
        code: "AUTO_FILL_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Auto-Fill Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AutoFillRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Auto-Fill Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "AUTO_FILL_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & AutoFillRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (F3-CAP-12). */
export const EnterpriseAutoFillRuntimeAdapter = DefaultAutoFillRuntimeAdapter;
