/**
 * DefaultXMLSchemaAdapter — TISS-07.
 *
 * Adapter oficial do Enterprise XML Schema Runtime.
 * Registra exclusivamente schemas XML canônicos (estruturais).
 * Sem XSD oficial. Sem validação XSD. Sem XML TISS/ANS. Sem namespaces oficiais.
 * Sem conhecimento de padrões TISS — gerenciamento estrutural apenas.
 */
import {
  DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
  toCanonicalXMLSchemaCapabilities,
} from "../ports/capabilities";
import {
  createXMLSchemaId,
  createXMLSchemaResultId,
  createXMLSchemaRuntimeRequestId,
} from "../ports/identity";
import type { XMLSchemaRuntimePort } from "../ports/xml-schema-runtime-port";
import type {
  CanonicalXMLSchema,
  CanonicalXMLSchemaRequest,
  CanonicalXMLSchemaResult,
} from "../ports/canonical";
import type {
  GetCanonicalXMLSchemaResultInput,
  GetCanonicalXMLSchemaResultResult,
  ListCanonicalXMLSchemaResultsInput,
  ListCanonicalXMLSchemaResultsResult,
  RegisterCanonicalXMLSchemaInput,
  RegisterCanonicalXMLSchemaResult,
  XMLSchemaRuntimeHealth,
  XMLSchemaRuntimeInfo,
  XMLSchemaRuntimeOperationEnvelope,
  XMLSchemaRuntimeOperationalControls,
  XMLSchemaRuntimePortCapabilities,
  XMLSchemaRuntimeProviderId,
  XMLSchemaRuntimeProviderMetadata,
  XMLSchemaRuntimeStructuredLog,
} from "../ports/types";
import { InMemoryXMLSchemaRuntimeStore, type XMLSchemaRuntimeStore } from "../store";

export const DEFAULT_XML_SCHEMA_ADAPTER_ID = "default-enterprise-xml-schema";
export const DEFAULT_XML_SCHEMA_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultXMLSchemaAdapterOptions = {
  provider?: Extract<XMLSchemaRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: XMLSchemaRuntimeStore;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: XMLSchemaRuntimeOperationalControls): AbortSignal | undefined {
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

function resolveRequest(input: RegisterCanonicalXMLSchemaInput): CanonicalXMLSchemaRequest {
  const base = input.request ?? {
    kind: "canonical-xml-schema-request" as const,
  };
  return {
    ...base,
    kind: "canonical-xml-schema-request",
    requestId: base.requestId ?? input.requestId,
    schemaId: base.schemaId ?? input.schemaId ?? input.schema?.schemaId,
    name: base.name ?? input.name ?? input.schema?.name,
    serializeResultId: base.serializeResultId ?? input.serializeResultId,
    generationResultId: base.generationResultId ?? input.generationResultId,
    documentId: base.documentId ?? input.documentId,
    operation: base.operation ?? "register",
  };
}

function resolveSchema(
  request: CanonicalXMLSchemaRequest,
  input: RegisterCanonicalXMLSchemaInput,
): CanonicalXMLSchema {
  if (input.schema?.kind === "canonical-xml-schema") {
    return {
      ...input.schema,
      kind: "canonical-xml-schema",
      implementsOfficialXsd: false,
      implementsAnsSchema: false,
      implementsTissSchema: false,
    };
  }
  const schemaId = request.schemaId ?? createXMLSchemaId();
  return {
    kind: "canonical-xml-schema",
    schemaId,
    name: request.name ?? "CanonicalXMLSchema",
    version: request.version ?? {
      kind: "canonical-xml-schema-version",
      label: "foundation",
      major: 1,
      minor: 0,
      patch: 0,
    },
    profile: request.profile ?? {
      kind: "canonical-xml-schema-profile",
      profileCode: "canonical-foundation",
      label: "Canonical XML Schema Foundation Profile",
      notes: "TISS-07 structural profile only — no ANS/TISS official schema.",
    },
    reference: request.reference ?? {
      kind: "canonical-xml-schema-reference",
      schemaId,
      serializeResultId: request.serializeResultId,
      generationResultId: request.generationResultId,
      documentId: request.documentId,
    },
    metadata: request.metadata,
    structuralNotes: request.structuralNotes ?? "TISS-07 canonical XML schema registration only.",
    implementsOfficialXsd: false,
    implementsAnsSchema: false,
    implementsTissSchema: false,
  };
}

/**
 * Adapter oficial TISS-07 — XML Schema Runtime default / enterprise.
 */
export class DefaultXMLSchemaAdapter implements XMLSchemaRuntimePort {
  readonly providerId: Extract<XMLSchemaRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: XMLSchemaRuntimeProviderMetadata;
  private readonly store: XMLSchemaRuntimeStore;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultXMLSchemaAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} XML Schema Runtime ready (canonical schema only — no official XSD / no validation).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default XML Schema Runtime"
          : "Enterprise XML Schema Runtime",
      version: DEFAULT_XML_SCHEMA_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-07 Enterprise XML Schema Runtime — canonical schema infrastructure only.",
    };
    this.store = options.store ?? new InMemoryXMLSchemaRuntimeStore();
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): XMLSchemaRuntimeStore {
    return this.store;
  }

  capabilities(): XMLSchemaRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_XML_SCHEMA_ADAPTER_ID,
      engine: { ...DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLSchemaCapabilities(DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES),
      supportsCanonicalSchema: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsOfficialXsd: false,
      implementsXsdValidation: false,
      implementsRealTissXml: false,
      implementsRealAnsXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): XMLSchemaRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_SCHEMA_RUNTIME",
      capabilities: { ...DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLSchemaRuntimeHealth> {
    const storeHealth = this.store.health();
    const ok = this.healthy && storeHealth.ok;
    return {
      kind: "canonical-xml-schema-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedResultCount: this.store.resultCount(),
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "XML Schema Runtime unhealthy.",
    };
  }

  async register(
    input: RegisterCanonicalXMLSchemaInput,
  ): Promise<RegisterCanonicalXMLSchemaResult> {
    return this.runOperation("register", input, async () => {
      const request = resolveRequest(input);
      const stamp = this.now();
      const resultId = createXMLSchemaResultId();
      const schema = resolveSchema(request, input);

      const result: CanonicalXMLSchemaResult = {
        kind: "canonical-xml-schema-result",
        ok: true,
        resultId,
        request: { ...request, schemaId: schema.schemaId },
        schema,
        metadata: request.metadata,
        operation: "register",
        serializeResultId: request.serializeResultId,
        generationResultId: request.generationResultId,
        officialXsdLoaded: false,
        xsdValidationPerformed: false,
        realTissXmlValidated: false,
        realAnsXmlValidated: false,
        status: "registered",
        message:
          "Canonical XML schema registered (TISS-07 foundation — no official XSD / no validation).",
        code: "XML_SCHEMA_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResult(result);

      return {
        ok: true,
        result,
        schema,
        code: "XML_SCHEMA_RUNTIME_OK",
        message: result.message,
      };
    });
  }

  async getResult(
    input: GetCanonicalXMLSchemaResultInput,
  ): Promise<GetCanonicalXMLSchemaResultResult> {
    return this.runOperation("getResult", input, async () => {
      const result = this.store.getResult(input.resultId);
      if (!result) {
        return {
          ok: false,
          code: "XML_SCHEMA_RUNTIME_NOT_FOUND",
          message: "Canonical XML schema result not found.",
        };
      }
      return {
        ok: true,
        result,
        code: "XML_SCHEMA_RUNTIME_OK",
        message: "Canonical XML schema result loaded.",
      };
    });
  }

  async listResults(
    input: ListCanonicalXMLSchemaResultsInput = {},
  ): Promise<ListCanonicalXMLSchemaResultsResult> {
    return this.runOperation("listResults", input, async () => {
      let results = this.store.listResults();
      if (input.status != null) {
        results = results.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        results,
        statistics: this.store.statistics(),
        code: "XML_SCHEMA_RUNTIME_OK",
        message: `Listed ${results.length} canonical XML schema results.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: XMLSchemaRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & XMLSchemaRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createXMLSchemaRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: XMLSchemaRuntimeStructuredLog[] = [];
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
            code: "XML_SCHEMA_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & XMLSchemaRuntimeOperationEnvelope;
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
            code: body.code ?? "XML_SCHEMA_RUNTIME_OK",
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
            code: "XML_SCHEMA_RUNTIME_RETRY",
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
        code: "XML_SCHEMA_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XMLSchemaRuntimeOperationEnvelope;
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
          ? "XML_SCHEMA_RUNTIME_CANCELLED"
          : isTimeout
            ? "XML_SCHEMA_RUNTIME_TIMEOUT"
            : "XML_SCHEMA_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & XMLSchemaRuntimeOperationEnvelope;
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
              const err = new Error(`XML Schema Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("XML Schema Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (TISS-07). */
export const EnterpriseXMLSchemaAdapter = DefaultXMLSchemaAdapter;
