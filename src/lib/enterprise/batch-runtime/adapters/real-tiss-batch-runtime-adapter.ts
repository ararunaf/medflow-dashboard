/**
 * RealTissBatchRuntimeAdapter — A6-02.
 *
 * Adapter real de criação de lote TISS para o provider `real-tiss`.
 *
 * Reutiliza `DefaultBatchRuntimeAdapter` para ciclo de vida, retry,
 * cancelamento/AbortSignal, observability e store in-memory.
 *
 * Sem alterar EnterpriseRuntime, Runtime, Queue, Worker, Scheduler, Retry,
 * Dead Letter, Observability, Pipeline, Foundations, Composition Root.
 */
import {
  DefaultBatchRuntimeAdapter,
  type DefaultBatchRuntimeAdapterOptions,
} from "./default-batch-runtime-adapter";
import {
  createBatchContextId,
  createBatchId,
  createBatchRuntimeRequestId,
} from "../ports/identity";
import type {
  BatchContext,
  BatchDocument,
  BatchManifest,
  BatchPriority,
  BatchState,
  BatchStateMachine,
} from "../ports/canonical";
import { createEmptyBatchStateMachine } from "../ports/canonical";
import type { BatchRuntimePort } from "../ports/batch-runtime-port";
import type {
  BatchRuntimeCapabilities,
  BatchRuntimeEnterpriseDeps,
  BatchRuntimeHealth,
  BatchRuntimeInfo,
  BatchRuntimeProviderId,
  BatchStatsInput,
  BatchStatsResult,
  GetBatchInput,
  GetBatchResult,
  ListBatchesInput,
  ListBatchesResult,
  PrepareBatchInput,
  PrepareBatchResult,
} from "../ports/types";
import type { BatchRuntimeStore } from "../store";

export const REAL_TISS_BATCH_RUNTIME_ADAPTER_ID = "real-tiss-batch-runtime";
export const REAL_TISS_BATCH_RUNTIME_VERSION = "1.0.0";

export type RealTissBatchRuntimeAdapterOptions = {
  provider?: Extract<BatchRuntimeProviderId, "real-tiss">;
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

const REAL_TISS_BATCH_STATE: BatchState = "READY_TO_SEND";
const REAL_TISS_BATCH_PRIORITY: BatchPriority = "normal";

function structuralFlags() {
  return {
    batchProcessingImplemented: false,
    parallelExecutionImplemented: false,
    retryImplemented: false,
    schedulerImplemented: false,
    workerImplemented: false,
    queueImplemented: false,
    soapFunctionalImplemented: false,
    xmlFunctionalImplemented: false,
    operatorCommunicationImplemented: false,
  } as const;
}

function buildRealTissBatchManifest(
  input: PrepareBatchInput,
  baseManifest: BatchManifest,
): BatchManifest {
  const batchId = baseManifest.batchId ?? createBatchId();
  const contextId = input.batchContext?.contextId ?? `${batchId}:ctx`;

  const documents: BatchDocument[] = baseManifest.documents?.length
    ? [...baseManifest.documents]
    : [
        {
          kind: "canonical-batch-document",
          documentId: input.batchContext?.batchId ?? batchId,
          documentRef: `tiss://xml/${input.batchContext?.batchId ?? batchId}`,
          name: "TISS XML Guide",
          contentType: "text/xml",
          notes: "Real TISS batch document reference (structural).",
          batchDocumentImplemented: false,
          batchProcessingImplemented: false,
        },
      ];

  const stateMachine: BatchStateMachine =
    baseManifest.stateMachine ??
    createEmptyBatchStateMachine({ states: ["CREATED", "VALIDATED", "READY_TO_SEND"] });

  return {
    ...baseManifest,
    kind: "canonical-batch-manifest",
    batchId,
    batchName: input.batchName ?? `TISS real batch ${batchId}`,
    documents,
    state: REAL_TISS_BATCH_STATE,
    priority: REAL_TISS_BATCH_PRIORITY,
    submissionStrategy: "tiss-ans-soap",
    owner: "real-tiss",
    tags: ["real-tiss", "tiss-batch", "ans-3.05.00"],
    stateMachine,
    statistics: baseManifest.statistics,
    xmlDocument: input.manifest?.xmlDocument ?? baseManifest.xmlDocument,
    qualityAssessment: input.manifest?.qualityAssessment ?? baseManifest.qualityAssessment,
    auditResult: input.manifest?.auditResult ?? baseManifest.auditResult,
    structuralNotes: `Real TISS batch ready for ANS SOAP submission from ${contextId}.`,
    ...structuralFlags(),
  };
}

function buildRealTissBatchContext(
  input: PrepareBatchInput,
  manifest: BatchManifest,
): BatchContext {
  const base: BatchContext = input.batchContext ?? {
    kind: "canonical-batch-context",
    batchId: manifest.batchId,
    contextId: createBatchContextId(),
    manifest,
    state: REAL_TISS_BATCH_STATE,
    stateMachine: manifest.stateMachine,
    structuralNotes: "Real TISS batch context.",
  };

  return {
    ...base,
    manifest,
    state: REAL_TISS_BATCH_STATE,
    structuralNotes: `Real TISS batch context for ${manifest.batchId} (ANS SOAP).`,
  };
}

export class RealTissBatchRuntimeAdapter implements BatchRuntimePort {
  readonly providerId: Extract<BatchRuntimeProviderId, "real-tiss">;

  private readonly delegate: DefaultBatchRuntimeAdapter;
  private readonly metadata: BatchRuntimeInfo["metadata"];

  constructor(options: RealTissBatchRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "real-tiss";
    this.delegate = new DefaultBatchRuntimeAdapter({
      provider: "enterprise",
      healthy: options.healthy ?? true,
      message: options.message ?? "Real TISS Batch Runtime ready.",
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
      defaultTimeoutMs: options.defaultTimeoutMs,
      defaultRetryCount: options.defaultRetryCount,
      defaultRetryBackoffMs: options.defaultRetryBackoffMs,
      now: options.now,
      sleep: options.sleep,
      failAttempts: options.failAttempts,
    });

    this.metadata = {
      name: "Real TISS Batch Runtime",
      version: REAL_TISS_BATCH_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      layer: "Foundation",
      vendorAgnostic: true,
      description:
        "Real TISS batch creation adapter — produces ANS TISS batch manifests from XML_GENERATED jobs.",
    };
  }

  getStore(): BatchRuntimeStore {
    return this.delegate.getStore();
  }

  async prepareBatch(input: PrepareBatchInput): Promise<PrepareBatchResult> {
    const res = await this.delegate.prepareBatch({
      ...input,
      batchName: input.batchName ?? `TISS real batch ${createBatchId()}`,
    });

    if (!res.ok || !res.manifest) {
      return { ...res, provider: this.providerId };
    }

    const realManifest = buildRealTissBatchManifest(input, res.manifest);
    const realContext = buildRealTissBatchContext(input, realManifest);

    const store = this.delegate.getStore();
    store.setManifest(realManifest);
    store.setContext(realContext);

    return {
      ...res,
      ok: true,
      provider: this.providerId,
      manifest: realManifest,
      batchContext: realContext,
      batchProcessed: false,
      code: "REAL_TISS_BATCH_PREPARED_OK",
      message: "Real TISS batch prepared and ready for ANS SOAP submission.",
    };
  }

  async getBatch(input: GetBatchInput): Promise<GetBatchResult> {
    const res = await this.delegate.getBatch(input);
    return { ...res, provider: this.providerId };
  }

  async listBatches(input: ListBatchesInput = {}): Promise<ListBatchesResult> {
    const res = await this.delegate.listBatches(input);
    return { ...res, provider: this.providerId };
  }

  async stats(input: BatchStatsInput = {}): Promise<BatchStatsResult> {
    const res = await this.delegate.stats(input);
    return { ...res, provider: this.providerId };
  }

  async health(): Promise<BatchRuntimeHealth> {
    const res = await this.delegate.health();
    return { ...res, provider: this.providerId };
  }

  capabilities(): BatchRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return { ...caps, provider: this.providerId, adapterId: REAL_TISS_BATCH_RUNTIME_ADAPTER_ID };
  }

  providerInfo(): BatchRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: "ready",
      providerType: "BATCH_RUNTIME",
      capabilities: this.delegate.capabilities().engine ?? {},
    };
  }
}
