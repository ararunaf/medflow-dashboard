/**
 * MockBatchRuntimeAdapter — C-06 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem processamento em lote. Sem filas. Sem workers. Sem SOAP/XML funcional.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES,
  toBatchCapabilities,
} from "../ports/capabilities";
import type { BatchRuntimePort } from "../ports/batch-runtime-port";
import type {
  BatchRuntimeCapabilities,
  BatchRuntimeEnterpriseDeps,
  BatchRuntimeHealth,
  BatchRuntimeInfo,
  BatchRuntimeProviderId,
  BatchRuntimeProviderMetadata,
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
import { InMemoryBatchRuntimeStore } from "../store";
import { DefaultBatchRuntimeAdapter } from "./default-batch-runtime-adapter";

export const MOCK_BATCH_RUNTIME_ADAPTER_ID = "mock-deterministic-batch-runtime";
export const DEFAULT_MOCK_BATCH_RUNTIME_VERSION = "1.0.0";

export type MockBatchRuntimeAdapterOptions = {
  provider?: Extract<BatchRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: BatchRuntimeStore;
  enterpriseDeps?: BatchRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<BatchRuntimeProviderId, "mock" | "test">,
): BatchRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Batch Runtime" : "Mock Batch Runtime",
    version: DEFAULT_MOCK_BATCH_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description: "Deterministic in-process Batch Runtime mock — no batch processing, no network.",
  };
}

export class MockBatchRuntimeAdapter implements BatchRuntimePort {
  readonly providerId: Extract<BatchRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: BatchRuntimeProviderMetadata;
  private readonly delegate: DefaultBatchRuntimeAdapter;

  constructor(options: MockBatchRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Batch Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultBatchRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryBatchRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): BatchRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): BatchRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_BATCH_RUNTIME_ADAPTER_ID,
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
      batchProcessingImplemented: false,
      parallelExecutionImplemented: false,
      retryImplemented: false,
      schedulerImplemented: false,
      workerImplemented: false,
      queueImplemented: false,
      soapFunctionalImplemented: false,
      xmlFunctionalImplemented: false,
      operatorCommunicationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toBatchCapabilities(DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): BatchRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "BATCH_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<BatchRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareBatch(input: PrepareBatchInput): Promise<PrepareBatchResult> {
    const result = await this.delegate.prepareBatch(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getBatch(input: GetBatchInput): Promise<GetBatchResult> {
    const result = await this.delegate.getBatch(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listBatches(input?: ListBatchesInput): Promise<ListBatchesResult> {
    const result = await this.delegate.listBatches(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: BatchStatsInput): Promise<BatchStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
