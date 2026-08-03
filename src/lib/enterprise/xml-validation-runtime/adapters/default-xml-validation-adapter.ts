/**
 * DefaultXMLValidationAdapter ? TISS-08.
 *
 * Adapter oficial do Enterprise XML Validation Runtime.
 * Responde exclusivamente de forma estrutural (sem validação real).
 * Sem XSD oficial. Sem validação XSD. Sem XML TISS/ANS. Sem namespaces oficiais.
 * Sem conhecimento de padrões TISS ? infraestrutura estrutural apenas.
 */
import {
  DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
  toCanonicalXMLValidationCapabilities,
} from "../ports/capabilities";
import {
  createXMLValidationId,
  createXMLValidationResultId,
  createXMLValidationRuntimeRequestId,
} from "../ports/identity";
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type {
  CanonicalXMLValidationRequest,
  CanonicalXMLValidationResult,
  CanonicalXMLValidationSummary,
} from "../ports/canonical";
import type {
  GetCanonicalXMLValidationResultInput,
  GetCanonicalXMLValidationResultResult,
  ListCanonicalXMLValidationResultsInput,
  ListCanonicalXMLValidationResultsResult,
  ValidateCanonicalXMLInput,
  ValidateCanonicalXMLResult,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimeOperationEnvelope,
  XMLValidationRuntimeOperationalControls,
  XMLValidationRuntimePortCapabilities,
  XMLValidationRuntimeProviderId,
  XMLValidationRuntimeProviderMetadata,
  XMLValidationRuntimeStructuredLog,
} from "../ports/types";
import { InMemoryXMLValidationRuntimeStore, type XMLValidationRuntimeStore } from "../store";

export const DEFAULT_XML_VALIDATION_ADAPTER_ID = "default-enterprise-xml-validation";
export const DEFAULT_XML_VALIDATION_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultXMLValidationAdapterOptions = {
  provider?: Extract<XMLValidationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: XMLValidationRuntimeStore;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: XMLValidationRuntimeOperationalControls): AbortSignal | undefined {
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

function resolveRequest(input: ValidateCanonicalXMLInput): CanonicalXMLValidationRequest {
  const base = input.request ?? {
    kind: "canonical-xml-validation-request" as const,
  };
  return {
    ...base,
    kind: "canonical-xml-validation-request",
    requestId: base.requestId ?? input.requestId,
    validationId: base.validationId ?? input.validationId,
    name: base.name ?? input.name,
    schemaResultId: base.schemaResultId ?? input.schemaResultId,
    serializeResultId: base.serializeResultId ?? input.serializeResultId,
    generationResultId: base.generationResultId ?? input.generationResultId,
    documentId: base.documentId ?? input.documentId,
    operation: base.operation ?? "validate",
  };
}

function resolveSummary(): CanonicalXMLValidationSummary {
  return {
    kind: "canonical-xml-validation-summary",
    issueCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    notes: "TISS-08 foundation ? structural response only; no real XML/XSD validation.",
  };
}

/**
 * Adapter oficial TISS-08 ? XML Validation Runtime default / enterprise.
 */
export class DefaultXMLValidationAdapter implements XMLValidationRuntimePort {
  readonly providerId: Extract<XMLValidationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: XMLValidationRuntimeProviderMetadata;
  private readonly store: XMLValidationRuntimeStore;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultXMLValidationAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} XML Validation Runtime ready (structural only ? no official XSD / no real validation).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default XML Validation Runtime"
          : "Enterprise XML Validation Runtime",
      version: DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-08 Enterprise XML Validation Runtime ? canonical validation infrastructure only.",
    };
    this.store = options.store ?? new InMemoryXMLValidationRuntimeStore();
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo ? não produto). */
  getStore(): XMLValidationRuntimeStore {
    return this.store;
  }

  capabilities(): XMLValidationRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_XML_VALIDATION_ADAPTER_ID,
      engine: { ...DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLValidationCapabilities(DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES),
      supportsCanonicalValidation: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      validationEngineReady: true,
      implementsOfficialXsd: false,
      implementsXsdValidation: false,
      implementsRealXmlValidation: false,
      implementsOfficialTissValidation: false,
      implementsOfficialAnsValidation: false,
      implementsOperatorDispatch: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): XMLValidationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_VALIDATION_RUNTIME",
      capabilities: { ...DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLValidationRuntimeHealth> {
    const storeHealth = this.store.health();
    const ok = this.healthy && storeHealth.ok;
    return {
      kind: "canonical-xml-validation-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedResultCount: this.store.resultCount(),
      validationEngineReady: true,
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "XML Validation Runtime unhealthy.",
    };
  }

  async validate(input: ValidateCanonicalXMLInput): Promise<ValidateCanonicalXMLResult> {
    return this.runOperation("validate", input, async () => {
      const request = resolveRequest(input);
      const stamp = this.now();
      const resultId = createXMLValidationResultId();
      const validationId = request.validationId ?? createXMLValidationId();
      const profile = request.profile ?? {
        kind: "canonical-xml-validation-profile" as const,
        profileCode: "canonical-foundation",
        label: "Canonical XML Validation Foundation Profile",
        notes: "TISS-08 structural profile only ? no ANS/TISS official validation.",
      };

      const result: CanonicalXMLValidationResult = {
        kind: "canonical-xml-validation-result",
        ok: true,
        resultId,
        request: { ...request, validationId },
        profile,
        metadata: request.metadata,
        operation: "validate",
        issues: [],
        summary: resolveSummary(),
        schemaResultId: request.schemaResultId,
        serializeResultId: request.serializeResultId,
        generationResultId: request.generationResultId,
        validationExecuted: false,
        realValidationPerformed: false,
        officialXsdLoaded: false,
        officialAnsValidation: false,
        officialTissValidation: false,
        validationRulesLoaded: false,
        validationEngineReady: true,
        status: "validated",
        message:
          "Canonical XML validation structural response (TISS-08 foundation ? no official XSD / no real validation).",
        code: "XML_VALIDATION_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResult(result);

      return {
        ok: true,
        result,
        code: "XML_VALIDATION_RUNTIME_OK",
        message: result.message,
      };
    });
  }

  async getResult(
    input: GetCanonicalXMLValidationResultInput,
  ): Promise<GetCanonicalXMLValidationResultResult> {
    return this.runOperation("getResult", input, async () => {
      const result = this.store.getResult(input.resultId);
      if (!result) {
        return {
          ok: false,
          code: "XML_VALIDATION_RUNTIME_NOT_FOUND",
          message: "Canonical XML validation result not found.",
        };
      }
      return {
        ok: true,
        result,
        code: "XML_VALIDATION_RUNTIME_OK",
        message: "Canonical XML validation result loaded.",
      };
    });
  }

  async listResults(
    input: ListCanonicalXMLValidationResultsInput = {},
  ): Promise<ListCanonicalXMLValidationResultsResult> {
    return this.runOperation("listResults", input, async () => {
      let results = this.store.listResults();
      if (input.status != null) {
        results = results.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        results,
        statistics: this.store.statistics(),
        code: "XML_VALIDATION_RUNTIME_OK",
        message: `Listed ${results.length} canonical XML validation results.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: XMLValidationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & XMLValidationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createXMLValidationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: XMLValidationRuntimeStructuredLog[] = [];
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
            code: "XML_VALIDATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & XMLValidationRuntimeOperationEnvelope;
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
            code: body.code ?? "XML_VALIDATION_RUNTIME_OK",
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
            code: "XML_VALIDATION_RUNTIME_RETRY",
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
        code: "XML_VALIDATION_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XMLValidationRuntimeOperationEnvelope;
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
          ? "XML_VALIDATION_RUNTIME_CANCELLED"
          : isTimeout
            ? "XML_VALIDATION_RUNTIME_TIMEOUT"
            : "XML_VALIDATION_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & XMLValidationRuntimeOperationEnvelope;
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
                `XML Validation Runtime operation timed out after ${timeoutMs}ms`,
              );
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("XML Validation Runtime operation aborted");
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
}

/** Alias oficial do adapter enterprise (TISS-08). */
export const EnterpriseXMLValidationAdapter = DefaultXMLValidationAdapter;
