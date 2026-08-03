/**
 * MockQueueRuntimeAdapter — INF-05.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem filas reais. Sem workers. Sem backends. Sem banco.
 */
import {
  DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES,
  toCanonicalQueueCapabilities,
} from "../ports/capabilities";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type {
  AckInput,
  AckResult,
  DequeueInput,
  DequeueResult,
  EnqueueInput,
  EnqueueResult,
  NackInput,
  NackResult,
  PeekInput,
  PeekResult,
  PurgeInput,
  PurgeResult,
  QueueRuntimeEnterpriseDeps,
  QueueRuntimeHealth,
  QueueRuntimeInfo,
  QueueRuntimePortCapabilities,
  QueueRuntimeProviderId,
  QueueRuntimeProviderMetadata,
  StatsInput,
  StatsResult,
} from "../ports/types";
import type { QueueRuntimeStore } from "../store";
import { DefaultQueueRuntimeAdapter } from "./default-queue-runtime-adapter";

export const MOCK_QUEUE_RUNTIME_ADAPTER_ID = "mock-deterministic-queue";
export const DEFAULT_MOCK_QUEUE_RUNTIME_VERSION = "1.0.0";

export type MockQueueRuntimeAdapterOptions = {
  provider?: Extract<QueueRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: QueueRuntimeStore;
  enterpriseDeps?: QueueRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<QueueRuntimeProviderId, "mock" | "test">,
): QueueRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Queue Runtime" : "Mock Queue Runtime",
    version: DEFAULT_MOCK_QUEUE_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process Queue Runtime mock — no network, no real queue, no workers.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockQueueRuntimeAdapter implements QueueRuntimePort {
  readonly providerId: Extract<QueueRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: QueueRuntimeProviderMetadata;
  private readonly delegate: DefaultQueueRuntimeAdapter;

  constructor(options: MockQueueRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Queue Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultQueueRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
    });
  }

  getStore(): QueueRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): QueueRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_QUEUE_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES },
      canonical: toCanonicalQueueCapabilities(DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES),
      supportsCanonicalQueue: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      runtimeReady: true,
      realQueueBackend: false,
      messagesPublished: false,
      messagesConsumed: false,
      workersInvoked: false,
      processingPerformed: false,
      persistenceImplemented: false,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsAzureQueue: false,
      implementsRedis: false,
      implementsBullMq: false,
      implementsWorkers: false,
      implementsScheduler: false,
      implementsDeadLetter: false,
      implementsRetryReal: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): QueueRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "QUEUE_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<QueueRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async enqueue(input: EnqueueInput): Promise<EnqueueResult> {
    const result = await this.delegate.enqueue(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async dequeue(input: DequeueInput): Promise<DequeueResult> {
    const result = await this.delegate.dequeue(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async peek(input: PeekInput): Promise<PeekResult> {
    const result = await this.delegate.peek(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async ack(input: AckInput): Promise<AckResult> {
    const result = await this.delegate.ack(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async nack(input: NackInput): Promise<NackResult> {
    const result = await this.delegate.nack(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async purge(input: PurgeInput): Promise<PurgeResult> {
    const result = await this.delegate.purge(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: StatsInput): Promise<StatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
