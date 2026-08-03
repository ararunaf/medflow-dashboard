/**
 * DefaultXMLGenerationAdapter — TISS-05.
 *
 * Adapter oficial do Enterprise XML Generation Runtime.
 * Produz exclusivamente estrutura XML canônica.
 * Sem XML TISS/ANS real. Sem operadoras. Sem contratos. Sem tenants.
 * Sem namespaces reais, schemas externos, assinatura digital ou serializer específico.
 */
import {
  DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
  toCanonicalXMLGenerationProviderCapabilities,
} from "../ports/capabilities";
import {
  createXMLGenerationResultId,
  createXMLGenerationRuntimeRequestId,
} from "../ports/identity";
import type { XMLGenerationRuntimePort } from "../ports/xml-generation-runtime-port";
import type {
  CanonicalXMLNode,
  CanonicalXMLRequest,
  CanonicalXMLResult,
  CanonicalXMLStructure,
} from "../ports/canonical";
import type {
  GenerateCanonicalXMLInput,
  GenerateCanonicalXMLResult,
  GetCanonicalXMLResultInput,
  GetCanonicalXMLResultResult,
  ListCanonicalXMLResultsInput,
  ListCanonicalXMLResultsResult,
  XMLGenerationRuntimeHealth,
  XMLGenerationRuntimeInfo,
  XMLGenerationRuntimeOperationEnvelope,
  XMLGenerationRuntimeOperationalControls,
  XMLGenerationRuntimePortCapabilities,
  XMLGenerationRuntimeProviderId,
  XMLGenerationRuntimeProviderMetadata,
  XMLGenerationRuntimeStructuredLog,
} from "../ports/types";
import { InMemoryXMLGenerationRuntimeStore, type XMLGenerationRuntimeStore } from "../store";

export const DEFAULT_XML_GENERATION_ADAPTER_ID = "default-enterprise-xml-generation";
export const DEFAULT_XML_GENERATION_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultXMLGenerationAdapterOptions = {
  provider?: Extract<XMLGenerationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: XMLGenerationRuntimeStore;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: XMLGenerationRuntimeOperationalControls): AbortSignal | undefined {
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

function resolveRequest(input: GenerateCanonicalXMLInput): CanonicalXMLRequest {
  const base = input.request ?? {
    kind: "canonical-xml-generation-request" as const,
  };
  return {
    ...base,
    kind: "canonical-xml-generation-request",
    requestId: base.requestId ?? input.requestId,
    generationId: base.generationId ?? input.generationId,
    documentId: base.documentId ?? input.documentId,
    catalogId: base.catalogId ?? input.catalogId,
    catalogConsumed: base.catalogConsumed ?? input.catalogConsumed,
    rulePackExecutionId: base.rulePackExecutionId ?? input.rulePackExecutionId,
    rulePackCode: base.rulePackCode ?? input.rulePackCode,
    rulePackConsumed: base.rulePackConsumed ?? input.rulePackConsumed,
  };
}

function node(
  name: string,
  value?: string,
  children?: readonly CanonicalXMLNode[],
): CanonicalXMLNode {
  return {
    kind: "canonical-xml-node",
    name,
    ...(value !== undefined ? { value } : {}),
    ...(children && children.length > 0 ? { children } : {}),
  };
}

/**
 * Constrói a estrutura XML canônica (árvore tipada).
 * NÃO serializa XML real. NÃO usa namespaces/DOM/serializer genérico.
 */
function buildCanonicalStructure(
  request: CanonicalXMLRequest,
  resultId: string,
): CanonicalXMLStructure {
  const nodes: CanonicalXMLNode[] = [
    node("ResultId", resultId),
    node("GenerationId", request.generationId ?? ""),
    node("DocumentId", request.documentId ?? ""),
    node("CatalogId", request.catalogId ?? ""),
    node("CatalogConsumed", request.catalogConsumed === true ? "true" : "false"),
    node("RulePackExecutionId", request.rulePackExecutionId ?? ""),
    node("RulePackCode", request.rulePackCode ?? ""),
    node("RulePackConsumed", request.rulePackConsumed === true ? "true" : "false"),
    node("RealXmlGenerated", "false"),
    node("Mode", "canonical-foundation"),
    node("Metadata", undefined, [
      node("SessionId", request.metadata?.sessionId ?? ""),
      node("CorrelationId", request.metadata?.correlationId ?? ""),
      node("Channel", request.metadata?.channel ?? ""),
      node("Source", request.metadata?.source ?? "xml-generation-runtime"),
    ]),
    node("StructuralNotes", request.structuralNotes ?? "TISS-05 canonical XML structure only."),
  ];

  return {
    kind: "canonical-xml-structure",
    root: "CanonicalXML",
    nodes,
    realXmlGenerated: false,
  };
}

/**
 * Adapter oficial TISS-05 — XML Generation Runtime default / enterprise.
 */
export class DefaultXMLGenerationAdapter implements XMLGenerationRuntimePort {
  readonly providerId: Extract<XMLGenerationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: XMLGenerationRuntimeProviderMetadata;
  private readonly store: XMLGenerationRuntimeStore;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultXMLGenerationAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} XML Generation Runtime ready (canonical structure only — no real XML).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default XML Generation Runtime"
          : "Enterprise XML Generation Runtime",
      version: DEFAULT_XML_GENERATION_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-05 Enterprise XML Generation Runtime — canonical XML structure only.",
    };
    this.store = options.store ?? new InMemoryXMLGenerationRuntimeStore();
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): XMLGenerationRuntimeStore {
    return this.store;
  }

  capabilities(): XMLGenerationRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_XML_GENERATION_ADAPTER_ID,
      engine: { ...DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLGenerationProviderCapabilities(
        DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalStructure: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
    };
  }

  providerInfo(): XMLGenerationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_GENERATION_RUNTIME",
      capabilities: { ...DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLGenerationRuntimeHealth> {
    const storeHealth = this.store.health();
    const ok = this.healthy && storeHealth.ok;
    return {
      kind: "canonical-xml-generation-provider-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedResultCount: this.store.resultCount(),
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "XML Generation Runtime unhealthy.",
    };
  }

  async generate(input: GenerateCanonicalXMLInput): Promise<GenerateCanonicalXMLResult> {
    return this.runOperation("generate", input, async () => {
      const request = resolveRequest(input);
      const stamp = this.now();
      const resultId = createXMLGenerationResultId();
      const structure = buildCanonicalStructure(request, resultId);

      const result: CanonicalXMLResult = {
        kind: "canonical-xml-generation-result",
        ok: true,
        resultId,
        request,
        structure,
        metadata: request.metadata,
        generationId: request.generationId,
        catalogId: request.catalogId,
        catalogConsumed: request.catalogConsumed === true,
        rulePackExecutionId: request.rulePackExecutionId,
        rulePackCode: request.rulePackCode,
        rulePackConsumed: request.rulePackConsumed === true,
        realXmlGenerated: false,
        status: "completed",
        message: "Canonical XML structure generated (TISS-05 foundation — no real XML produced).",
        code: "XML_GENERATION_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResult(result);

      return {
        ok: true,
        result,
        structure,
        code: "XML_GENERATION_RUNTIME_OK",
        message: result.message,
      };
    });
  }

  async getResult(input: GetCanonicalXMLResultInput): Promise<GetCanonicalXMLResultResult> {
    return this.runOperation("getResult", input, async () => {
      const result = this.store.getResult(input.resultId);
      if (!result) {
        return {
          ok: false,
          code: "XML_GENERATION_RUNTIME_NOT_FOUND",
          message: "Canonical XML generation result not found.",
        };
      }
      return {
        ok: true,
        result,
        code: "XML_GENERATION_RUNTIME_OK",
        message: "Canonical XML generation result loaded.",
      };
    });
  }

  async listResults(
    input: ListCanonicalXMLResultsInput = {},
  ): Promise<ListCanonicalXMLResultsResult> {
    return this.runOperation("listResults", input, async () => {
      let results = this.store.listResults();
      if (input.status != null) {
        results = results.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        results,
        statistics: this.store.statistics(),
        code: "XML_GENERATION_RUNTIME_OK",
        message: `Listed ${results.length} canonical XML generation results.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: XMLGenerationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & XMLGenerationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createXMLGenerationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: XMLGenerationRuntimeStructuredLog[] = [];
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
            code: "XML_GENERATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & XMLGenerationRuntimeOperationEnvelope;
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
            code: body.code ?? "XML_GENERATION_RUNTIME_OK",
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
            code: "XML_GENERATION_RUNTIME_RETRY",
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
        code: "XML_GENERATION_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XMLGenerationRuntimeOperationEnvelope;
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
          ? "XML_GENERATION_RUNTIME_CANCELLED"
          : isTimeout
            ? "XML_GENERATION_RUNTIME_TIMEOUT"
            : "XML_GENERATION_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & XMLGenerationRuntimeOperationEnvelope;
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
                `XML Generation Runtime operation timed out after ${timeoutMs}ms`,
              );
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("XML Generation Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (TISS-05). */
export const EnterpriseXMLGenerationAdapter = DefaultXMLGenerationAdapter;
