/**
 * MockObservabilityRuntimeAdapter — INF-09.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem OpenTelemetry. Sem Application Insights. Sem Prometheus/Grafana.
 * Sem logs/métricas/tracing reais.
 */
import { createQueueRuntimePort } from "../../queue-runtime/providers/create-queue-runtime-port";
import { createWorkerRuntimePort } from "../../worker-runtime/providers/create-worker-runtime-port";
import { createSchedulerRuntimePort } from "../../scheduler-runtime/providers/create-scheduler-runtime-port";
import { createPersistentQueueRuntimePort } from "../../persistent-queue-runtime/providers/create-persistent-queue-runtime-port";
import type { TISSRuntimePort } from "../../tiss-runtime/ports/tiss-runtime-port";
import {
  DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES,
  toCanonicalObservabilityCapabilities,
} from "../ports/capabilities";
import type { ObservabilityRuntimePort } from "../ports/observability-runtime-port";
import type {
  ReleaseSignalInput,
  ReleaseSignalResult,
  ListObservabilityScopesInput,
  ListObservabilityScopesResult,
  RegisterObservabilityScopeInput,
  RegisterObservabilityScopeResult,
  ObserveSignalInput,
  ObserveSignalResult,
  ObservabilityRuntimeEnterpriseDeps,
  ObservabilityRuntimeHealth,
  ObservabilityRuntimeInfo,
  ObservabilityRuntimePortCapabilities,
  ObservabilityRuntimeProviderId,
  ObservabilityRuntimeProviderMetadata,
  ObservabilityStatsInput,
  ObservabilityStatsResult,
  UnregisterObservabilityScopeInput,
  UnregisterObservabilityScopeResult,
} from "../ports/types";
import type { ObservabilityRuntimeStore } from "../store";
import { DefaultObservabilityRuntimeAdapter } from "./default-observability-runtime-adapter";

export const MOCK_OBSERVABILITY_RUNTIME_ADAPTER_ID = "mock-deterministic-observability";
export const DEFAULT_MOCK_OBSERVABILITY_RUNTIME_VERSION = "1.0.0";

export type MockObservabilityRuntimeAdapterOptions = {
  provider?: Extract<ObservabilityRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ObservabilityRuntimeStore;
  enterpriseDeps?: ObservabilityRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<ObservabilityRuntimeProviderId, "mock" | "test">,
): ObservabilityRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Observability Runtime" : "Mock Observability Runtime",
    version: DEFAULT_MOCK_OBSERVABILITY_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process Observability Runtime mock — no network, no real observability backend, no OpenTelemetry.",
  };
}

/**
 * Stub mínimo de TISS — evita MockObs → MockTISS → MockObs (ciclo) quando
 * TISS passa a exigir Observability (INF-09).
 */
function createMinimalTISSRuntimeStub(): TISSRuntimePort {
  return {
    providerId: "mock",
    health: async () => ({ ok: true, provider: "mock" }),
    capabilities: () => ({
      provider: "mock",
      adapterId: "stub-tiss-for-mock-observability",
      supportsProcess: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      usesEnterpriseRuntimePorts: true,
      usesCanonicalExecutionOrchestrator: true,
      usesTISSProviderPort: true,
      usesTISSCatalogPort: true,
      usesRulePackEnginePort: true,
      usesXMLRuntimePort: true,
      usesXMLGenerationRuntimePort: true,
      usesXMLSerializerRuntimePort: true,
      usesXMLSchemaRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesXSDRuntimePort: true,
      usesNamespaceRuntimePort: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
    }),
    process: async () => ({ ok: true }),
    getSession: async () => ({ ok: false }),
    listSessions: async () => ({ ok: true, sessions: [] }),
  } as unknown as TISSRuntimePort;
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockObservabilityRuntimeAdapter implements ObservabilityRuntimePort {
  readonly providerId: Extract<ObservabilityRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: ObservabilityRuntimeProviderMetadata;
  private readonly delegate: DefaultObservabilityRuntimeAdapter;

  constructor(options: MockObservabilityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Observability Runtime ready (deterministic).`;
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
    const persistentQueueRuntimePort = createPersistentQueueRuntimePort({
      provider: "mock",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntimePort,
        getWorkerRuntimePort: () => workerRuntimePort,
        getSchedulerRuntimePort: () => schedulerRuntimePort,
      },
    });
    // Stub mínimo — NÃO usa createTISSRuntimePort (evita ciclo circular MockObs ↔ MockTISS).
    const tissRuntimePort = createMinimalTISSRuntimeStub();
    const enterpriseDeps: ObservabilityRuntimeEnterpriseDeps = options.enterpriseDeps ?? {
      getQueueRuntimePort: () => queueRuntimePort,
      getWorkerRuntimePort: () => workerRuntimePort,
      getSchedulerRuntimePort: () => schedulerRuntimePort,
      getPersistentQueueRuntimePort: () => persistentQueueRuntimePort,
      getTISSRuntimePort: () => tissRuntimePort,
    };

    this.delegate = new DefaultObservabilityRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps,
    });
  }

  getStore(): ObservabilityRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ObservabilityRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_OBSERVABILITY_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES },
      canonical: toCanonicalObservabilityCapabilities(
        DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalObservability: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesTISSRuntimePort: true,
      runtimeReady: true,
      ...{
        realObservabilityBackend: false as const,
        openTelemetryImplemented: false as const,
        applicationInsightsImplemented: false as const,
        azureMonitorImplemented: false as const,
        prometheusImplemented: false as const,
        grafanaImplemented: false as const,
        elasticImplemented: false as const,
        datadogImplemented: false as const,
        newRelicImplemented: false as const,
        lokiImplemented: false as const,
        jaegerImplemented: false as const,
        realLogsImplemented: false as const,
        realMetricsImplemented: false as const,
        realTracingImplemented: false as const,
        distributedTracingImplemented: false as const,
        realAlertsImplemented: false as const,
        realDashboardsImplemented: false as const,
        realTelemetryImplemented: false as const,
        realHealthMonitoringImplemented: false as const,
        realPerformanceMonitoringImplemented: false as const,
      },
      implementsOpenTelemetry: false,
      implementsApplicationInsights: false,
      implementsAzureMonitor: false,
      implementsPrometheus: false,
      implementsGrafana: false,
      implementsElastic: false,
      implementsDatadog: false,
      implementsNewRelic: false,
      implementsLoki: false,
      implementsJaeger: false,
      implementsRealLogs: false,
      implementsRealMetrics: false,
      implementsRealTracing: false,
      implementsDistributedTracing: false,
      implementsRealAlerts: false,
      implementsRealDashboards: false,
      implementsRealTelemetry: false,
      implementsRealHealthMonitoring: false,
      implementsRealPerformanceMonitoring: false,
      implementsRealObservabilityBackend: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): ObservabilityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "OBSERVABILITY_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<ObservabilityRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async register(
    input: RegisterObservabilityScopeInput,
  ): Promise<RegisterObservabilityScopeResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregister(
    input: UnregisterObservabilityScopeInput,
  ): Promise<UnregisterObservabilityScopeResult> {
    const result = await this.delegate.unregister(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async observe(input: ObserveSignalInput): Promise<ObserveSignalResult> {
    const result = await this.delegate.observe(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async release(input: ReleaseSignalInput): Promise<ReleaseSignalResult> {
    const result = await this.delegate.release(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async list(input?: ListObservabilityScopesInput): Promise<ListObservabilityScopesResult> {
    const result = await this.delegate.list(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ObservabilityStatsInput): Promise<ObservabilityStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
