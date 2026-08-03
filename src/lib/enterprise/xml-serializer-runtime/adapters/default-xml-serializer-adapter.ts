/**
 * DefaultXMLSerializerAdapter — TISS-06.
 *
 * Adapter oficial do Enterprise XML Serializer Runtime.
 * Produz exclusivamente XML canônico em texto a partir da estrutura tipada.
 * Sem XML TISS/ANS real. Sem namespaces ANS. Sem XSD. Sem operadoras.
 * Sem conhecimento de padrões TISS — serialização estrutural apenas.
 */
import {
  DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
  toCanonicalXMLSerializerProviderCapabilities,
} from "../ports/capabilities";
import {
  createXMLSerializerResultId,
  createXMLSerializerRuntimeRequestId,
} from "../ports/identity";
import type { XMLSerializerRuntimePort } from "../ports/xml-serializer-runtime-port";
import type {
  CanonicalXMLNode,
  CanonicalXMLSerializeRequest,
  CanonicalXMLSerializeResult,
  CanonicalXMLStructure,
} from "../ports/canonical";
import type {
  GetCanonicalXMLSerializeResultInput,
  GetCanonicalXMLSerializeResultResult,
  ListCanonicalXMLSerializeResultsInput,
  ListCanonicalXMLSerializeResultsResult,
  SerializeCanonicalXMLInput,
  SerializeCanonicalXMLResult,
  XMLSerializerRuntimeHealth,
  XMLSerializerRuntimeInfo,
  XMLSerializerRuntimeOperationEnvelope,
  XMLSerializerRuntimeOperationalControls,
  XMLSerializerRuntimePortCapabilities,
  XMLSerializerRuntimeProviderId,
  XMLSerializerRuntimeProviderMetadata,
  XMLSerializerRuntimeStructuredLog,
} from "../ports/types";
import { InMemoryXMLSerializerRuntimeStore, type XMLSerializerRuntimeStore } from "../store";

export const DEFAULT_XML_SERIALIZER_ADAPTER_ID = "default-enterprise-xml-serializer";
export const DEFAULT_XML_SERIALIZER_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultXMLSerializerAdapterOptions = {
  provider?: Extract<XMLSerializerRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: XMLSerializerRuntimeStore;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: XMLSerializerRuntimeOperationalControls): AbortSignal | undefined {
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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeElementName(name: string): string {
  const trimmed = name.trim();
  if (/^[A-Za-z_][\w.-]*$/.test(trimmed)) return trimmed;
  return "CanonicalNode";
}

function resolveRequest(input: SerializeCanonicalXMLInput): CanonicalXMLSerializeRequest {
  const base = input.request ?? {
    kind: "canonical-xml-serialize-request" as const,
  };
  return {
    ...base,
    kind: "canonical-xml-serialize-request",
    requestId: base.requestId ?? input.requestId,
    serializationId: base.serializationId ?? input.serializationId,
    generationId: base.generationId ?? input.generationId,
    generationResultId: base.generationResultId ?? input.generationResultId,
    documentId: base.documentId ?? input.documentId,
    structure: base.structure ?? input.structure,
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

function resolveStructure(
  request: CanonicalXMLSerializeRequest,
  resultId: string,
): CanonicalXMLStructure {
  if (request.structure?.kind === "canonical-xml-structure") {
    return request.structure;
  }
  return {
    kind: "canonical-xml-structure",
    root: "CanonicalXML",
    nodes: [
      node("ResultId", resultId),
      node("GenerationId", request.generationId ?? ""),
      node("GenerationResultId", request.generationResultId ?? ""),
      node("DocumentId", request.documentId ?? ""),
      node("RealTissXmlGenerated", "false"),
      node("RealAnsXmlGenerated", "false"),
      node("Mode", "canonical-serializer-foundation"),
      node(
        "StructuralNotes",
        request.structuralNotes ?? "TISS-06 canonical XML serialization only.",
      ),
    ],
    realXmlGenerated: false,
  };
}

function serializeNode(n: CanonicalXMLNode, depth: number): string {
  const pad = "  ".repeat(depth);
  const name = sanitizeElementName(n.name);
  const children = n.children ?? [];
  if (children.length === 0) {
    if (n.value === undefined || n.value === "") {
      return `${pad}<${name}/>`;
    }
    return `${pad}<${name}>${escapeXml(n.value)}</${name}>`;
  }
  const body = children.map((child) => serializeNode(child, depth + 1)).join("\n");
  if (n.value !== undefined && n.value !== "") {
    return `${pad}<${name}>${escapeXml(n.value)}\n${body}\n${pad}</${name}>`;
  }
  return `${pad}<${name}>\n${body}\n${pad}</${name}>`;
}

/**
 * Serializa estrutura tipada em XML canônico textual.
 * Sem namespaces ANS. Sem schema. Sem padrões TISS.
 */
function buildCanonicalXmlString(structure: CanonicalXMLStructure): string {
  const root = sanitizeElementName(structure.root || "CanonicalXML");
  const body = structure.nodes.map((n) => serializeNode(n, 1)).join("\n");
  const flags = [
    "  <RealTissXmlGenerated>false</RealTissXmlGenerated>",
    "  <RealAnsXmlGenerated>false</RealAnsXmlGenerated>",
  ].join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n${body}\n${flags}\n</${root}>\n`;
}

/**
 * Adapter oficial TISS-06 — XML Serializer Runtime default / enterprise.
 */
export class DefaultXMLSerializerAdapter implements XMLSerializerRuntimePort {
  readonly providerId: Extract<XMLSerializerRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: XMLSerializerRuntimeProviderMetadata;
  private readonly store: XMLSerializerRuntimeStore;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultXMLSerializerAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} XML Serializer Runtime ready (canonical XML string only — no TISS/ANS XML).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default XML Serializer Runtime"
          : "Enterprise XML Serializer Runtime",
      version: DEFAULT_XML_SERIALIZER_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-06 Enterprise XML Serializer Runtime — canonical XML string only.",
    };
    this.store = options.store ?? new InMemoryXMLSerializerRuntimeStore();
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): XMLSerializerRuntimeStore {
    return this.store;
  }

  capabilities(): XMLSerializerRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_XML_SERIALIZER_ADAPTER_ID,
      engine: { ...DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLSerializerProviderCapabilities(
        DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalXmlString: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealTissXml: false,
      implementsRealAnsXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsXsdValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): XMLSerializerRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_SERIALIZER_RUNTIME",
      capabilities: { ...DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLSerializerRuntimeHealth> {
    const storeHealth = this.store.health();
    const ok = this.healthy && storeHealth.ok;
    return {
      kind: "canonical-xml-serializer-provider-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedResultCount: this.store.resultCount(),
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "XML Serializer Runtime unhealthy.",
    };
  }

  async serialize(input: SerializeCanonicalXMLInput): Promise<SerializeCanonicalXMLResult> {
    return this.runOperation("serialize", input, async () => {
      const request = resolveRequest(input);
      const stamp = this.now();
      const resultId = createXMLSerializerResultId();
      const structure = resolveStructure(request, resultId);
      const canonicalXml = buildCanonicalXmlString(structure);

      const result: CanonicalXMLSerializeResult = {
        kind: "canonical-xml-serialize-result",
        ok: true,
        resultId,
        request: { ...request, structure },
        canonicalXml,
        structure,
        metadata: request.metadata,
        serializationId: request.serializationId ?? resultId,
        generationId: request.generationId,
        generationResultId: request.generationResultId,
        realTissXmlGenerated: false,
        realAnsXmlGenerated: false,
        status: "completed",
        message:
          "Canonical XML string serialized (TISS-06 foundation — no real TISS/ANS XML produced).",
        code: "XML_SERIALIZER_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResult(result);

      return {
        ok: true,
        result,
        canonicalXml,
        code: "XML_SERIALIZER_RUNTIME_OK",
        message: result.message,
      };
    });
  }

  async getResult(
    input: GetCanonicalXMLSerializeResultInput,
  ): Promise<GetCanonicalXMLSerializeResultResult> {
    return this.runOperation("getResult", input, async () => {
      const result = this.store.getResult(input.resultId);
      if (!result) {
        return {
          ok: false,
          code: "XML_SERIALIZER_RUNTIME_NOT_FOUND",
          message: "Canonical XML serialize result not found.",
        };
      }
      return {
        ok: true,
        result,
        code: "XML_SERIALIZER_RUNTIME_OK",
        message: "Canonical XML serialize result loaded.",
      };
    });
  }

  async listResults(
    input: ListCanonicalXMLSerializeResultsInput = {},
  ): Promise<ListCanonicalXMLSerializeResultsResult> {
    return this.runOperation("listResults", input, async () => {
      let results = this.store.listResults();
      if (input.status != null) {
        results = results.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        results,
        statistics: this.store.statistics(),
        code: "XML_SERIALIZER_RUNTIME_OK",
        message: `Listed ${results.length} canonical XML serialize results.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: XMLSerializerRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & XMLSerializerRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createXMLSerializerRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: XMLSerializerRuntimeStructuredLog[] = [];
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
            code: "XML_SERIALIZER_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & XMLSerializerRuntimeOperationEnvelope;
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
            code: body.code ?? "XML_SERIALIZER_RUNTIME_OK",
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
            code: "XML_SERIALIZER_RUNTIME_RETRY",
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
        code: "XML_SERIALIZER_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XMLSerializerRuntimeOperationEnvelope;
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
          ? "XML_SERIALIZER_RUNTIME_CANCELLED"
          : isTimeout
            ? "XML_SERIALIZER_RUNTIME_TIMEOUT"
            : "XML_SERIALIZER_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & XMLSerializerRuntimeOperationEnvelope;
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
                `XML Serializer Runtime operation timed out after ${timeoutMs}ms`,
              );
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("XML Serializer Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (TISS-06). */
export const EnterpriseXMLSerializerAdapter = DefaultXMLSerializerAdapter;
