/**
 * DefaultReturnRuntimeAdapter — C-08 / ECS-01.
 *
 * Adapter oficial do Enterprise Return Runtime.
 * Responde estruturalmente (prepareReturn/getReturn/listReturns/
 * correlateReturn/stats) sem depender de Ports Enterprise.
 *
 * Sem processamento de retorno. Sem correlação automática. Sem reconciliação.
 * Sem parser XML. Sem SOAP. Sem operadoras. Sem banco. Sem workflow.
 *
 * CORRELATION BEFORE PROCESSING (Regra Permanente nº 14).
 */
import {
  DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
  toReturnCapabilities,
} from "../ports/capabilities";
import {
  RETURN_RUNTIME_IDENTITY,
  createReturnContextId,
  createReturnCorrelationId,
  createReturnManifestId,
  createReturnRuntimeRequestId,
} from "../ports/identity";
import type { ReturnRuntimePort } from "../ports/return-runtime-port";
import type { ReturnContext, ReturnManifest, ReturnStateMachine } from "../ports/canonical";
import {
  createEmptyReturnCorrelation,
  createEmptyReturnManifest,
  createEmptyReturnPolicy,
  createEmptyReturnStateMachine,
} from "../ports/canonical";
import type {
  CorrelateReturnInput,
  CorrelateReturnResult,
  GetReturnInput,
  GetReturnResult,
  ListReturnsInput,
  ListReturnsResult,
  PrepareReturnInput,
  PrepareReturnResult,
  ReturnRuntimeCapabilities,
  ReturnRuntimeEnterpriseDeps,
  ReturnRuntimeHealth,
  ReturnRuntimeInfo,
  ReturnRuntimeOperationalControls,
  ReturnRuntimeOperationEnvelope,
  ReturnRuntimeProviderId,
  ReturnRuntimeProviderMetadata,
  ReturnRuntimeStructuredLog,
  ReturnStatsInput,
  ReturnStatsResult,
} from "../ports/types";
import { InMemoryReturnRuntimeStore, type ReturnRuntimeStore } from "../store";

export const DEFAULT_RETURN_RUNTIME_ADAPTER_ID = "default-enterprise-return-runtime";
export const DEFAULT_RETURN_RUNTIME_VERSION = RETURN_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultReturnRuntimeAdapterOptions = {
  provider?: Extract<ReturnRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: ReturnRuntimeStore;
  enterpriseDeps?: ReturnRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  failAttempts?: number;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(input: ReturnRuntimeOperationalControls): AbortSignal | undefined {
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
    returnProcessingImplemented: false,
    automaticCorrelationImplemented: false,
    statusUpdateImplemented: false,
    reconciliationImplemented: false,
    workflowIntegrationImplemented: false,
  } as const;
}

function resolveStateMachine(input: PrepareReturnInput): ReturnStateMachine {
  return createEmptyReturnStateMachine(input.stateMachine ?? input.manifest?.stateMachine);
}

function resolveManifest(input: PrepareReturnInput, stamp: string): ReturnManifest {
  const stateMachine = resolveStateMachine(input);
  const processingPolicy =
    input.processingPolicy ?? input.manifest?.processingPolicy ?? createEmptyReturnPolicy();
  return createEmptyReturnManifest({
    ...input.manifest,
    returnId: input.manifest?.returnId ?? createReturnManifestId(),
    transactionId: input.transactionId ?? input.manifest?.transactionId,
    batchId: input.batchId ?? input.manifest?.batchId,
    operatorId: input.operatorId ?? input.manifest?.operatorId,
    protocolId: input.protocolId ?? input.manifest?.protocolId,
    correlationId: input.correlationId ?? input.manifest?.correlationId,
    receivedAt: input.receivedAt ?? input.manifest?.receivedAt ?? stamp,
    origin: input.origin ?? input.manifest?.origin ?? "UNKNOWN",
    status: input.status ?? input.manifest?.status ?? "OPEN",
    state: input.state ?? input.manifest?.state ?? "RECEIVED",
    stateMachine,
    metadata: input.metadata ?? input.manifest?.metadata,
    payloadReference: input.payloadReference ?? input.manifest?.payloadReference,
    processingPolicy,
    envelope: input.envelope ?? input.manifest?.envelope,
    correlation: input.correlation ?? input.manifest?.correlation,
    operatorProfile: input.operatorProfile ?? input.manifest?.operatorProfile,
    authorizationStrategy: input.authorizationStrategy ?? input.manifest?.authorizationStrategy,
    authorizationPolicy: input.authorizationPolicy ?? input.manifest?.authorizationPolicy,
    batchManifest: input.batchManifest ?? input.manifest?.batchManifest,
    protocolProfile: input.protocolProfile ?? input.manifest?.protocolProfile,
    xmlDocument: input.xmlDocument ?? input.manifest?.xmlDocument,
    auditResult: input.auditResult ?? input.manifest?.auditResult,
    tags: input.tags ?? input.manifest?.tags ?? [],
    owner: input.owner ?? input.manifest?.owner,
    ...structuralFlags(),
  });
}

/**
 * Adapter oficial C-08 — Return Runtime default / enterprise.
 * Nunca processa retorno. Nunca correlaciona automaticamente. Nunca reconcilia.
 * Nunca implementa transições de estado (RULE_11). RULE_14 vigente.
 */
export class DefaultReturnRuntimeAdapter implements ReturnRuntimePort {
  readonly providerId: Extract<ReturnRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: ReturnRuntimeProviderMetadata;
  private readonly store: ReturnRuntimeStore;
  private readonly enterpriseDeps: ReturnRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultReturnRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Return Runtime ready (structural only — no return processing).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default Return Runtime" : RETURN_RUNTIME_IDENTITY.name,
      version: DEFAULT_RETURN_RUNTIME_VERSION,
      vendor: RETURN_RUNTIME_IDENTITY.vendor,
      layer: RETURN_RUNTIME_IDENTITY.layer,
      vendorAgnostic: RETURN_RUNTIME_IDENTITY.vendorAgnostic,
      description: RETURN_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryReturnRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  getStore(): ReturnRuntimeStore {
    return this.store;
  }

  capabilities(): ReturnRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_RETURN_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareReturn: true,
      supportsGetReturn: true,
      supportsListReturns: true,
      supportsCorrelateReturn: true,
      supportsStats: true,
      supportsCanonicalReturnManifest: true,
      supportsReturnCorrelation: true,
      supportsReturnStateMachine: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesProtocolRuntimePort: true,
      usesBatchRuntimePort: true,
      usesAuthorizationRuntimePort: true,
      usesOperatorRuntimePort: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesAuditRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      xmlParserImplemented: false,
      soapImplemented: false,
      operatorCommunicationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toReturnCapabilities(DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): ReturnRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "RETURN_RUNTIME",
      capabilities: { ...DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ReturnRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    let protocolRuntimeOk = true;
    let batchRuntimeOk = true;
    let authorizationRuntimeOk = true;
    let operatorRuntimeOk = true;
    let soapRuntimeOk = true;
    let xmlRuntimeOk = true;
    let xmlValidationRuntimeOk = true;
    let auditRuntimeOk = true;

    if (typeof this.enterpriseDeps.getProtocolRuntimePort === "function") {
      protocolRuntimeOk = portShapeOk(this.enterpriseDeps.getProtocolRuntimePort());
    }
    if (typeof this.enterpriseDeps.getBatchRuntimePort === "function") {
      batchRuntimeOk = portShapeOk(this.enterpriseDeps.getBatchRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuthorizationRuntimePort === "function") {
      authorizationRuntimeOk = portShapeOk(this.enterpriseDeps.getAuthorizationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getOperatorRuntimePort === "function") {
      operatorRuntimeOk = portShapeOk(this.enterpriseDeps.getOperatorRuntimePort());
    }
    if (typeof this.enterpriseDeps.getSOAPRuntimePort === "function") {
      soapRuntimeOk = portShapeOk(this.enterpriseDeps.getSOAPRuntimePort());
    }
    if (typeof this.enterpriseDeps.getXMLRuntimePort === "function") {
      xmlRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuditRuntimePort === "function") {
      auditRuntimeOk = portShapeOk(this.enterpriseDeps.getAuditRuntimePort());
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      protocolRuntimeOk &&
      batchRuntimeOk &&
      authorizationRuntimeOk &&
      operatorRuntimeOk &&
      soapRuntimeOk &&
      xmlRuntimeOk &&
      xmlValidationRuntimeOk &&
      auditRuntimeOk;

    return {
      kind: "canonical-return-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      protocolRuntimeOk,
      batchRuntimeOk,
      authorizationRuntimeOk,
      operatorRuntimeOk,
      soapRuntimeOk,
      xmlRuntimeOk,
      xmlValidationRuntimeOk,
      auditRuntimeOk,
      storedManifestCount: this.store.manifestCount(),
      storedContextCount: this.store.contextCount(),
      storedCorrelationCount: this.store.correlationCount(),
      runtimeReady: true,
      ...structuralFlags(),
      xmlParserImplemented: false,
      soapImplemented: false,
      operatorCommunicationImplemented: false,
      message: this.healthy
        ? ok
          ? "Return Runtime pronto (estrutural C-08 — sem processamento de retorno)."
          : "Return Runtime degradado — ver Ports Enterprise."
        : "Return Runtime unhealthy.",
    };
  }

  async prepareReturn(input: PrepareReturnInput): Promise<PrepareReturnResult> {
    return this.runOperation("prepareReturn", input, async () => {
      const stamp = nowIso(this.now);
      const manifest = resolveManifest(input, stamp);
      this.store.setManifest(manifest);

      const returnContext: ReturnContext = {
        ...(input.returnContext ?? {
          kind: "canonical-return-context" as const,
          contextId: createReturnContextId(),
        }),
        kind: "canonical-return-context",
        contextId: input.returnContext?.contextId ?? createReturnContextId(),
        returnId: manifest.returnId,
        transactionId: manifest.transactionId,
        manifest,
        correlation: manifest.correlation,
        state: manifest.state,
        status: manifest.status,
        stateMachine: manifest.stateMachine,
        origin: manifest.origin,
        operatorProfile: manifest.operatorProfile,
        authorizationStrategy: manifest.authorizationStrategy,
        authorizationPolicy: manifest.authorizationPolicy,
        batchManifest: manifest.batchManifest,
        protocolProfile: manifest.protocolProfile,
        xmlDocument: manifest.xmlDocument,
        auditResult: manifest.auditResult,
        metadata: manifest.metadata,
        envelope: manifest.envelope,
        operationId: input.returnContext?.operationId ?? createReturnRuntimeRequestId(),
        correlationId: manifest.correlationId ?? input.returnContext?.correlationId ?? null,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: manifest.state ?? "RECEIVED",
        processingTime: 0,
        warnings: input.returnContext?.warnings ?? [],
        errors: input.returnContext?.errors ?? [],
        structuralNotes: input.returnContext?.structuralNotes ?? manifest.structuralNotes,
      };
      this.store.setContext(returnContext);

      return {
        ok: true,
        manifest,
        returnContext,
        returnProcessed: false as const,
        returnProcessingImplemented: false as const,
        automaticCorrelationImplemented: false as const,
        code: "RETURN_RUNTIME_OK",
        message:
          "Canonical ReturnManifest structural envelope (C-08 foundation — no return processing / RULE_14).",
      };
    });
  }

  async getReturn(input: GetReturnInput): Promise<GetReturnResult> {
    return this.runOperation("getReturn", input, async () => {
      if (input.returnId) {
        const manifest = this.store.getManifest(input.returnId);
        if (!manifest) {
          return {
            ok: false,
            code: "RETURN_RUNTIME_NOT_FOUND",
            message: "Canonical ReturnManifest not found.",
          };
        }
        return {
          ok: true,
          manifest,
          correlation: manifest.correlation,
          code: "RETURN_RUNTIME_OK",
          message: "Canonical ReturnManifest loaded.",
        };
      }
      if (input.transactionId) {
        const manifests = this.store
          .listManifests()
          .filter((m) => m.transactionId === input.transactionId);
        const manifest = manifests[0];
        if (!manifest) {
          return {
            ok: false,
            code: "RETURN_RUNTIME_NOT_FOUND",
            message: "Canonical ReturnManifest not found for transactionId.",
          };
        }
        return {
          ok: true,
          manifest,
          correlation: manifest.correlation,
          code: "RETURN_RUNTIME_OK",
          message: "Canonical ReturnManifest loaded by transactionId.",
        };
      }
      if (input.contextId) {
        const returnContext = this.store.getContext(input.contextId);
        if (!returnContext) {
          return {
            ok: false,
            code: "RETURN_RUNTIME_NOT_FOUND",
            message: "Canonical ReturnContext not found.",
          };
        }
        return {
          ok: true,
          returnContext,
          manifest: returnContext.manifest,
          correlation: returnContext.correlation,
          code: "RETURN_RUNTIME_OK",
          message: "Canonical ReturnContext loaded.",
        };
      }
      if (input.correlationId) {
        const correlation = this.store.getCorrelation(input.correlationId);
        if (!correlation) {
          return {
            ok: false,
            code: "RETURN_RUNTIME_NOT_FOUND",
            message: "Canonical ReturnCorrelation not found.",
          };
        }
        return {
          ok: true,
          correlation,
          code: "RETURN_RUNTIME_OK",
          message: "Canonical ReturnCorrelation loaded.",
        };
      }
      return {
        ok: false,
        code: "RETURN_RUNTIME_INVALID_INPUT",
        message: "returnId, transactionId, contextId or correlationId is required.",
      };
    });
  }

  async listReturns(input: ListReturnsInput = {}): Promise<ListReturnsResult> {
    return this.runOperation("listReturns", input, async () => {
      let manifests = this.store.listManifests();
      if (input.state != null) {
        manifests = manifests.filter((m) => m.state === input.state);
      }
      if (input.status != null) {
        manifests = manifests.filter((m) => m.status === input.status);
      }
      return {
        ok: true,
        manifests,
        contexts: this.store.listContexts(),
        correlations: this.store.listCorrelations(),
        statistics: this.store.statistics(),
        code: "RETURN_RUNTIME_OK",
        message: `Listed ${manifests.length} canonical ReturnManifests / ${this.store.contextCount()} contexts.`,
      };
    });
  }

  async correlateReturn(input: CorrelateReturnInput): Promise<CorrelateReturnResult> {
    return this.runOperation("correlateReturn", input, async () => {
      const stamp = nowIso(this.now);
      const correlation = createEmptyReturnCorrelation({
        ...input.correlation,
        correlationId: input.correlation?.correlationId ?? createReturnCorrelationId(),
        transactionId: input.transactionId ?? input.correlation?.transactionId,
        authorizationId: input.authorizationId ?? input.correlation?.authorizationId,
        batchId: input.batchId ?? input.correlation?.batchId,
        documentId: input.documentId ?? input.correlation?.documentId,
        operatorId: input.operatorId ?? input.correlation?.operatorId,
        correlationStrategy:
          input.correlationStrategy ?? input.correlation?.correlationStrategy ?? "structural",
        correlationConfidence:
          input.correlationConfidence ?? input.correlation?.correlationConfidence,
        matchedEntities: input.matchedEntities ?? input.correlation?.matchedEntities ?? [],
        notes:
          "Structural correlateReturn envelope — automaticCorrelationImplemented=false (RULE_14). No automatic correlation.",
      });
      this.store.setCorrelation(correlation);

      const manifest =
        input.manifest ??
        createEmptyReturnManifest({
          returnId: createReturnManifestId(),
          transactionId: correlation.transactionId,
          batchId: correlation.batchId,
          operatorId: correlation.operatorId,
          correlationId: correlation.correlationId,
          state: "RECEIVED",
          receivedAt: stamp,
          correlation,
        });
      this.store.setManifest(manifest);

      const returnContext: ReturnContext = {
        ...(input.returnContext ?? {
          kind: "canonical-return-context" as const,
          contextId: createReturnContextId(),
        }),
        kind: "canonical-return-context",
        contextId: input.returnContext?.contextId ?? createReturnContextId(),
        returnId: manifest.returnId,
        transactionId: correlation.transactionId,
        manifest,
        correlation,
        state: "RECEIVED",
        status: manifest.status,
        stateMachine: manifest.stateMachine,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: "RECEIVED",
        processingTime: 0,
        warnings: ["automaticCorrelationImplemented=false — no automatic correlation (RULE_14)"],
        errors: [],
        structuralNotes:
          "Structural ReturnCorrelation contract only — correlation before processing; no functional correlation.",
      };
      this.store.setContext(returnContext);

      return {
        ok: true,
        correlation,
        manifest,
        returnContext,
        correlated: false as const,
        automaticCorrelationImplemented: false as const,
        returnProcessingImplemented: false as const,
        code: "RETURN_RUNTIME_CORRELATION_NOT_IMPLEMENTED",
        message:
          "Canonical ReturnCorrelation structural envelope (C-08 — no automatic correlation; RULE_14).",
      };
    });
  }

  async stats(input: ReturnStatsInput = {}): Promise<ReturnStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const manifest = createEmptyReturnManifest({
        returnId: createReturnManifestId(),
        receivedAt: stamp,
        state: "RECEIVED",
        structuralNotes: "Return Runtime structural statistics",
      });
      return {
        ok: true,
        statistics,
        manifest,
        code: "RETURN_RUNTIME_OK",
        message: `Return Runtime stats: ${statistics.totalManifests} manifests / ${statistics.totalCorrelations} correlations.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: ReturnRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & ReturnRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createReturnRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: ReturnRuntimeStructuredLog[] = [];
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
            code: "RETURN_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & ReturnRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "RETURN_RUNTIME_RETRY",
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
              reject(new Error("Return Runtime operation timed out."));
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
        code: "RETURN_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Return Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ReturnRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Return Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "RETURN_RUNTIME_CANCELLED"
          : isTimeout
            ? "RETURN_RUNTIME_TIMEOUT"
            : "RETURN_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & ReturnRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-08). */
export const EnterpriseReturnRuntimeAdapter = DefaultReturnRuntimeAdapter;
