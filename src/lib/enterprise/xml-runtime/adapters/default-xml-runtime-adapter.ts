/**
 * DefaultXMLRuntimeAdapter — TISS-04 / TISS-05.
 *
 * Adapter oficial do Enterprise XML Runtime.
 * Sem geração XML real. Sem operadoras. Sem contratos. Sem tenants. Sem ANS.
 *
 * Consome exclusivamente TISSCatalogPort + RulePackEnginePort + XMLGenerationRuntimePort.
 */
import {
  DEFAULT_XML_RUNTIME_CAPABILITIES,
  toCanonicalXMLProviderCapabilities,
} from "../ports/capabilities";
import { createXMLGenerationId, createXMLRuntimeRequestId } from "../ports/identity";
import type { XMLRuntimePort } from "../ports/xml-runtime-port";
import type {
  CanonicalXMLGeneration,
  CanonicalXMLRequest,
  CanonicalXMLResult,
  CanonicalXMLRuntimeConfiguration,
} from "../ports/canonical";
import type {
  CancelXMLInput,
  CancelXMLResult,
  GenerateXMLInput,
  GenerateXMLResult,
  GetXMLGenerationInput,
  GetXMLGenerationResult,
  ListXMLGenerationsInput,
  ListXMLGenerationsResult,
  ValidateXMLInput,
  ValidateXMLResult,
  XMLRuntimeEnterpriseDeps,
  XMLRuntimeHealth,
  XMLRuntimeInfo,
  XMLRuntimeOperationEnvelope,
  XMLRuntimeOperationalControls,
  XMLRuntimePortCapabilities,
  XMLRuntimeProviderId,
  XMLRuntimeProviderMetadata,
  XMLRuntimeStructuredLog,
} from "../ports/types";
import { InMemoryXMLRuntimeStore, type XMLRuntimeStore } from "../store";

export const DEFAULT_XML_RUNTIME_ADAPTER_ID = "default-enterprise-xml-runtime";
export const DEFAULT_XML_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

const FOUNDATION_CONFIGURATION: CanonicalXMLRuntimeConfiguration = {
  kind: "canonical-xml-runtime-configuration",
  mode: "foundation",
  priority: "NORMAL",
  notes:
    "TISS-04/TISS-05 Enterprise XML Runtime — structural + canonical generation via XMLGenerationRuntimePort; no real XML.",
};

export type DefaultXMLRuntimeAdapterOptions = {
  provider?: Extract<XMLRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: XMLRuntimeStore;
  enterpriseDeps: XMLRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: XMLRuntimeOperationalControls): AbortSignal | undefined {
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

function resolveRequest(input: GenerateXMLInput | ValidateXMLInput): CanonicalXMLRequest {
  const base = input.request ?? {
    kind: "canonical-xml-request" as const,
  };
  return {
    ...base,
    kind: "canonical-xml-request",
    requestId: base.requestId ?? input.requestId,
    documentId:
      base.documentId ??
      ("documentId" in input ? (input as GenerateXMLInput).documentId : undefined),
    catalogProfileCode:
      base.catalogProfileCode ??
      ("catalogProfileCode" in input ? (input as GenerateXMLInput).catalogProfileCode : undefined),
    rulePackCode:
      base.rulePackCode ??
      ("rulePackCode" in input ? (input as GenerateXMLInput).rulePackCode : undefined),
    configuration: base.configuration ?? FOUNDATION_CONFIGURATION,
  };
}

/**
 * Adapter oficial TISS-04 — XML Runtime default / enterprise.
 */
export class DefaultXMLRuntimeAdapter implements XMLRuntimePort {
  readonly providerId: Extract<XMLRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: XMLRuntimeProviderMetadata;
  private readonly store: XMLRuntimeStore;
  private readonly enterpriseDeps: XMLRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultXMLRuntimeAdapterOptions) {
    if (!options.enterpriseDeps?.getTISSCatalogPort) {
      throw new Error(
        "DefaultXMLRuntimeAdapter exige enterpriseDeps.getTISSCatalogPort. " +
          "Bypass / implementação paralela é proibida.",
      );
    }
    if (!options.enterpriseDeps?.getRulePackEnginePort) {
      throw new Error(
        "DefaultXMLRuntimeAdapter exige enterpriseDeps.getRulePackEnginePort. " +
          "Bypass / implementação paralela é proibida.",
      );
    }
    if (!options.enterpriseDeps?.getXMLGenerationRuntimePort) {
      throw new Error(
        "DefaultXMLRuntimeAdapter exige enterpriseDeps.getXMLGenerationRuntimePort (TISS-05). " +
          "Bypass / implementação paralela é proibida.",
      );
    }
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} XML Runtime ready (structural + canonical generation — no real XML).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default XML Runtime" : "Enterprise XML Runtime",
      version: DEFAULT_XML_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official TISS-04/TISS-05 Enterprise XML Runtime — Catalog + RulePackEngine + XMLGenerationRuntimePort.",
    };
    this.store = options.store ?? new InMemoryXMLRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): XMLRuntimeStore {
    return this.store;
  }

  capabilities(): XMLRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_XML_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_XML_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLProviderCapabilities(DEFAULT_XML_RUNTIME_CAPABILITIES),
      supportsCanonicalResult: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      consumesTISSCatalogPort: true,
      consumesRulePackEnginePort: true,
      consumesXMLGenerationRuntimePort: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
    };
  }

  providerInfo(): XMLRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_RUNTIME",
      capabilities: { ...DEFAULT_XML_RUNTIME_CAPABILITIES },
      configuration: FOUNDATION_CONFIGURATION,
    };
  }

  async health(): Promise<XMLRuntimeHealth> {
    const storeHealth = this.store.health();
    let tissCatalogOk = false;
    let rulePackEngineOk = false;
    let xmlGenerationRuntimeOk = false;
    try {
      const catalogHealth = await this.enterpriseDeps.getTISSCatalogPort().health();
      tissCatalogOk = catalogHealth.ok === true;
    } catch {
      tissCatalogOk = false;
    }
    try {
      const rulePackHealth = await this.enterpriseDeps.getRulePackEnginePort().health();
      rulePackEngineOk = rulePackHealth.ok === true;
    } catch {
      rulePackEngineOk = false;
    }
    try {
      const generationHealth = await this.enterpriseDeps.getXMLGenerationRuntimePort().health();
      xmlGenerationRuntimeOk = generationHealth.ok === true;
    } catch {
      xmlGenerationRuntimeOk = false;
    }
    const ok =
      this.healthy && storeHealth.ok && tissCatalogOk && rulePackEngineOk && xmlGenerationRuntimeOk;
    return {
      kind: "canonical-xml-provider-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedGenerationCount: this.store.generationCount(),
      tissCatalogOk,
      rulePackEngineOk,
      xmlGenerationRuntimeOk,
      message: this.healthy ? (storeHealth.message ?? this.message) : "XML Runtime unhealthy.",
    };
  }

  async generate(input: GenerateXMLInput): Promise<GenerateXMLResult> {
    return this.runOperation("generate", input, async () => {
      const request = resolveRequest(input);
      const stamp = this.now();
      const generationId = createXMLGenerationId();

      let generation: CanonicalXMLGeneration = {
        kind: "canonical-xml-generation",
        generationId,
        status: "running",
        request,
        catalogConsumed: false,
        rulePackConsumed: false,
        xmlGenerationRuntimeConsumed: false,
        realXmlGenerated: false,
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setGeneration(generation);

      const catalogPort = this.enterpriseDeps.getTISSCatalogPort();
      const rulePackEnginePort = this.enterpriseDeps.getRulePackEnginePort();
      const xmlGenerationRuntimePort = this.enterpriseDeps.getXMLGenerationRuntimePort();

      let catalogId: string | undefined;
      let catalogConsumed = false;
      const catalogResult = await catalogPort.getCatalog({
        requestId: input.requestId,
        signal: readSignal(input),
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
        attributes: input.attributes,
      });
      if (catalogResult.ok && catalogResult.catalog) {
        catalogId = catalogResult.catalog.catalogId;
        catalogConsumed = true;
      }

      if (request.catalogProfileCode) {
        const profile = await catalogPort.getProfile({
          code: request.catalogProfileCode,
          requestId: input.requestId,
          signal: readSignal(input),
          timeoutMs: input.timeoutMs,
          retryCount: input.retryCount,
        });
        if (profile.ok && profile.entry) {
          catalogConsumed = true;
          if (!catalogId && catalogResult.catalog?.catalogId) {
            catalogId = catalogResult.catalog.catalogId;
          }
        }
      }

      let rulePackExecutionId: string | undefined;
      let rulePackCode: string | undefined;
      let rulePackConsumed = false;
      try {
        const packExecution = await rulePackEnginePort.executePack({
          code: request.rulePackCode,
          requestId: input.requestId,
          signal: readSignal(input),
          timeoutMs: input.timeoutMs,
          retryCount: input.retryCount,
          attributes: input.attributes,
        });
        if (packExecution.ok && packExecution.execution) {
          rulePackExecutionId = packExecution.execution.executionId;
          rulePackCode = packExecution.execution.packCode;
          rulePackConsumed = true;
          if (!catalogId && packExecution.execution.catalogId) {
            catalogId = packExecution.execution.catalogId;
          }
        }
      } catch {
        // Best-effort Rule Pack Engine — não bloqueia generate estrutural.
      }

      let xmlGenerationResultId: string | undefined;
      let xmlGenerationRuntimeConsumed = false;
      let canonicalStructure: CanonicalXMLResult["canonicalStructure"];
      try {
        const generationResult = await xmlGenerationRuntimePort.generate({
          requestId: input.requestId,
          signal: readSignal(input),
          timeoutMs: input.timeoutMs,
          retryCount: input.retryCount,
          attributes: input.attributes,
          generationId,
          documentId: request.documentId,
          catalogId,
          catalogConsumed,
          rulePackExecutionId,
          rulePackCode,
          rulePackConsumed,
          request: {
            kind: "canonical-xml-generation-request",
            requestId: input.requestId ?? request.requestId,
            generationId,
            documentId: request.documentId,
            catalogId,
            catalogConsumed,
            rulePackExecutionId,
            rulePackCode,
            rulePackConsumed,
            metadata: request.metadata
              ? {
                  kind: "canonical-xml-metadata",
                  sessionId: request.metadata.sessionId,
                  correlationId: request.metadata.correlationId,
                  channel: request.metadata.channel,
                  source: request.metadata.source ?? "xml-runtime",
                  tags: ["tiss-05", "xml-runtime", ...(request.metadata.tags ?? [])],
                  customAttributes: request.metadata.customAttributes,
                }
              : {
                  kind: "canonical-xml-metadata",
                  source: "xml-runtime",
                  tags: ["tiss-05", "xml-runtime"],
                },
            structuralNotes:
              "XMLRuntimePort → XMLGenerationRuntimePort canonical structure (TISS-05 — no real XML).",
          },
        });
        if (generationResult.ok && generationResult.result) {
          xmlGenerationResultId = generationResult.result.resultId;
          xmlGenerationRuntimeConsumed = true;
          canonicalStructure = generationResult.result.structure;
        }
      } catch {
        // Best-effort XML Generation Runtime — não bloqueia generate estrutural.
      }

      const result: CanonicalXMLResult = {
        kind: "canonical-xml-result",
        ok: true,
        request,
        metadata: request.metadata,
        generationId,
        catalogId,
        catalogConsumed,
        rulePackExecutionId,
        rulePackCode,
        rulePackConsumed,
        xmlGenerationResultId,
        canonicalStructure,
        xmlGenerationRuntimeConsumed,
        realXmlGenerated: false,
        status: "completed",
        message:
          "Structural XML generation completed via XMLGenerationRuntimePort (TISS-05 — no real XML produced).",
        code: "XML_RUNTIME_STRUCTURAL_OK",
      };

      generation = {
        ...generation,
        status: "completed",
        result,
        catalogId,
        catalogConsumed,
        rulePackExecutionId,
        rulePackCode,
        rulePackConsumed,
        xmlGenerationResultId,
        canonicalStructure,
        xmlGenerationRuntimeConsumed,
        realXmlGenerated: false,
        message: result.message,
        code: result.code,
        updatedAt: this.now(),
      };
      this.store.setGeneration(generation);

      return {
        ok: true,
        generation,
        result,
        code: "XML_RUNTIME_OK",
        message: result.message,
      };
    });
  }

  async validate(input: ValidateXMLInput): Promise<ValidateXMLResult> {
    return this.runOperation("validate", input, async () => {
      if (input.generationId) {
        const existing = this.store.getGeneration(input.generationId);
        if (!existing) {
          return {
            ok: false,
            valid: false,
            code: "XML_RUNTIME_NOT_FOUND",
            message: "XML generation not found.",
          };
        }
        const catalogPort = this.enterpriseDeps.getTISSCatalogPort();
        const catalogHealth = await catalogPort.health();
        const rulePackHealth = await this.enterpriseDeps.getRulePackEnginePort().health();
        const valid =
          existing.realXmlGenerated === false &&
          catalogHealth.ok === true &&
          rulePackHealth.ok === true &&
          existing.status !== "cancelled" &&
          existing.status !== "failed";

        const result: CanonicalXMLResult = {
          kind: "canonical-xml-result",
          ok: valid,
          request: existing.request,
          metadata: existing.request.metadata,
          generationId: existing.generationId,
          catalogId: existing.catalogId,
          catalogConsumed: existing.catalogConsumed,
          rulePackExecutionId: existing.rulePackExecutionId,
          rulePackCode: existing.rulePackCode,
          rulePackConsumed: existing.rulePackConsumed,
          xmlGenerationResultId: existing.xmlGenerationResultId,
          canonicalStructure: existing.canonicalStructure,
          xmlGenerationRuntimeConsumed: existing.xmlGenerationRuntimeConsumed,
          realXmlGenerated: false,
          status: valid ? "validated" : "failed",
          message: valid
            ? "Structural XML validation passed (no real XML / no ANS rules)."
            : "Structural XML validation failed.",
          code: valid ? "XML_RUNTIME_VALID" : "XML_RUNTIME_INVALID",
        };

        const generation: CanonicalXMLGeneration = {
          ...existing,
          status: valid ? "validated" : existing.status,
          result,
          updatedAt: this.now(),
          message: result.message,
          code: result.code,
        };
        this.store.setGeneration(generation);

        return {
          ok: true,
          valid,
          generation,
          result,
          code: result.code,
          message: result.message,
        };
      }

      const request = resolveRequest(input);
      const hasKind = request.kind === "canonical-xml-request";
      const catalogOk = (await this.enterpriseDeps.getTISSCatalogPort().health()).ok === true;
      const rulePackOk = (await this.enterpriseDeps.getRulePackEnginePort().health()).ok === true;
      const valid = hasKind && catalogOk && rulePackOk;

      const result: CanonicalXMLResult = {
        kind: "canonical-xml-result",
        ok: valid,
        request,
        metadata: request.metadata,
        catalogConsumed: false,
        rulePackConsumed: false,
        xmlGenerationRuntimeConsumed: false,
        realXmlGenerated: false,
        status: valid ? "validated" : "failed",
        message: valid
          ? "Structural request validation passed (TISS-04/TISS-05 foundation)."
          : "Structural request validation failed.",
        code: valid ? "XML_RUNTIME_VALID" : "XML_RUNTIME_INVALID",
      };

      return {
        ok: true,
        valid,
        result,
        code: result.code,
        message: result.message,
      };
    });
  }

  async cancel(input: CancelXMLInput): Promise<CancelXMLResult> {
    return this.runOperation("cancel", input, async () => {
      const existing = this.store.getGeneration(input.generationId);
      if (!existing) {
        return {
          ok: false,
          code: "XML_RUNTIME_NOT_FOUND",
          message: "XML generation not found.",
        };
      }
      if (existing.status === "cancelled") {
        return {
          ok: true,
          generation: existing,
          code: "XML_RUNTIME_ALREADY_CANCELLED",
          message: "XML generation already cancelled.",
        };
      }
      const generation: CanonicalXMLGeneration = {
        ...existing,
        status: "cancelled",
        realXmlGenerated: false,
        message: "XML generation cancelled (structural).",
        code: "XML_RUNTIME_CANCELLED",
        updatedAt: this.now(),
        result: existing.result
          ? {
              ...existing.result,
              ok: false,
              status: "cancelled",
              realXmlGenerated: false,
              message: "XML generation cancelled (structural).",
              code: "XML_RUNTIME_CANCELLED",
            }
          : undefined,
      };
      this.store.setGeneration(generation);
      return {
        ok: true,
        generation,
        code: "XML_RUNTIME_CANCELLED",
        message: generation.message,
      };
    });
  }

  async getGeneration(input: GetXMLGenerationInput): Promise<GetXMLGenerationResult> {
    return this.runOperation("getGeneration", input, async () => {
      const generation = this.store.getGeneration(input.generationId);
      if (!generation) {
        return {
          ok: false,
          code: "XML_RUNTIME_NOT_FOUND",
          message: "XML generation not found.",
        };
      }
      return {
        ok: true,
        generation,
        code: "XML_RUNTIME_OK",
        message: "XML generation loaded.",
      };
    });
  }

  async listGenerations(input: ListXMLGenerationsInput = {}): Promise<ListXMLGenerationsResult> {
    return this.runOperation("listGenerations", input, async () => {
      let generations = this.store.listGenerations();
      if (input.status != null) {
        generations = generations.filter((g) => g.status === input.status);
      }
      return {
        ok: true,
        generations,
        statistics: this.store.statistics(),
        code: "XML_RUNTIME_OK",
        message: `Listed ${generations.length} XML generations.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: XMLRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & XMLRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createXMLRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: XMLRuntimeStructuredLog[] = [];
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
            code: "XML_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & XMLRuntimeOperationEnvelope;
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
            code: body.code ?? "XML_RUNTIME_OK",
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
            code: "XML_RUNTIME_RETRY",
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
        code: "XML_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XMLRuntimeOperationEnvelope;
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
          ? "XML_RUNTIME_CANCELLED"
          : isTimeout
            ? "XML_RUNTIME_TIMEOUT"
            : "XML_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & XMLRuntimeOperationEnvelope;
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
              const err = new Error(`XML Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("XML Runtime operation aborted");
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

/** Alias oficial do adapter enterprise (TISS-04). */
export const EnterpriseXMLRuntimeAdapter = DefaultXMLRuntimeAdapter;
