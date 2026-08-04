/**
 * DefaultSOAPRuntimeAdapter — C-03 / ECS-01.
 *
 * Adapter oficial do Enterprise SOAP Runtime.
 * Responde estruturalmente (prepare/getResponse/listResponses/stats) sem
 * depender de Ports Enterprise.
 *
 * Sem comunicação SOAP. Sem HTTP. Sem WSDL. Sem TLS. Sem certificado.
 * Sem autenticação. Sem MTOM. Sem banco. Sem persistência.
 *
 * TRANSPORT AGNOSTIC (Regra Permanente nº 5).
 */
import {
  DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
  toSOAPCapabilities,
} from "../ports/capabilities";
import {
  SOAP_RUNTIME_IDENTITY,
  createSOAPContextId,
  createSOAPRequestId,
  createSOAPResponseId,
  createSOAPRuntimeRequestId,
} from "../ports/identity";
import type { SOAPRuntimePort } from "../ports/soap-runtime-port";
import type { SOAPContext, SOAPRequest, SOAPResponse } from "../ports/canonical";
import { createDisabledSOAPEnvelope } from "../ports/canonical";
import type {
  GetSOAPResponseInput,
  GetSOAPResponseResult,
  ListSOAPResponsesInput,
  ListSOAPResponsesResult,
  PrepareSOAPInput,
  PrepareSOAPResult,
  SOAPRuntimeCapabilities,
  SOAPRuntimeEnterpriseDeps,
  SOAPRuntimeHealth,
  SOAPRuntimeInfo,
  SOAPRuntimeOperationalControls,
  SOAPRuntimeOperationEnvelope,
  SOAPRuntimeProviderId,
  SOAPRuntimeProviderMetadata,
  SOAPRuntimeStructuredLog,
  SOAPStatsInput,
  SOAPStatsResult,
} from "../ports/types";
import { InMemorySOAPRuntimeStore, type SOAPRuntimeStore } from "../store";

export const DEFAULT_SOAP_RUNTIME_ADAPTER_ID = "default-enterprise-soap-runtime";
export const DEFAULT_SOAP_RUNTIME_VERSION = SOAP_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultSOAPRuntimeAdapterOptions = {
  provider?: Extract<SOAPRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: SOAPRuntimeStore;
  enterpriseDeps?: SOAPRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry operacional). */
  failAttempts?: number;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(input: SOAPRuntimeOperationalControls): AbortSignal | undefined {
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
    soapCommunicationImplemented: false,
    wsdlImplemented: false,
    soapEnvelopeImplemented: false,
    soapFaultImplemented: false,
    certificateImplemented: false,
    tlsImplemented: false,
    mtomImplemented: false,
    compressionImplemented: false,
    retryImplemented: false,
    operatorCommunicationImplemented: false,
  } as const;
}

function resolveContext(input: PrepareSOAPInput): SOAPContext {
  return (
    input.soapContext ?? {
      kind: "canonical-soap-context" as const,
      contextId: createSOAPContextId(),
      xmlDocument: input.xmlDocument,
      xmlValidationResult: input.xmlValidationResult,
      canonicalGuide: input.canonicalGuide,
      qualityAssessment: input.qualityAssessment,
      validationResult: input.validationResult,
      auditResult: input.auditResult,
      structuralNotes: input.request?.structuralNotes,
      executionStatus: "prepared",
      warnings: [],
      errors: [],
    }
  );
}

function resolveRequest(input: PrepareSOAPInput): SOAPRequest {
  const base = input.request ?? {
    kind: "canonical-soap-request" as const,
    ...structuralFlags(),
  };
  const soapContext = resolveContext(input);
  return {
    ...base,
    kind: "canonical-soap-request",
    requestId: base.requestId ?? input.requestId ?? createSOAPRequestId(),
    name: base.name ?? input.name,
    operation: base.operation ?? input.operation ?? "prepare",
    soapContext,
    xmlDocument: base.xmlDocument ?? input.xmlDocument,
    xmlValidationResult: base.xmlValidationResult ?? input.xmlValidationResult,
    canonicalGuide: base.canonicalGuide ?? input.canonicalGuide,
    qualityAssessment: base.qualityAssessment ?? input.qualityAssessment,
    validationResult: base.validationResult ?? input.validationResult,
    auditResult: base.auditResult ?? input.auditResult,
    envelope: base.envelope ?? createDisabledSOAPEnvelope(),
    ...structuralFlags(),
  };
}

/**
 * Adapter oficial C-03 — SOAP Runtime default / enterprise.
 */
export class DefaultSOAPRuntimeAdapter implements SOAPRuntimePort {
  readonly providerId: Extract<SOAPRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: SOAPRuntimeProviderMetadata;
  private readonly store: SOAPRuntimeStore;
  private readonly enterpriseDeps: SOAPRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultSOAPRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} SOAP Runtime ready (structural only — no real SOAP communication).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default SOAP Runtime" : SOAP_RUNTIME_IDENTITY.name,
      version: DEFAULT_SOAP_RUNTIME_VERSION,
      vendor: SOAP_RUNTIME_IDENTITY.vendor,
      layer: SOAP_RUNTIME_IDENTITY.layer,
      vendorAgnostic: SOAP_RUNTIME_IDENTITY.vendorAgnostic,
      description: SOAP_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemorySOAPRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): SOAPRuntimeStore {
    return this.store;
  }

  capabilities(): SOAPRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_SOAP_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepare: true,
      supportsGetResponse: true,
      supportsListResponses: true,
      supportsStats: true,
      supportsCanonicalSOAP: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsHttpEndpoint: false,
      knowsWsdl: false,
      engine: { ...DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toSOAPCapabilities(DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): SOAPRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SOAP_RUNTIME",
      capabilities: { ...DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<SOAPRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // C-03 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
    let xmlRuntimeOk = true;
    let xmlValidationRuntimeOk = true;
    let qualityRuntimeOk = true;
    let autoFillRuntimeOk = true;
    let tissMappingRuntimeOk = true;
    let auditRuntimeOk = true;
    let validationRuntimeOk = true;

    if (typeof this.enterpriseDeps.getXMLRuntimePort === "function") {
      xmlRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLRuntimePort());
    }
    if (typeof this.enterpriseDeps.getXMLValidationRuntimePort === "function") {
      xmlValidationRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLValidationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getQualityRuntimePort === "function") {
      qualityRuntimeOk = portShapeOk(this.enterpriseDeps.getQualityRuntimePort());
    }
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

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      xmlRuntimeOk &&
      xmlValidationRuntimeOk &&
      qualityRuntimeOk &&
      autoFillRuntimeOk &&
      tissMappingRuntimeOk &&
      auditRuntimeOk &&
      validationRuntimeOk;

    return {
      kind: "canonical-soap-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      xmlRuntimeOk,
      xmlValidationRuntimeOk,
      qualityRuntimeOk,
      autoFillRuntimeOk,
      tissMappingRuntimeOk,
      auditRuntimeOk,
      validationRuntimeOk,
      storedResponseCount: this.store.responseCount(),
      storedRequestCount: this.store.requestCount(),
      storedContextCount: this.store.contextCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "SOAP Runtime pronto (estrutural C-03 — sem comunicação SOAP real)."
          : "SOAP Runtime degradado — ver Ports Enterprise."
        : "SOAP Runtime unhealthy.",
    };
  }

  async prepare(input: PrepareSOAPInput): Promise<PrepareSOAPResult> {
    return this.runOperation("prepare", input, async () => {
      const request = resolveRequest(input);
      const stamp = nowIso(this.now);
      const responseId = createSOAPResponseId();
      this.store.setRequest(request);

      const soapContext: SOAPContext = {
        ...request.soapContext!,
        requestId: request.requestId,
        responseId,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: "prepared",
        executionDuration: 0,
        processedItems: 0,
        warnings: request.soapContext?.warnings ?? [],
        errors: request.soapContext?.errors ?? [],
      };

      const response: SOAPResponse = {
        kind: "canonical-soap-response",
        ok: true,
        responseId,
        request,
        envelope: request.envelope ?? createDisabledSOAPEnvelope(),
        soapContext,
        xmlDocument: request.xmlDocument,
        xmlValidationResult: request.xmlValidationResult,
        canonicalGuide: request.canonicalGuide,
        qualityAssessment: request.qualityAssessment,
        validationResult: request.validationResult,
        auditResult: request.auditResult,
        communicationExecuted: false,
        realCommunicationPerformed: false,
        wsdlLoaded: false,
        certificateUsed: false,
        tlsEstablished: false,
        runtimeReady: true,
        ...structuralFlags(),
        status: "prepared",
        message:
          "Canonical SOAP structural response (C-03 foundation — no real SOAP / HTTP / WSDL / TLS).",
        code: "SOAP_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResponse(response);
      this.store.setContext(soapContext);

      return {
        ok: true,
        response,
        code: "SOAP_RUNTIME_OK",
        message: response.message,
      };
    });
  }

  async getResponse(input: GetSOAPResponseInput): Promise<GetSOAPResponseResult> {
    return this.runOperation("getResponse", input, async () => {
      const response = this.store.getResponse(input.responseId);
      if (!response) {
        return {
          ok: false,
          code: "SOAP_RUNTIME_NOT_FOUND",
          message: "Canonical SOAP response not found.",
        };
      }
      return {
        ok: true,
        response,
        code: "SOAP_RUNTIME_OK",
        message: "Canonical SOAP response loaded.",
      };
    });
  }

  async listResponses(input: ListSOAPResponsesInput = {}): Promise<ListSOAPResponsesResult> {
    return this.runOperation("listResponses", input, async () => {
      let responses = this.store.listResponses();
      if (input.status != null) {
        responses = responses.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        responses,
        statistics: this.store.statistics(),
        code: "SOAP_RUNTIME_OK",
        message: `Listed ${responses.length} canonical SOAP responses.`,
      };
    });
  }

  async stats(input: SOAPStatsInput = {}): Promise<SOAPStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const response: SOAPResponse = {
        kind: "canonical-soap-response",
        ok: true,
        responseId: createSOAPResponseId(),
        request: {
          kind: "canonical-soap-request",
          operation: "stats",
          ...structuralFlags(),
        },
        communicationExecuted: false,
        realCommunicationPerformed: false,
        wsdlLoaded: false,
        certificateUsed: false,
        tlsEstablished: false,
        runtimeReady: true,
        ...structuralFlags(),
        status: "pending",
        message: "Canonical SOAP Runtime structural statistics.",
        code: "SOAP_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      return {
        ok: true,
        statistics,
        response,
        code: "SOAP_RUNTIME_OK",
        message: `SOAP Runtime stats: ${statistics.totalResponses} responses.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: SOAPRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & SOAPRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createSOAPRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: SOAPRuntimeStructuredLog[] = [];
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
            code: "SOAP_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & SOAPRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "SOAP_RUNTIME_RETRY",
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
              reject(new Error("SOAP Runtime operation timed out."));
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
        code: "SOAP_RUNTIME_RETRY_EXHAUSTED",
        message: lastError instanceof Error ? lastError.message : "SOAP Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & SOAPRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "SOAP Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "SOAP_RUNTIME_CANCELLED"
          : isTimeout
            ? "SOAP_RUNTIME_TIMEOUT"
            : "SOAP_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & SOAPRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-03). */
export const EnterpriseSOAPRuntimeAdapter = DefaultSOAPRuntimeAdapter;
