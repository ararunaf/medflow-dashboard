/**
 * MockReconciliationRuntimeAdapter — C-09 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem reconciliação funcional. Sem matching automático. Sem resolução de conflitos.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
  toReconciliationCapabilities,
} from "../ports/capabilities";
import type { ReconciliationRuntimePort } from "../ports/reconciliation-runtime-port";
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
  ReconciliationRuntimeProviderId,
  ReconciliationRuntimeProviderMetadata,
  ReconciliationStatsInput,
  ReconciliationStatsResult,
} from "../ports/types";
import type { ReconciliationRuntimeStore } from "../store";
import { InMemoryReconciliationRuntimeStore } from "../store";
import { DefaultReconciliationRuntimeAdapter } from "./default-reconciliation-runtime-adapter";

export const MOCK_RECONCILIATION_RUNTIME_ADAPTER_ID = "mock-deterministic-reconciliation-runtime";
export const DEFAULT_MOCK_RECONCILIATION_RUNTIME_VERSION = "1.0.0";

export type MockReconciliationRuntimeAdapterOptions = {
  provider?: Extract<ReconciliationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ReconciliationRuntimeStore;
  enterpriseDeps?: ReconciliationRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<ReconciliationRuntimeProviderId, "mock" | "test">,
): ReconciliationRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Reconciliation Runtime" : "Mock Reconciliation Runtime",
    version: DEFAULT_MOCK_RECONCILIATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Reconciliation Runtime mock — no functional reconciliation, no automatic matching, no network.",
  };
}

export class MockReconciliationRuntimeAdapter implements ReconciliationRuntimePort {
  readonly providerId: Extract<ReconciliationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: ReconciliationRuntimeProviderMetadata;
  private readonly delegate: DefaultReconciliationRuntimeAdapter;

  constructor(options: MockReconciliationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Reconciliation Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultReconciliationRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryReconciliationRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): ReconciliationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ReconciliationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_RECONCILIATION_RUNTIME_ADAPTER_ID,
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
      reconciliationImplemented: false,
      conflictResolutionImplemented: false,
      automaticMatchingImplemented: false,
      workflowIntegrationImplemented: false,
      engine: { ...DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toReconciliationCapabilities(
        DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): ReconciliationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "RECONCILIATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ReconciliationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareReconciliation(
    input: PrepareReconciliationInput,
  ): Promise<PrepareReconciliationResult> {
    const result = await this.delegate.prepareReconciliation(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getReconciliation(input: GetReconciliationInput): Promise<GetReconciliationResult> {
    const result = await this.delegate.getReconciliation(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listReconciliations(input?: ListReconciliationsInput): Promise<ListReconciliationsResult> {
    const result = await this.delegate.listReconciliations(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async correlateReconciliation(
    input: CorrelateReconciliationInput,
  ): Promise<CorrelateReconciliationResult> {
    const result = await this.delegate.correlateReconciliation(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ReconciliationStatsInput): Promise<ReconciliationStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
