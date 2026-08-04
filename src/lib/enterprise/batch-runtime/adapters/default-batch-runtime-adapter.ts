/**
 * DefaultBatchRuntimeAdapter — C-06 / ECS-01.
 *
 * Adapter oficial do Enterprise Batch Runtime.
 * Responde estruturalmente (prepareBatch/getBatch/listBatches/stats)
 * sem depender de Ports Enterprise.
 *
 * Sem processamento em lote. Sem filas. Sem workers. Sem retry funcional.
 * Sem scheduler. Sem paralelismo. Sem SOAP/XML funcional. Sem banco.
 *
 * STATE MACHINE FIRST (Regra Permanente nº 11).
 */
import {
  DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
  toBatchCapabilities,
} from "../ports/capabilities";
import {
  BATCH_RUNTIME_IDENTITY,
  createBatchContextId,
  createBatchId,
  createBatchPolicyId,
  createBatchRuntimeRequestId,
} from "../ports/identity";
import type { BatchRuntimePort } from "../ports/batch-runtime-port";
import type { BatchContext, BatchManifest, BatchStateMachine } from "../ports/canonical";
import {
  createEmptyBatchManifest,
  createEmptyBatchPolicy,
  createEmptyBatchStateMachine,
} from "../ports/canonical";
import type {
  BatchRuntimeCapabilities,
  BatchRuntimeEnterpriseDeps,
  BatchRuntimeHealth,
  BatchRuntimeInfo,
  BatchRuntimeOperationalControls,
  BatchRuntimeOperationEnvelope,
  BatchRuntimeProviderId,
  BatchRuntimeProviderMetadata,
  BatchRuntimeStructuredLog,
  BatchStatsInput,
  BatchStatsResult,
  GetBatchInput,
  GetBatchResult,
  ListBatchesInput,
  ListBatchesResult,
  PrepareBatchInput,
  PrepareBatchResult,
} from "../ports/types";
import { InMemoryBatchRuntimeStore, type BatchRuntimeStore } from "../store";

export const DEFAULT_BATCH_RUNTIME_ADAPTER_ID = "default-enterprise-batch-runtime";
export const DEFAULT_BATCH_RUNTIME_VERSION = BATCH_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultBatchRuntimeAdapterOptions = {
  provider?: Extract<BatchRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: BatchRuntimeStore;
  enterpriseDeps?: BatchRuntimeEnterpriseDeps;
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

function readSignal(input: BatchRuntimeOperationalControls): AbortSignal | undefined {
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
    batchProcessingImplemented: false,
    parallelExecutionImplemented: false,
    retryImplemented: false,
    schedulerImplemented: false,
    workerImplemented: false,
    queueImplemented: false,
  } as const;
}

function resolveStateMachine(input: PrepareBatchInput): BatchStateMachine {
  return createEmptyBatchStateMachine(input.stateMachine ?? input.manifest?.stateMachine);
}

function resolveManifest(input: PrepareBatchInput, stamp: string): BatchManifest {
  const stateMachine = resolveStateMachine(input);
  const retryPolicy =
    input.retryPolicy ??
    input.manifest?.retryPolicy ??
    createEmptyBatchPolicy({ policyId: createBatchPolicyId() });
  const base = createEmptyBatchManifest({
    ...input.manifest,
    batchId: input.manifest?.batchId ?? createBatchId(),
    batchName: input.batchName ?? input.manifest?.batchName,
    documents: input.documents ?? input.manifest?.documents ?? [],
    operatorProfile: input.operatorProfile ?? input.manifest?.operatorProfile,
    submissionStrategy: input.submissionStrategy ?? input.manifest?.submissionStrategy,
    priority: input.priority ?? input.manifest?.priority ?? "normal",
    state: input.state ?? input.manifest?.state ?? "CREATED",
    stateMachine,
    dependencies: input.dependencies ?? input.manifest?.dependencies,
    retryPolicy,
    creationTimestamp: input.manifest?.creationTimestamp ?? stamp,
    requestedExecutionTime: input.requestedExecutionTime ?? input.manifest?.requestedExecutionTime,
    owner: input.owner ?? input.manifest?.owner,
    tags: input.tags ?? input.manifest?.tags ?? [],
    authorizationStrategy: input.authorizationStrategy ?? input.manifest?.authorizationStrategy,
    authorizationPolicy: input.authorizationPolicy ?? input.manifest?.authorizationPolicy,
    xmlDocument: input.xmlDocument ?? input.manifest?.xmlDocument,
    xmlValidationResult: input.xmlValidationResult ?? input.manifest?.xmlValidationResult,
    qualityAssessment: input.qualityAssessment ?? input.manifest?.qualityAssessment,
    auditResult: input.auditResult ?? input.manifest?.auditResult,
    ...structuralFlags(),
  });
  return base;
}

/**
 * Adapter oficial C-06 — Batch Runtime default / enterprise.
 * Nunca processa lote. Nunca enfileira. Nunca envia. Nunca executa workers.
 * Nunca implementa transições de estado (Regra Permanente nº 11).
 */
export class DefaultBatchRuntimeAdapter implements BatchRuntimePort {
  readonly providerId: Extract<BatchRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: BatchRuntimeProviderMetadata;
  private readonly store: BatchRuntimeStore;
  private readonly enterpriseDeps: BatchRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultBatchRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Batch Runtime ready (structural only — no batch processing).`;
    this.metadata = {
      name: this.providerId === "default" ? "Default Batch Runtime" : BATCH_RUNTIME_IDENTITY.name,
      version: DEFAULT_BATCH_RUNTIME_VERSION,
      vendor: BATCH_RUNTIME_IDENTITY.vendor,
      layer: BATCH_RUNTIME_IDENTITY.layer,
      vendorAgnostic: BATCH_RUNTIME_IDENTITY.vendorAgnostic,
      description: BATCH_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryBatchRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  getStore(): BatchRuntimeStore {
    return this.store;
  }

  capabilities(): BatchRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_BATCH_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareBatch: true,
      supportsGetBatch: true,
      supportsListBatches: true,
      supportsStats: true,
      supportsCanonicalBatchManifest: true,
      supportsBatchStateMachine: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAuthorizationRuntimePort: true,
      usesOperatorRuntimePort: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAuditRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      soapFunctionalImplemented: false,
      xmlFunctionalImplemented: false,
      operatorCommunicationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toBatchCapabilities(DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): BatchRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "BATCH_RUNTIME",
      capabilities: { ...DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<BatchRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    let authorizationRuntimeOk = true;
    let operatorRuntimeOk = true;
    let soapRuntimeOk = true;
    let xmlRuntimeOk = true;
    let xmlValidationRuntimeOk = true;
    let qualityRuntimeOk = true;
    let auditRuntimeOk = true;

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
    if (typeof this.enterpriseDeps.getXMLValidationRuntimePort === "function") {
      xmlValidationRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLValidationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getQualityRuntimePort === "function") {
      qualityRuntimeOk = portShapeOk(this.enterpriseDeps.getQualityRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuditRuntimePort === "function") {
      auditRuntimeOk = portShapeOk(this.enterpriseDeps.getAuditRuntimePort());
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      authorizationRuntimeOk &&
      operatorRuntimeOk &&
      soapRuntimeOk &&
      xmlRuntimeOk &&
      xmlValidationRuntimeOk &&
      qualityRuntimeOk &&
      auditRuntimeOk;

    return {
      kind: "canonical-batch-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      authorizationRuntimeOk,
      operatorRuntimeOk,
      soapRuntimeOk,
      xmlRuntimeOk,
      xmlValidationRuntimeOk,
      qualityRuntimeOk,
      auditRuntimeOk,
      storedManifestCount: this.store.manifestCount(),
      storedDocumentCount: this.store.documentCount(),
      storedContextCount: this.store.contextCount(),
      runtimeReady: true,
      ...structuralFlags(),
      soapFunctionalImplemented: false,
      xmlFunctionalImplemented: false,
      operatorCommunicationImplemented: false,
      message: this.healthy
        ? ok
          ? "Batch Runtime pronto (estrutural C-06 — sem processamento em lote)."
          : "Batch Runtime degradado — ver Ports Enterprise."
        : "Batch Runtime unhealthy.",
    };
  }

  async prepareBatch(input: PrepareBatchInput): Promise<PrepareBatchResult> {
    return this.runOperation("prepareBatch", input, async () => {
      const stamp = nowIso(this.now);
      const manifest = resolveManifest(input, stamp);
      for (const document of manifest.documents ?? []) {
        this.store.setDocument(document);
      }
      this.store.setManifest(manifest);

      const batchContext: BatchContext = {
        ...(input.batchContext ?? {
          kind: "canonical-batch-context" as const,
          contextId: createBatchContextId(),
        }),
        kind: "canonical-batch-context",
        contextId: input.batchContext?.contextId ?? createBatchContextId(),
        batchId: manifest.batchId,
        manifest,
        state: manifest.state,
        stateMachine: manifest.stateMachine,
        operatorProfile: manifest.operatorProfile,
        authorizationStrategy: manifest.authorizationStrategy,
        authorizationPolicy: manifest.authorizationPolicy,
        xmlDocument: manifest.xmlDocument,
        xmlValidationResult: manifest.xmlValidationResult,
        qualityAssessment: manifest.qualityAssessment,
        auditResult: manifest.auditResult,
        metadata: manifest.metadata,
        startedAt: stamp,
        finishedAt: stamp,
        executionStatus: manifest.state ?? "CREATED",
        executionDuration: 0,
        processedItems: 0,
        warnings: input.batchContext?.warnings ?? [],
        errors: input.batchContext?.errors ?? [],
        structuralNotes: input.batchContext?.structuralNotes ?? manifest.structuralNotes,
      };
      this.store.setContext(batchContext);

      return {
        ok: true,
        manifest,
        batchContext,
        batchProcessed: false as const,
        code: "BATCH_RUNTIME_OK",
        message:
          "Canonical BatchManifest structural envelope (C-06 foundation — no batch processing / queues / workers / retry / scheduler).",
      };
    });
  }

  async getBatch(input: GetBatchInput): Promise<GetBatchResult> {
    return this.runOperation("getBatch", input, async () => {
      if (input.batchId) {
        const manifest = this.store.getManifest(input.batchId);
        if (!manifest) {
          return {
            ok: false,
            code: "BATCH_RUNTIME_NOT_FOUND",
            message: "Canonical BatchManifest not found.",
          };
        }
        return {
          ok: true,
          manifest,
          code: "BATCH_RUNTIME_OK",
          message: "Canonical BatchManifest loaded.",
        };
      }
      if (input.contextId) {
        const batchContext = this.store.getContext(input.contextId);
        if (!batchContext) {
          return {
            ok: false,
            code: "BATCH_RUNTIME_NOT_FOUND",
            message: "Canonical BatchContext not found.",
          };
        }
        return {
          ok: true,
          batchContext,
          manifest: batchContext.manifest,
          code: "BATCH_RUNTIME_OK",
          message: "Canonical BatchContext loaded.",
        };
      }
      return {
        ok: false,
        code: "BATCH_RUNTIME_INVALID_INPUT",
        message: "batchId or contextId is required.",
      };
    });
  }

  async listBatches(input: ListBatchesInput = {}): Promise<ListBatchesResult> {
    return this.runOperation("listBatches", input, async () => {
      let manifests = this.store.listManifests();
      if (input.state != null) {
        manifests = manifests.filter((m) => m.state === input.state);
      }
      return {
        ok: true,
        manifests,
        contexts: this.store.listContexts(),
        statistics: this.store.statistics(),
        code: "BATCH_RUNTIME_OK",
        message: `Listed ${manifests.length} canonical BatchManifests / ${this.store.contextCount()} contexts.`,
      };
    });
  }

  async stats(input: BatchStatsInput = {}): Promise<BatchStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const manifest = createEmptyBatchManifest({
        batchId: createBatchId(),
        batchName: "Batch Runtime structural statistics",
        creationTimestamp: stamp,
        state: "CREATED",
        statistics,
      });
      return {
        ok: true,
        statistics,
        manifest,
        code: "BATCH_RUNTIME_OK",
        message: `Batch Runtime stats: ${statistics.totalManifests} manifests / ${statistics.totalDocuments} documents.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: BatchRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & BatchRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createBatchRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: BatchRuntimeStructuredLog[] = [];
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
            code: "BATCH_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & BatchRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "BATCH_RUNTIME_RETRY",
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
              reject(new Error("Batch Runtime operation timed out."));
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
        code: "BATCH_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Batch Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & BatchRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Batch Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "BATCH_RUNTIME_CANCELLED"
          : isTimeout
            ? "BATCH_RUNTIME_TIMEOUT"
            : "BATCH_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & BatchRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-06). */
export const EnterpriseBatchRuntimeAdapter = DefaultBatchRuntimeAdapter;
