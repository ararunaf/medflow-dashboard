/**
 * MockPersistentQueueRuntimeAdapter — INF-08.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem Scheduler real. Sem Cron. Sem Timer. Sem banco.
 */
import { createQueueRuntimePort } from "../../queue-runtime/providers/create-queue-runtime-port";
import { createWorkerRuntimePort } from "../../worker-runtime/providers/create-worker-runtime-port";
import { createSchedulerRuntimePort } from "../../scheduler-runtime/providers/create-scheduler-runtime-port";
import {
  DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
  toCanonicalPersistentQueueCapabilities,
} from "../ports/capabilities";
import type { PersistentQueueRuntimePort } from "../ports/persistent-queue-runtime-port";
import type {
  ReleaseMessageInput,
  ReleaseMessageResult,
  ListPersistentQueuesInput,
  ListPersistentQueuesResult,
  RegisterPersistentQueueInput,
  RegisterPersistentQueueResult,
  PersistMessageInput,
  PersistMessageResult,
  PersistentQueueRuntimeEnterpriseDeps,
  PersistentQueueRuntimeHealth,
  PersistentQueueRuntimeInfo,
  PersistentQueueRuntimePortCapabilities,
  PersistentQueueRuntimeProviderId,
  PersistentQueueRuntimeProviderMetadata,
  PersistentQueueStatsInput,
  PersistentQueueStatsResult,
  UnregisterPersistentQueueInput,
  UnregisterPersistentQueueResult,
} from "../ports/types";
import type { PersistentQueueRuntimeStore } from "../store";
import { DefaultPersistentQueueRuntimeAdapter } from "./default-persistent-queue-runtime-adapter";

export const MOCK_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID = "mock-deterministic-persistent-queue";
export const DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_VERSION = "1.0.0";

export type MockPersistentQueueRuntimeAdapterOptions = {
  provider?: Extract<PersistentQueueRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: PersistentQueueRuntimeStore;
  enterpriseDeps?: PersistentQueueRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<PersistentQueueRuntimeProviderId, "mock" | "test">,
): PersistentQueueRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Persistent Queue Runtime" : "Mock Persistent Queue Runtime",
    version: DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process Persistent Queue Runtime mock — no network, no real persistent backend, no RabbitMQ.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockPersistentQueueRuntimeAdapter implements PersistentQueueRuntimePort {
  readonly providerId: Extract<PersistentQueueRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: PersistentQueueRuntimeProviderMetadata;
  private readonly delegate: DefaultPersistentQueueRuntimeAdapter;

  constructor(options: MockPersistentQueueRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Persistent Queue Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    const queueRuntimePort = createQueueRuntimePort({ provider: "mock" });
    const workerRuntimePort = createWorkerRuntimePort({
      provider: "mock",
      enterpriseDeps: { getQueueRuntimePort: () => queueRuntimePort },
    });
    const schedulerRuntimePort = createSchedulerRuntimePort({
      provider: "mock",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntimePort,
        getWorkerRuntimePort: () => workerRuntimePort,
      },
    });
    const enterpriseDeps: PersistentQueueRuntimeEnterpriseDeps = options.enterpriseDeps ?? {
      getQueueRuntimePort: () => queueRuntimePort,
      getWorkerRuntimePort: () => workerRuntimePort,
      getSchedulerRuntimePort: () => schedulerRuntimePort,
    };

    this.delegate = new DefaultPersistentQueueRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps,
    });
  }

  getStore(): PersistentQueueRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): PersistentQueueRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES },
      canonical: toCanonicalPersistentQueueCapabilities(
        DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalPersistentQueue: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      runtimeReady: true,
      ...{
        realPersistentBackend: false as const,
        rabbitMqImplemented: false as const,
        kafkaImplemented: false as const,
        azureServiceBusImplemented: false as const,
        azureQueueImplemented: false as const,
        redisStreamsImplemented: false as const,
        bullMqImplemented: false as const,
        deadLetterImplemented: false as const,
        retryQueueImplemented: false as const,
        delayQueueImplemented: false as const,
        messagePersistenceImplemented: false as const,
      },
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsAzureQueue: false,
      implementsRedisStreams: false,
      implementsBullMq: false,
      implementsDeadLetter: false,
      implementsRetryQueue: false,
      implementsDelayQueue: false,
      implementsPriorityQueue: false,
      implementsMessagePersistence: false,
      implementsRetryEngine: false,
      implementsRealPersistentBackend: false,
      implementsThreadPool: false,
      implementsWorkers: false,
      implementsParallelProcessing: false,
      implementsRedis: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): PersistentQueueRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "PERSISTENT_QUEUE_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<PersistentQueueRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async register(input: RegisterPersistentQueueInput): Promise<RegisterPersistentQueueResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregister(
    input: UnregisterPersistentQueueInput,
  ): Promise<UnregisterPersistentQueueResult> {
    const result = await this.delegate.unregister(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async persist(input: PersistMessageInput): Promise<PersistMessageResult> {
    const result = await this.delegate.persist(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async release(input: ReleaseMessageInput): Promise<ReleaseMessageResult> {
    const result = await this.delegate.release(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async list(input?: ListPersistentQueuesInput): Promise<ListPersistentQueuesResult> {
    const result = await this.delegate.list(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: PersistentQueueStatsInput): Promise<PersistentQueueStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
