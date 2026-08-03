/**
 * DefaultXSDRuntimeAdapter — TISS-09.
 *
 * Adapter oficial do Enterprise XSD Runtime.
 * Responde exclusivamente de forma estrutural (sem XSD real / sem validação).
 * Sem XSD oficial. Sem validação XSD. Sem XML TISS/ANS. Sem namespaces oficiais.
 * Sem conhecimento de padrões TISS — infraestrutura estrutural apenas.
 */
import {
  DEFAULT_XSD_RUNTIME_CAPABILITIES,
  toCanonicalXSDCapabilities,
} from "../ports/capabilities";
import { createXSDId, createXSDResultId, createXSDRuntimeRequestId } from "../ports/identity";
import type { XSDRuntimePort } from "../ports/xsd-runtime-port";
import type {
  CanonicalXSDRuntimeRequest,
  CanonicalXSDRuntimeResult,
  CanonicalXSDSchema,
} from "../ports/canonical";
import type {
  GetCanonicalXSDResultInput,
  GetCanonicalXSDResultResult,
  ListCanonicalXSDResultsInput,
  ListCanonicalXSDResultsResult,
  PrepareCanonicalXSDInput,
  PrepareCanonicalXSDResult,
  XSDRuntimeHealth,
  XSDRuntimeInfo,
  XSDRuntimeOperationEnvelope,
  XSDRuntimeOperationalControls,
  XSDRuntimePortCapabilities,
  XSDRuntimeProviderId,
  XSDRuntimeProviderMetadata,
  XSDRuntimeStructuredLog,
} from "../ports/types";
import { InMemoryXSDRuntimeStore, type XSDRuntimeStore } from "../store";

export const DEFAULT_XSD_RUNTIME_ADAPTER_ID = "default-enterprise-xsd";
export const DEFAULT_XSD_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultXSDRuntimeAdapterOptions = {
  provider?: Extract<XSDRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: XSDRuntimeStore;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: XSDRuntimeOperationalControls): AbortSignal | undefined {
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

function resolveRequest(input: PrepareCanonicalXSDInput): CanonicalXSDRuntimeRequest {
  const base = input.request ?? {
    kind: "canonical-xsd-runtime-request" as const,
  };
  return {
    ...base,
    kind: "canonical-xsd-runtime-request",
    requestId: base.requestId ?? input.requestId,
    xsdId: base.xsdId ?? input.xsdId,
    name: base.name ?? input.name,
    validationResultId: base.validationResultId ?? input.validationResultId,
    schemaResultId: base.schemaResultId ?? input.schemaResultId,
    serializeResultId: base.serializeResultId ?? input.serializeResultId,
    generationResultId: base.generationResultId ?? input.generationResultId,
    documentId: base.documentId ?? input.documentId,
    operation: base.operation ?? "prepare",
  };
}

function resolveSchema(request: CanonicalXSDRuntimeRequest): CanonicalXSDSchema {
  return (
    request.schema ?? {
      kind: "canonical-xsd-schema" as const,
      schemaCode: "canonical-foundation",
      label: "Canonical XSD Foundation Schema Slot",
      notes: "TISS-09 structural schema slot only — no official XSD loaded.",
    }
  );
}

/**
 * Adapter oficial TISS-09 — XSD Runtime default / enterprise.
 */
export class DefaultXSDRuntimeAdapter implements XSDRuntimePort {
  readonly providerId: Extract<XSDRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: XSDRuntimeProviderMetadata;
  private readonly store: XSDRuntimeStore;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultXSDRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} XSD Runtime ready (structural only — no official XSD / no real validation).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default XSD Runtime" : "Enterprise XSD Runtime",
      version: DEFAULT_XSD_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description: "Official TISS-09 Enterprise XSD Runtime — canonical XSD infrastructure only.",
    };
    this.store = options.store ?? new InMemoryXSDRuntimeStore();
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): XSDRuntimeStore {
    return this.store;
  }

  capabilities(): XSDRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_XSD_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_XSD_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXSDCapabilities(DEFAULT_XSD_RUNTIME_CAPABILITIES),
      supportsCanonicalXsd: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      runtimeReady: true,
      officialXsdLoaded: false,
      realXsdLoaded: false,
      realValidationAvailable: false,
      officialNamespacesLoaded: false,
      officialSchemasLoaded: false,
      schemaParsingEnabled: false,
      schemaValidationEnabled: false,
      implementsOfficialXsd: false,
      implementsXsdValidation: false,
      implementsRealXmlValidation: false,
      implementsOperatorDispatch: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): XSDRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XSD_RUNTIME",
      capabilities: { ...DEFAULT_XSD_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XSDRuntimeHealth> {
    const storeHealth = this.store.health();
    const ok = this.healthy && storeHealth.ok;
    return {
      kind: "canonical-xsd-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      message: this.healthy ? (storeHealth.message ?? this.message) : "XSD Runtime unhealthy.",
    };
  }

  async prepare(input: PrepareCanonicalXSDInput): Promise<PrepareCanonicalXSDResult> {
    return this.runOperation("prepare", input, async () => {
      const request = resolveRequest(input);
      const stamp = this.now();
      const resultId = createXSDResultId();
      const xsdId = request.xsdId ?? createXSDId();
      const profile = request.profile ?? {
        kind: "canonical-xsd-profile" as const,
        profileCode: "canonical-foundation",
        label: "Canonical XSD Foundation Profile",
        notes: "TISS-09 structural profile only — no ANS/TISS official XSD.",
      };
      const schema = resolveSchema(request);

      const result: CanonicalXSDRuntimeResult = {
        kind: "canonical-xsd-runtime-result",
        ok: true,
        resultId,
        request: { ...request, xsdId },
        profile,
        schema,
        metadata: request.metadata,
        operation: "prepare",
        validationResultId: request.validationResultId,
        schemaResultId: request.schemaResultId,
        serializeResultId: request.serializeResultId,
        generationResultId: request.generationResultId,
        officialXsdLoaded: false,
        realXsdLoaded: false,
        realValidationAvailable: false,
        officialNamespacesLoaded: false,
        officialSchemasLoaded: false,
        schemaParsingEnabled: false,
        schemaValidationEnabled: false,
        runtimeReady: true,
        status: "prepared",
        message:
          "Canonical XSD Runtime structural response (TISS-09 foundation — no official XSD / no real validation).",
        code: "XSD_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResult(result);

      return {
        ok: true,
        result,
        code: "XSD_RUNTIME_OK",
        message: result.message,
      };
    });
  }

  async getResult(input: GetCanonicalXSDResultInput): Promise<GetCanonicalXSDResultResult> {
    return this.runOperation("getResult", input, async () => {
      const result = this.store.getResult(input.resultId);
      if (!result) {
        return {
          ok: false,
          code: "XSD_RUNTIME_NOT_FOUND",
          message: "Canonical XSD Runtime result not found.",
        };
      }
      return {
        ok: true,
        result,
        code: "XSD_RUNTIME_OK",
        message: "Canonical XSD Runtime result loaded.",
      };
    });
  }

  async listResults(
    input: ListCanonicalXSDResultsInput = {},
  ): Promise<ListCanonicalXSDResultsResult> {
    return this.runOperation("listResults", input, async () => {
      let results = this.store.listResults();
      if (input.status != null) {
        results = results.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        results,
        statistics: this.store.statistics(),
        code: "XSD_RUNTIME_OK",
        message: `Listed ${results.length} canonical XSD Runtime results.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: XSDRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & XSDRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createXSDRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: XSDRuntimeStructuredLog[] = [];
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
            code: "XSD_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & XSDRuntimeOperationEnvelope;
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
            code: body.code ?? "XSD_RUNTIME_OK",
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
            code: "XSD_RUNTIME_RETRY",
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
        code: "XSD_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XSDRuntimeOperationEnvelope;
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
          ? "XSD_RUNTIME_CANCELLED"
          : isTimeout
            ? "XSD_RUNTIME_TIMEOUT"
            : "XSD_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & XSDRuntimeOperationEnvelope;
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
              const err = new Error(`XSD Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("XSD Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (TISS-09). */
export const EnterpriseXSDRuntimeAdapter = DefaultXSDRuntimeAdapter;
