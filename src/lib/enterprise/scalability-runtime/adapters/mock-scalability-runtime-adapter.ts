/**
 * MockScalabilityRuntimeAdapter — INF-10.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem Kubernetes. Sem Docker Swarm. Sem Auto Scaling.
 * Sem Cluster / Load Balancer / Failover / Sharding reais.
 */
import { createQueueRuntimePort } from "../../queue-runtime/providers/create-queue-runtime-port";
import { createPersistentQueueRuntimePort } from "../../persistent-queue-runtime/providers/create-persistent-queue-runtime-port";
import type { TISSRuntimePort } from "../../tiss-runtime/ports/tiss-runtime-port";
import {
  DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES,
  toCanonicalScalabilityCapabilities,
} from "../ports/capabilities";
import type { ScalabilityRuntimePort } from "../ports/scalability-runtime-port";
import type {
  ReleaseSignalInput,
  ReleaseSignalResult,
  ListScalabilityScopesInput,
  ListScalabilityScopesResult,
  RegisterScalabilityScopeInput,
  RegisterScalabilityScopeResult,
  ObserveSignalInput,
  ObserveSignalResult,
  ScalabilityRuntimeEnterpriseDeps,
  ScalabilityRuntimeHealth,
  ScalabilityRuntimeInfo,
  ScalabilityRuntimePortCapabilities,
  ScalabilityRuntimeProviderId,
  ScalabilityRuntimeProviderMetadata,
  ScalabilityStatsInput,
  ScalabilityStatsResult,
  UnregisterScalabilityScopeInput,
  UnregisterScalabilityScopeResult,
} from "../ports/types";
import type { ScalabilityRuntimeStore } from "../store";
import { DefaultScalabilityRuntimeAdapter } from "./default-scalability-runtime-adapter";

export const MOCK_SCALABILITY_RUNTIME_ADAPTER_ID = "mock-deterministic-scalability";
export const DEFAULT_MOCK_SCALABILITY_RUNTIME_VERSION = "1.0.0";

export type MockScalabilityRuntimeAdapterOptions = {
  provider?: Extract<ScalabilityRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ScalabilityRuntimeStore;
  enterpriseDeps?: ScalabilityRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<ScalabilityRuntimeProviderId, "mock" | "test">,
): ScalabilityRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Scalability Runtime" : "Mock Scalability Runtime",
    version: DEFAULT_MOCK_SCALABILITY_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process Scalability Runtime mock — no network, no real scalability backend, no Kubernetes/HPA.",
  };
}

/**
 * Stub mínimo de TISS — evita MockScal → MockTISS → MockScal (ciclo) quando
 * TISS passa a exigir Scalability (INF-10).
 */
function createMinimalTISSRuntimeStub(): TISSRuntimePort {
  return {
    providerId: "mock",
    health: async () => ({ ok: true, provider: "mock" }),
    capabilities: () => ({
      provider: "mock",
      adapterId: "stub-tiss-for-mock-scalability",
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
      usesScalabilityRuntimePort: true,
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
export class MockScalabilityRuntimeAdapter implements ScalabilityRuntimePort {
  readonly providerId: Extract<ScalabilityRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: ScalabilityRuntimeProviderMetadata;
  private readonly delegate: DefaultScalabilityRuntimeAdapter;

  constructor(options: MockScalabilityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Scalability Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    const queueRuntimePort = createQueueRuntimePort({ provider: "mock" });
    const persistentQueueRuntimePort = createPersistentQueueRuntimePort({
      provider: "mock",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntimePort,
      },
    });
    // Stub mínimo — evita ciclo MockScal ↔ MockTISS.
    const tissRuntimePort = createMinimalTISSRuntimeStub();
    const enterpriseDeps: ScalabilityRuntimeEnterpriseDeps = options.enterpriseDeps ?? {
      getQueueRuntimePort: () => queueRuntimePort,
      getPersistentQueueRuntimePort: () => persistentQueueRuntimePort,
      getTISSRuntimePort: () => tissRuntimePort,
    };

    this.delegate = new DefaultScalabilityRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps,
    });
  }

  getStore(): ScalabilityRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ScalabilityRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_SCALABILITY_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES },
      canonical: toCanonicalScalabilityCapabilities(DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES),
      supportsCanonicalScalability: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesTISSRuntimePort: true,
      runtimeReady: true,
      ...{
        realScalabilityBackend: false as const,
        kubernetesImplemented: false as const,
        dockerSwarmImplemented: false as const,
        azureScaleSetImplemented: false as const,
        horizontalPodAutoscalerImplemented: false as const,
        autoScalingImplemented: false as const,
        clusterImplemented: false as const,
        loadBalancerImplemented: false as const,
        failoverImplemented: false as const,
        shardingImplemented: false as const,
        partitioningImplemented: false as const,
        horizontalScalingImplemented: false as const,
        verticalScalingImplemented: false as const,
        nodeManagementImplemented: false as const,
        highAvailabilityImplemented: false as const,
        elasticScalingImplemented: false as const,
        capacityPlanningImplemented: false as const,
        realScalabilityOrchestrationImplemented: false as const,
        realDistributedProcessingImplemented: false as const,
        realExternalIntegrationImplemented: false as const,
      },
      implementsKubernetes: false,
      implementsDockerSwarm: false,
      implementsAzureScaleSet: false,
      implementsHorizontalPodAutoscaler: false,
      implementsAutoScaling: false,
      implementsCluster: false,
      implementsLoadBalancer: false,
      implementsFailover: false,
      implementsSharding: false,
      implementsPartitioning: false,
      implementsHorizontalScaling: false,
      implementsVerticalScaling: false,
      implementsNodeManagement: false,
      implementsHighAvailability: false,
      implementsElasticScaling: false,
      implementsCapacityPlanning: false,
      implementsRealScalabilityOrchestration: false,
      implementsRealDistributedProcessing: false,
      implementsRealExternalIntegration: false,
      implementsRealScalabilityBackend: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): ScalabilityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SCALABILITY_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<ScalabilityRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async register(input: RegisterScalabilityScopeInput): Promise<RegisterScalabilityScopeResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregister(
    input: UnregisterScalabilityScopeInput,
  ): Promise<UnregisterScalabilityScopeResult> {
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

  async list(input?: ListScalabilityScopesInput): Promise<ListScalabilityScopesResult> {
    const result = await this.delegate.list(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ScalabilityStatsInput): Promise<ScalabilityStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
