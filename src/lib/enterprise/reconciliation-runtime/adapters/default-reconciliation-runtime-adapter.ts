/**
 * DefaultReconciliationRuntimeAdapter — C-09 / ECS-01.
 *
 * Adapter oficial do Enterprise Reconciliation Runtime.
 * Responde estruturalmente (prepareReconciliation/getReconciliation/
 * listReconciliations/correlateReconciliation/stats) sem depender de
 * Ports Enterprise.
 *
 * Sem reconciliação funcional. Sem matching automático. Sem resolução
 * de conflitos. Sem comparação entre documentos. Sem XML. Sem SOAP.
 * Sem banco. Sem workflow.
 *
 * RECONCILIATION IS DETERMINISTIC (Regra Permanente nº 16).
 */
import {
  DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
  toReconciliationCapabilities,
} from "../ports/capabilities";
import {
  RECONCILIATION_RUNTIME_IDENTITY,
  createReconciliationContextId,
  createReconciliationCorrelationId,
  createReconciliationManifestId,
  createReconciliationRuntimeRequestId,
} from "../ports/identity";
import type { ReconciliationRuntimePort } from "../ports/reconciliation-runtime-port";
import type {
  CanonicalReconciliationResult,
  ReconciliationContext,
  ReconciliationManifest,
  ReconciliationStateMachine,
} from "../ports/canonical";
import {
  createEmptyCanonicalReconciliationResult,
  createEmptyReconciliationCorrelation,
  createEmptyReconciliationManifest,
  createEmptyReconciliationPolicy,
  createEmptyReconciliationStateMachine,
} from "../ports/canonical";
import type {
  CorrelateReconciliationInput,
  CorrelateReconciliationResult,
  GetReconciliationInput,
  GetReconciliationResult,
  ListReconciliationsInput,
  ListReconciliationsResult,
  PrepareReconciliationInput,
  PrepareReconciliationResult,
  ReconciliationRuntimeCapabilities,
  ReconciliationRuntimeEnterpriseDeps,
  ReconciliationRuntimeHealth,
  ReconciliationRuntimeInfo,
  ReconciliationRuntimeOperationalControls,
  ReconciliationRuntimeOperationEnvelope,
  ReconciliationRuntimeProviderId,
  ReconciliationRuntimeProviderMetadata,
  ReconciliationRuntimeStructuredLog,
  ReconciliationStatsInput,
  ReconciliationStatsResult,
} from "../ports/types";
import { InMemoryReconciliationRuntimeStore, type ReconciliationRuntimeStore } from "../store";

export const DEFAULT_RECONCILIATION_RUNTIME_ADAPTER_ID =
  "default-enterprise-reconciliation-runtime";
export const DEFAULT_RECONCILIATION_RUNTIME_VERSION = RECONCILIATION_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultReconciliationRuntimeAdapterOptions = {
  provider?: Extract<ReconciliationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: ReconciliationRuntimeStore;
  enterpriseDeps?: ReconciliationRuntimeEnterpriseDeps;
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

function readSignal(input: ReconciliationRuntimeOperationalControls): AbortSignal | undefined {
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
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    automaticMatchingImplemented: false,
    workflowIntegrationImplemented: false,
  } as const;
}

function resolveStateMachine(input: PrepareReconciliationInput): ReconciliationStateMachine {
  return createEmptyReconciliationStateMachine(input.stateMachine ?? input.manifest?.stateMachine);
}

function resolveManifest(input: PrepareReconciliationInput, stamp: string): ReconciliationManifest {
  const stateMachine = resolveStateMachine(input);
  const reconciliationPolicy =
    input.reconciliationPolicy ??
    input.manifest?.reconciliationPolicy ??
    createEmptyReconciliationPolicy();
  return createEmptyReconciliationManifest({
    ...input.manifest,
    reconciliationId: input.manifest?.reconciliationId ?? createReconciliationManifestId(),
    transactionId: input.transactionId ?? input.manifest?.transactionId,
    batchId: input.batchId ?? input.manifest?.batchId,
    operatorId: input.operatorId ?? input.manifest?.operatorId,
    correlationId: input.correlationId ?? input.manifest?.correlationId,
    returnId: input.returnId ?? input.manifest?.returnId,
    protocolId: input.protocolId ?? input.manifest?.protocolId,
    receivedAt: input.receivedAt ?? input.manifest?.receivedAt ?? stamp,
    state: input.state ?? input.manifest?.state ?? "PENDING",
    stateMachine,
    metadata: input.metadata ?? input.manifest?.metadata,
    reconciliationPolicy,
    correlation: input.correlation ?? input.manifest?.correlation,
    result: input.result ?? input.manifest?.result,
    operatorProfile: input.operatorProfile ?? input.manifest?.operatorProfile,
    authorizationStrategy: input.authorizationStrategy ?? input.manifest?.authorizationStrategy,
    authorizationPolicy: input.authorizationPolicy ?? input.manifest?.authorizationPolicy,
    batchManifest: input.batchManifest ?? input.manifest?.batchManifest,
    protocolProfile: input.protocolProfile ?? input.manifest?.protocolProfile,
    returnManifest: input.returnManifest ?? input.manifest?.returnManifest,
    auditResult: input.auditResult ?? input.manifest?.auditResult,
    tags: input.tags ?? input.manifest?.tags ?? [],
    owner: input.owner ?? input.manifest?.owner,
    ...structuralFlags(),
  });
}

/**
 * Adapter oficial C-09 — Reconciliation Runtime default / enterprise.
 * Nunca reconcilia. Nunca faz matching. Nunca resolve conflitos.
 * Nunca implementa transições de estado (RULE_11). RULE_16 vigente.
 */
export class DefaultReconciliationRuntimeAdapter implements ReconciliationRuntimePort {
  readonly providerId: Extract<ReconciliationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: ReconciliationRuntimeProviderMetadata;
  private readonly store: ReconciliationRuntimeStore;
  private readonly enterpriseDeps: ReconciliationRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultReconciliationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Reconciliation Runtime ready (structural only — no functional reconciliation).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Reconciliation Runtime"
          : RECONCILIATION_RUNTIME_IDENTITY.name,
      version: DEFAULT_RECONCILIATION_RUNTIME_VERSION,
      vendor: RECONCILIATION_RUNTIME_IDENTITY.vendor,
      layer: RECONCILIATION_RUNTIME_IDENTITY.layer,
      vendorAgnostic: RECONCILIATION_RUNTIME_IDENTITY.vendorAgnostic,
      description: RECONCILIATION_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryReconciliationRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  getStore(): ReconciliationRuntimeStore {
    return this.store;
  }

  capabilities(): ReconciliationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_RECONCILIATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareReconciliation: true,
      supportsGetReconciliation: true,
      supportsListReconciliations: true,
      supportsCorrelateReconciliation: true,
      supportsStats: true,
      supportsCanonicalReconciliationManifest: true,
      supportsCanonicalReconciliationResult: true,
      supportsReconciliationCorrelation: true,
      supportsReconciliationStateMachine: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesReturnRuntimePort: true,
      usesProtocolRuntimePort: true,
      usesBatchRuntimePort: true,
      usesAuthorizationRuntimePort: true,
      usesOperatorRuntimePort: true,
      usesAuditRuntimePort: true,
      usesWorkflowRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      engine: { ...DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toReconciliationCapabilities(DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): ReconciliationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "RECONCILIATION_RUNTIME",
      capabilities: { ...DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ReconciliationRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    let returnRuntimeOk = true;
    let protocolRuntimeOk = true;
    let batchRuntimeOk = true;
    let authorizationRuntimeOk = true;
    let operatorRuntimeOk = true;
    let auditRuntimeOk = true;
    let workflowRuntimeOk = true;

    if (typeof this.enterpriseDeps.getReturnRuntimePort === "function") {
      returnRuntimeOk = portShapeOk(this.enterpriseDeps.getReturnRuntimePort());
    }
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
    if (typeof this.enterpriseDeps.getAuditRuntimePort === "function") {
      auditRuntimeOk = portShapeOk(this.enterpriseDeps.getAuditRuntimePort());
    }
    if (typeof this.enterpriseDeps.getWorkflowRuntimePort === "function") {
      workflowRuntimeOk = portShapeOk(this.enterpriseDeps.getWorkflowRuntimePort());
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      returnRuntimeOk &&
      protocolRuntimeOk &&
      batchRuntimeOk &&
      authorizationRuntimeOk &&
      operatorRuntimeOk &&
      auditRuntimeOk &&
      workflowRuntimeOk;

    return {
      kind: "canonical-reconciliation-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      returnRuntimeOk,
      protocolRuntimeOk,
      batchRuntimeOk,
      authorizationRuntimeOk,
      operatorRuntimeOk,
      auditRuntimeOk,
      workflowRuntimeOk,
      storedManifestCount: this.store.manifestCount(),
      storedContextCount: this.store.contextCount(),
      storedCorrelationCount: this.store.correlationCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Reconciliation Runtime pronto (estrutural C-09 — sem reconciliação funcional)."
          : "Reconciliation Runtime degradado — ver Ports Enterprise."
        : "Reconciliation Runtime unhealthy.",
    };
  }

  async prepareReconciliation(
    input: PrepareReconciliationInput,
  ): Promise<PrepareReconciliationResult> {
    return this.runOperation("prepareReconciliation", input, async () => {
      const stamp = nowIso(this.now);
      const manifest = resolveManifest(input, stamp);
      this.store.setManifest(manifest);

      const result: CanonicalReconciliationResult =
        input.result ??
        createEmptyCanonicalReconciliationResult({
          transactionId: manifest.transactionId,
          batchId: manifest.batchId,
          operatorId: manifest.operatorId,
          auditReference: manifest.auditResult ? "structural-audit-ref" : undefined,
        });
      this.store.setResult(result);

      const reconciliationContext: ReconciliationContext = {
        ...(input.reconciliationContext ?? {
          kind: "canonical-reconciliation-context" as const,
          contextId: createReconciliationContextId(),
        }),
        kind: "canonical-reconciliation-context",
        contextId: input.reconciliationContext?.contextId ?? createReconciliationContextId(),
        reconciliationId: manifest.reconciliationId,
        transactionId: manifest.transactionId,
        manifest,
        correlation: manifest.correlation,
        result,
        state: manifest.state,
        stateMachine: manifest.stateMachine,
        operatorProfile: manifest.operatorProfile,
        authorizationStrategy: manifest.authorizationStrategy,
        authorizationPolicy: manifest.authorizationPolicy,
        batchManifest: manifest.batchManifest,
        protocolProfile: manifest.protocolProfile,
        returnManifest: manifest.returnManifest,
        auditResult: manifest.auditResult,
        metadata: manifest.metadata,
        operationId:
          input.reconciliationContext?.operationId ?? createReconciliationRuntimeRequestId(),
        correlationId: manifest.correlationId ?? input.reconciliationContext?.correlationId ?? null,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: manifest.state ?? "PENDING",
        executionDuration: 0,
        warnings: input.reconciliationContext?.warnings ?? [],
        errors: input.reconciliationContext?.errors ?? [],
        structuralNotes: input.reconciliationContext?.structuralNotes ?? manifest.structuralNotes,
      };
      this.store.setContext(reconciliationContext);

      return {
        ok: true,
        manifest,
        reconciliationContext,
        result,
        reconciled: false as const,
        reconciliationImplemented: false as const,
        conflictResolutionImplemented: false as const,
        automaticMatchingImplemented: false as const,
        workflowIntegrationImplemented: false as const,
        code: "RECONCILIATION_RUNTIME_OK",
        message:
          "Canonical ReconciliationManifest structural envelope (C-09 foundation — no functional reconciliation / RULE_16).",
      };
    });
  }

  async getReconciliation(input: GetReconciliationInput): Promise<GetReconciliationResult> {
    return this.runOperation("getReconciliation", input, async () => {
      if (input.reconciliationId) {
        const manifest = this.store.getManifest(input.reconciliationId);
        if (!manifest) {
          return {
            ok: false,
            code: "RECONCILIATION_RUNTIME_NOT_FOUND",
            message: "Canonical ReconciliationManifest not found.",
          };
        }
        return {
          ok: true,
          manifest,
          correlation: manifest.correlation,
          result: manifest.result,
          code: "RECONCILIATION_RUNTIME_OK",
          message: "Canonical ReconciliationManifest loaded.",
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
            code: "RECONCILIATION_RUNTIME_NOT_FOUND",
            message: "Canonical ReconciliationManifest not found for transactionId.",
          };
        }
        return {
          ok: true,
          manifest,
          correlation: manifest.correlation,
          result: manifest.result,
          code: "RECONCILIATION_RUNTIME_OK",
          message: "Canonical ReconciliationManifest loaded by transactionId.",
        };
      }
      if (input.contextId) {
        const reconciliationContext = this.store.getContext(input.contextId);
        if (!reconciliationContext) {
          return {
            ok: false,
            code: "RECONCILIATION_RUNTIME_NOT_FOUND",
            message: "Canonical ReconciliationContext not found.",
          };
        }
        return {
          ok: true,
          reconciliationContext,
          manifest: reconciliationContext.manifest,
          correlation: reconciliationContext.correlation,
          result: reconciliationContext.result,
          code: "RECONCILIATION_RUNTIME_OK",
          message: "Canonical ReconciliationContext loaded.",
        };
      }
      if (input.correlationId) {
        const correlation = this.store.getCorrelation(input.correlationId);
        if (!correlation) {
          return {
            ok: false,
            code: "RECONCILIATION_RUNTIME_NOT_FOUND",
            message: "Canonical ReconciliationCorrelation not found.",
          };
        }
        return {
          ok: true,
          correlation,
          code: "RECONCILIATION_RUNTIME_OK",
          message: "Canonical ReconciliationCorrelation loaded.",
        };
      }
      return {
        ok: false,
        code: "RECONCILIATION_RUNTIME_INVALID_INPUT",
        message: "reconciliationId, transactionId, contextId or correlationId is required.",
      };
    });
  }

  async listReconciliations(
    input: ListReconciliationsInput = {},
  ): Promise<ListReconciliationsResult> {
    return this.runOperation("listReconciliations", input, async () => {
      let manifests = this.store.listManifests();
      if (input.state != null) {
        manifests = manifests.filter((m) => m.state === input.state);
      }
      return {
        ok: true,
        manifests,
        contexts: this.store.listContexts(),
        correlations: this.store.listCorrelations(),
        results: this.store.listResults(),
        statistics: this.store.statistics(),
        code: "RECONCILIATION_RUNTIME_OK",
        message: `Listed ${manifests.length} canonical ReconciliationManifests / ${this.store.contextCount()} contexts.`,
      };
    });
  }

  async correlateReconciliation(
    input: CorrelateReconciliationInput,
  ): Promise<CorrelateReconciliationResult> {
    return this.runOperation("correlateReconciliation", input, async () => {
      const stamp = nowIso(this.now);
      const correlation = createEmptyReconciliationCorrelation({
        ...input.correlation,
        correlationId: input.correlation?.correlationId ?? createReconciliationCorrelationId(),
        transactionId: input.transactionId ?? input.correlation?.transactionId,
        batchId: input.batchId ?? input.correlation?.batchId,
        operatorId: input.operatorId ?? input.correlation?.operatorId,
        returnId: input.returnId ?? input.correlation?.returnId,
        documentId: input.documentId ?? input.correlation?.documentId,
        correlationStrategy:
          input.correlationStrategy ?? input.correlation?.correlationStrategy ?? "structural",
        correlationConfidence:
          input.correlationConfidence ?? input.correlation?.correlationConfidence,
        matchedEntities: input.matchedEntities ?? input.correlation?.matchedEntities ?? [],
        notes:
          "Structural correlateReconciliation envelope — automaticMatchingImplemented=false (RULE_14/RULE_16). No automatic matching.",
      });
      this.store.setCorrelation(correlation);

      const manifest =
        input.manifest ??
        createEmptyReconciliationManifest({
          reconciliationId: createReconciliationManifestId(),
          transactionId: correlation.transactionId,
          batchId: correlation.batchId,
          operatorId: correlation.operatorId,
          returnId: correlation.returnId,
          correlationId: correlation.correlationId,
          state: "PENDING",
          receivedAt: stamp,
          correlation,
        });
      this.store.setManifest(manifest);

      const reconciliationContext: ReconciliationContext = {
        ...(input.reconciliationContext ?? {
          kind: "canonical-reconciliation-context" as const,
          contextId: createReconciliationContextId(),
        }),
        kind: "canonical-reconciliation-context",
        contextId: input.reconciliationContext?.contextId ?? createReconciliationContextId(),
        reconciliationId: manifest.reconciliationId,
        transactionId: correlation.transactionId,
        manifest,
        correlation,
        state: "PENDING",
        stateMachine: manifest.stateMachine,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: "PENDING",
        executionDuration: 0,
        warnings: ["automaticMatchingImplemented=false — no automatic matching (RULE_16)"],
        errors: [],
        structuralNotes:
          "Structural ReconciliationCorrelation contract only — no functional matching / reconciliation.",
      };
      this.store.setContext(reconciliationContext);

      return {
        ok: true,
        correlation,
        manifest,
        reconciliationContext,
        matched: false as const,
        automaticMatchingImplemented: false as const,
        reconciliationImplemented: false as const,
        conflictResolutionImplemented: false as const,
        workflowIntegrationImplemented: false as const,
        code: "RECONCILIATION_RUNTIME_MATCHING_NOT_IMPLEMENTED",
        message:
          "Canonical ReconciliationCorrelation structural envelope (C-09 — no automatic matching; RULE_16).",
      };
    });
  }

  async stats(input: ReconciliationStatsInput = {}): Promise<ReconciliationStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const manifest = createEmptyReconciliationManifest({
        reconciliationId: createReconciliationManifestId(),
        receivedAt: stamp,
        state: "PENDING",
        structuralNotes: "Reconciliation Runtime structural statistics",
      });
      return {
        ok: true,
        statistics,
        manifest,
        code: "RECONCILIATION_RUNTIME_OK",
        message: `Reconciliation Runtime stats: ${statistics.totalManifests} manifests / ${statistics.totalResults} results.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: ReconciliationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & ReconciliationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createReconciliationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: ReconciliationRuntimeStructuredLog[] = [];
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
            code: "RECONCILIATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & ReconciliationRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "RECONCILIATION_RUNTIME_RETRY",
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
              reject(new Error("Reconciliation Runtime operation timed out."));
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
        code: "RECONCILIATION_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error
            ? lastError.message
            : "Reconciliation Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & ReconciliationRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "Reconciliation Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "RECONCILIATION_RUNTIME_CANCELLED"
          : isTimeout
            ? "RECONCILIATION_RUNTIME_TIMEOUT"
            : "RECONCILIATION_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & ReconciliationRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-09). */
export const EnterpriseReconciliationRuntimeAdapter = DefaultReconciliationRuntimeAdapter;
