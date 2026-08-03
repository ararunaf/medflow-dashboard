/**
 * MockSchedulerRuntimeAdapter — INF-07.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem Scheduler real. Sem Cron. Sem Timer. Sem banco.
 */
import { createQueueRuntimePort } from "../../queue-runtime/providers/create-queue-runtime-port";
import { createWorkerRuntimePort } from "../../worker-runtime/providers/create-worker-runtime-port";
import {
  DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES,
  toCanonicalSchedulerCapabilities,
} from "../ports/capabilities";
import type { SchedulerRuntimePort } from "../ports/scheduler-runtime-port";
import type {
  CancelScheduleInput,
  CancelScheduleResult,
  ListSchedulesInput,
  ListSchedulesResult,
  RegisterScheduleInput,
  RegisterScheduleResult,
  ScheduleJobInput,
  ScheduleJobResult,
  SchedulerRuntimeEnterpriseDeps,
  SchedulerRuntimeHealth,
  SchedulerRuntimeInfo,
  SchedulerRuntimePortCapabilities,
  SchedulerRuntimeProviderId,
  SchedulerRuntimeProviderMetadata,
  SchedulerStatsInput,
  SchedulerStatsResult,
  UnregisterScheduleInput,
  UnregisterScheduleResult,
} from "../ports/types";
import type { SchedulerRuntimeStore } from "../store";
import { DefaultSchedulerRuntimeAdapter } from "./default-scheduler-runtime-adapter";

export const MOCK_SCHEDULER_RUNTIME_ADAPTER_ID = "mock-deterministic-scheduler";
export const DEFAULT_MOCK_SCHEDULER_RUNTIME_VERSION = "1.0.0";

export type MockSchedulerRuntimeAdapterOptions = {
  provider?: Extract<SchedulerRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: SchedulerRuntimeStore;
  enterpriseDeps?: SchedulerRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<SchedulerRuntimeProviderId, "mock" | "test">,
): SchedulerRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Scheduler Runtime" : "Mock Scheduler Runtime",
    version: DEFAULT_MOCK_SCHEDULER_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process Scheduler Runtime mock — no network, no real scheduler, no cron.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockSchedulerRuntimeAdapter implements SchedulerRuntimePort {
  readonly providerId: Extract<SchedulerRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: SchedulerRuntimeProviderMetadata;
  private readonly delegate: DefaultSchedulerRuntimeAdapter;

  constructor(options: MockSchedulerRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Scheduler Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    const queueRuntimePort = createQueueRuntimePort({ provider: "mock" });
    const workerRuntimePort = createWorkerRuntimePort({
      provider: "mock",
      enterpriseDeps: { getQueueRuntimePort: () => queueRuntimePort },
    });
    const enterpriseDeps: SchedulerRuntimeEnterpriseDeps = options.enterpriseDeps ?? {
      getQueueRuntimePort: () => queueRuntimePort,
      getWorkerRuntimePort: () => workerRuntimePort,
    };

    this.delegate = new DefaultSchedulerRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps,
    });
  }

  getStore(): SchedulerRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): SchedulerRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_SCHEDULER_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalSchedulerCapabilities(DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES),
      supportsCanonicalSchedule: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      runtimeReady: true,
      realScheduler: false,
      cronImplemented: false,
      timerImplemented: false,
      retrySchedulingImplemented: false,
      delayJobsImplemented: false,
      jobDispatcherImplemented: false,
      timeWindowsImplemented: false,
      workersOrchestrated: false,
      queueConsumed: false,
      parallelProcessing: false,
      persistenceImplemented: false,
      implementsCron: false,
      implementsQuartz: false,
      implementsHangfire: false,
      implementsCelery: false,
      implementsBullMq: false,
      implementsAzureScheduler: false,
      implementsAzureFunctionsTimer: false,
      implementsTaskScheduler: false,
      implementsRealScheduler: false,
      implementsTimer: false,
      implementsClock: false,
      implementsBackgroundService: false,
      implementsRetryReal: false,
      implementsDelayQueue: false,
      implementsThreadPool: false,
      implementsWorkers: false,
      implementsParallelProcessing: false,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsRedis: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): SchedulerRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SCHEDULER_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<SchedulerRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async register(input: RegisterScheduleInput): Promise<RegisterScheduleResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregister(input: UnregisterScheduleInput): Promise<UnregisterScheduleResult> {
    const result = await this.delegate.unregister(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async schedule(input: ScheduleJobInput): Promise<ScheduleJobResult> {
    const result = await this.delegate.schedule(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async cancel(input: CancelScheduleInput): Promise<CancelScheduleResult> {
    const result = await this.delegate.cancel(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async list(input?: ListSchedulesInput): Promise<ListSchedulesResult> {
    const result = await this.delegate.list(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: SchedulerStatsInput): Promise<SchedulerStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
