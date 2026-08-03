/**
 * MockWorkerRuntimeAdapter — INF-06.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem Workers reais. Sem Scheduler. Sem Thread Pool. Sem banco.
 */
import { createQueueRuntimePort } from "../../queue-runtime/providers/create-queue-runtime-port";
import {
  DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES,
  toCanonicalWorkerCapabilities,
} from "../ports/capabilities";
import type { WorkerRuntimePort } from "../ports/worker-runtime-port";
import type {
  AllocateWorkerInput,
  AllocateWorkerResult,
  HeartbeatWorkerInput,
  HeartbeatWorkerResult,
  RegisterWorkerInput,
  RegisterWorkerResult,
  ReleaseWorkerInput,
  ReleaseWorkerResult,
  UnregisterWorkerInput,
  UnregisterWorkerResult,
  WorkerRuntimeEnterpriseDeps,
  WorkerRuntimeHealth,
  WorkerRuntimeInfo,
  WorkerRuntimePortCapabilities,
  WorkerRuntimeProviderId,
  WorkerRuntimeProviderMetadata,
  WorkerStatsInput,
  WorkerStatsResult,
} from "../ports/types";
import type { WorkerRuntimeStore } from "../store";
import { DefaultWorkerRuntimeAdapter } from "./default-worker-runtime-adapter";

export const MOCK_WORKER_RUNTIME_ADAPTER_ID = "mock-deterministic-worker";
export const DEFAULT_MOCK_WORKER_RUNTIME_VERSION = "1.0.0";

export type MockWorkerRuntimeAdapterOptions = {
  provider?: Extract<WorkerRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: WorkerRuntimeStore;
  enterpriseDeps?: WorkerRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<WorkerRuntimeProviderId, "mock" | "test">,
): WorkerRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Worker Runtime" : "Mock Worker Runtime",
    version: DEFAULT_MOCK_WORKER_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process Worker Runtime mock — no network, no real workers, no scheduler.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockWorkerRuntimeAdapter implements WorkerRuntimePort {
  readonly providerId: Extract<WorkerRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: WorkerRuntimeProviderMetadata;
  private readonly delegate: DefaultWorkerRuntimeAdapter;

  constructor(options: MockWorkerRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Worker Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    const queueRuntimePort = createQueueRuntimePort({ provider: "mock" });
    const enterpriseDeps: WorkerRuntimeEnterpriseDeps = options.enterpriseDeps ?? {
      getQueueRuntimePort: () => queueRuntimePort,
    };

    this.delegate = new DefaultWorkerRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps,
    });
  }

  getStore(): WorkerRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): WorkerRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_WORKER_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalWorkerCapabilities(DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES),
      supportsCanonicalWorker: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      runtimeReady: true,
      realWorkers: false,
      tasksExecuted: false,
      parallelProcessing: false,
      schedulerImplemented: false,
      threadPoolImplemented: false,
      persistenceImplemented: false,
      queueConsumed: false,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsAzureQueue: false,
      implementsRedis: false,
      implementsBullMq: false,
      implementsRealWorkers: false,
      implementsScheduler: false,
      implementsThreadPool: false,
      implementsCron: false,
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

  providerInfo(): WorkerRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "WORKER_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<WorkerRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async register(input: RegisterWorkerInput): Promise<RegisterWorkerResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregister(input: UnregisterWorkerInput): Promise<UnregisterWorkerResult> {
    const result = await this.delegate.unregister(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async allocate(input: AllocateWorkerInput): Promise<AllocateWorkerResult> {
    const result = await this.delegate.allocate(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async release(input: ReleaseWorkerInput): Promise<ReleaseWorkerResult> {
    const result = await this.delegate.release(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async heartbeat(input: HeartbeatWorkerInput): Promise<HeartbeatWorkerResult> {
    const result = await this.delegate.heartbeat(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: WorkerStatsInput): Promise<WorkerStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
