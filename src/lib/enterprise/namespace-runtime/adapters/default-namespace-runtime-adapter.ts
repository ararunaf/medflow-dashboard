/**
 * DefaultNamespaceRuntimeAdapter — TISS-10.
 *
 * Adapter oficial do Enterprise Namespace Runtime.
 * Responde exclusivamente de forma estrutural (sem namespace real / sem resolução).
 * Sem namespace oficial. Sem resolução/validação. Sem XML TISS/ANS. Sem namespaces ANS/TISS.
 * Sem conhecimento de padrões TISS — infraestrutura estrutural apenas.
 */
import {
  DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES,
  toCanonicalNamespaceCapabilities,
} from "../ports/capabilities";
import {
  createNamespaceId,
  createNamespaceResultId,
  createNamespaceRuntimeRequestId,
} from "../ports/identity";
import type { NamespaceRuntimePort } from "../ports/namespace-runtime-port";
import type {
  CanonicalNamespaceRuntimeRequest,
  CanonicalNamespaceRuntimeResult,
  CanonicalNamespaceDefinition,
} from "../ports/canonical";
import type {
  GetCanonicalNamespaceResultInput,
  GetCanonicalNamespaceResultResult,
  ListCanonicalNamespaceResultsInput,
  ListCanonicalNamespaceResultsResult,
  PrepareCanonicalNamespaceInput,
  PrepareCanonicalNamespaceResult,
  NamespaceRuntimeHealth,
  NamespaceRuntimeInfo,
  NamespaceRuntimeOperationEnvelope,
  NamespaceRuntimeOperationalControls,
  NamespaceRuntimePortCapabilities,
  NamespaceRuntimeProviderId,
  NamespaceRuntimeProviderMetadata,
  NamespaceRuntimeStructuredLog,
} from "../ports/types";
import { InMemoryNamespaceRuntimeStore, type NamespaceRuntimeStore } from "../store";

export const DEFAULT_NAMESPACE_RUNTIME_ADAPTER_ID = "default-enterprise-namespace";
export const DEFAULT_NAMESPACE_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultNamespaceRuntimeAdapterOptions = {
  provider?: Extract<NamespaceRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: NamespaceRuntimeStore;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: NamespaceRuntimeOperationalControls): AbortSignal | undefined {
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

function resolveRequest(input: PrepareCanonicalNamespaceInput): CanonicalNamespaceRuntimeRequest {
  const base = input.request ?? {
    kind: "canonical-namespace-runtime-request" as const,
  };
  return {
    ...base,
    kind: "canonical-namespace-runtime-request",
    requestId: base.requestId ?? input.requestId,
    namespaceId: base.namespaceId ?? input.namespaceId,
    name: base.name ?? input.name,
    xsdResultId: base.xsdResultId ?? input.xsdResultId,
    validationResultId: base.validationResultId ?? input.validationResultId,
    schemaResultId: base.schemaResultId ?? input.schemaResultId,
    serializeResultId: base.serializeResultId ?? input.serializeResultId,
    generationResultId: base.generationResultId ?? input.generationResultId,
    documentId: base.documentId ?? input.documentId,
    operation: base.operation ?? "prepare",
  };
}

function resolveDefinition(
  request: CanonicalNamespaceRuntimeRequest,
): CanonicalNamespaceDefinition {
  return (
    request.definition ?? {
      kind: "canonical-namespace-definition" as const,
      definitionCode: "canonical-foundation",
      label: "Canonical Namespace Foundation Definition Slot",
      notes: "TISS-10 structural definition slot only — no official namespace loaded.",
    }
  );
}

/**
 * Adapter oficial TISS-10 — Namespace Runtime default / enterprise.
 */
export class DefaultNamespaceRuntimeAdapter implements NamespaceRuntimePort {
  readonly providerId: Extract<NamespaceRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: NamespaceRuntimeProviderMetadata;
  private readonly store: NamespaceRuntimeStore;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultNamespaceRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Namespace Runtime ready (structural only — no official namespace / no real resolution).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Namespace Runtime"
          : "Enterprise Namespace Runtime",
      version: DEFAULT_NAMESPACE_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-10 Enterprise Namespace Runtime — canonical namespace infrastructure only.",
    };
    this.store = options.store ?? new InMemoryNamespaceRuntimeStore();
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): NamespaceRuntimeStore {
    return this.store;
  }

  capabilities(): NamespaceRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_NAMESPACE_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES },
      canonical: toCanonicalNamespaceCapabilities(DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES),
      supportsCanonicalNamespace: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      runtimeReady: true,
      officialNamespacesLoaded: false,
      realNamespacesLoaded: false,
      namespaceResolutionEnabled: false,
      namespaceValidationEnabled: false,
      officialAnsNamespacesLoaded: false,
      officialTissNamespacesLoaded: false,
      implementsOfficialNamespaces: false,
      implementsNamespaceValidation: false,
      implementsRealNamespaceResolution: false,
      implementsOperatorDispatch: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): NamespaceRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "NAMESPACE_RUNTIME",
      capabilities: { ...DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<NamespaceRuntimeHealth> {
    const storeHealth = this.store.health();
    const ok = this.healthy && storeHealth.ok;
    return {
      kind: "canonical-namespace-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "Namespace Runtime unhealthy.",
    };
  }

  async prepare(input: PrepareCanonicalNamespaceInput): Promise<PrepareCanonicalNamespaceResult> {
    return this.runOperation("prepare", input, async () => {
      const request = resolveRequest(input);
      const stamp = this.now();
      const resultId = createNamespaceResultId();
      const namespaceId = request.namespaceId ?? createNamespaceId();
      const profile = request.profile ?? {
        kind: "canonical-namespace-profile" as const,
        profileCode: "canonical-foundation",
        label: "Canonical Namespace Foundation Profile",
        notes: "TISS-10 structural profile only — no ANS/TISS official namespace.",
      };
      const definition = resolveDefinition(request);

      const result: CanonicalNamespaceRuntimeResult = {
        kind: "canonical-namespace-runtime-result",
        ok: true,
        resultId,
        request: { ...request, namespaceId },
        profile,
        definition,
        metadata: request.metadata,
        operation: "prepare",
        xsdResultId: request.xsdResultId,
        validationResultId: request.validationResultId,
        schemaResultId: request.schemaResultId,
        serializeResultId: request.serializeResultId,
        generationResultId: request.generationResultId,
        officialNamespacesLoaded: false,
        realNamespacesLoaded: false,
        namespaceResolutionEnabled: false,
        namespaceValidationEnabled: false,
        officialAnsNamespacesLoaded: false,
        officialTissNamespacesLoaded: false,
        runtimeReady: true,
        status: "prepared",
        message:
          "Canonical Namespace Runtime structural response (TISS-10 foundation — no official namespace / no real resolution).",
        code: "NAMESPACE_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResult(result);

      return {
        ok: true,
        result,
        code: "NAMESPACE_RUNTIME_OK",
        message: result.message,
      };
    });
  }

  async getResult(
    input: GetCanonicalNamespaceResultInput,
  ): Promise<GetCanonicalNamespaceResultResult> {
    return this.runOperation("getResult", input, async () => {
      const result = this.store.getResult(input.resultId);
      if (!result) {
        return {
          ok: false,
          code: "NAMESPACE_RUNTIME_NOT_FOUND",
          message: "Canonical Namespace Runtime result not found.",
        };
      }
      return {
        ok: true,
        result,
        code: "NAMESPACE_RUNTIME_OK",
        message: "Canonical Namespace Runtime result loaded.",
      };
    });
  }

  async listResults(
    input: ListCanonicalNamespaceResultsInput = {},
  ): Promise<ListCanonicalNamespaceResultsResult> {
    return this.runOperation("listResults", input, async () => {
      let results = this.store.listResults();
      if (input.status != null) {
        results = results.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        results,
        statistics: this.store.statistics(),
        code: "NAMESPACE_RUNTIME_OK",
        message: `Listed ${results.length} canonical Namespace Runtime results.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: NamespaceRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & NamespaceRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createNamespaceRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: NamespaceRuntimeStructuredLog[] = [];
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
            code: "NAMESPACE_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & NamespaceRuntimeOperationEnvelope;
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
            code: body.code ?? "NAMESPACE_RUNTIME_OK",
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
            code: "NAMESPACE_RUNTIME_RETRY",
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
        code: "NAMESPACE_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & NamespaceRuntimeOperationEnvelope;
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
          ? "NAMESPACE_RUNTIME_CANCELLED"
          : isTimeout
            ? "NAMESPACE_RUNTIME_TIMEOUT"
            : "NAMESPACE_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & NamespaceRuntimeOperationEnvelope;
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
              const err = new Error(`Namespace Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Namespace Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (TISS-10). */
export const EnterpriseNamespaceRuntimeAdapter = DefaultNamespaceRuntimeAdapter;
