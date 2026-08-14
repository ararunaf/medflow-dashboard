/**
 * MockTenantRuntimeAdapter — S3-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem identidade real. Sem criptografia. Sem regras TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalTenantCapabilities,
} from "../ports/capabilities";
import type { TenantRuntimePort } from "../ports/tenant-runtime-port";
import type {
  TenantRuntimeCapabilities,
  TenantRuntimeEnterpriseDeps,
  TenantRuntimeHealth,
  TenantRuntimeInfo,
  TenantRuntimeProviderId,
  TenantRuntimeProviderMetadata,
  TenantStatsInput,
  TenantStatsResult,
  CloseTenantJobInput,
  CloseTenantJobResult,
  GetTenantResultInput,
  GetTenantResultResult,
  OpenTenantJobInput,
  OpenTenantJobResult,
  RegisterTenantFindingInput,
  RegisterTenantFindingResult,
  SubmitTenantRequestInput,
  SubmitTenantRequestResult,
} from "../ports/types";
import type { TenantRuntimeStore } from "../store";
import { InMemoryTenantRuntimeStore } from "../store";
import { DefaultTenantRuntimeAdapter } from "./default-tenant-runtime-adapter";

export const MOCK_TENANT_RUNTIME_ADAPTER_ID = "mock-deterministic-tenant-runtime";
export const DEFAULT_MOCK_TENANT_RUNTIME_VERSION = "1.0.0";

export type MockTenantRuntimeAdapterOptions = {
  provider?: Extract<TenantRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: TenantRuntimeStore;
  enterpriseDeps?: TenantRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<TenantRuntimeProviderId, "mock" | "test">,
): TenantRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Tenant Runtime" : "Mock Tenant Runtime",
    version: DEFAULT_MOCK_TENANT_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Tenant Runtime mock — no network, no real tenant, no cryptography.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockTenantRuntimeAdapter implements TenantRuntimePort {
  readonly providerId: Extract<TenantRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: TenantRuntimeProviderMetadata;
  private readonly delegate: DefaultTenantRuntimeAdapter;

  constructor(options: MockTenantRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Tenant Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultTenantRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryTenantRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): TenantRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): TenantRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_TENANT_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalTenant: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAIOrchestrationRuntimePort: false,
      usesValidationRuntimePort: false,
      usesDocumentExtractionRuntimePort: false,
      usesDocumentClassificationRuntimePort: false,
      usesOCRRuntimePort: false,
      usesIntelligentCaptureRuntimePort: false,
      usesScannerRuntimePort: false,
      usesWatchFolderRuntimePort: false,
      usesUploadRuntimePort: false,
      usesPersistentQueueRuntimePort: false,
      usesWorkerRuntimePort: false,
      usesSchedulerRuntimePort: false,
      usesObservabilityRuntimePort: false,
      usesScalabilityRuntimePort: false,
      runtimeReady: true,
      tenantEngineImplemented: false,
      businessRulesImplemented: false,
      tissTenantImplemented: false,
      operatorTenantImplemented: false,
      automaticTenantImplemented: false,
      tenantSuggestionsImplemented: false,
      tenantJustificationImplemented: false,
      tenantScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
      engine: { ...DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalTenantCapabilities(DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): TenantRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TENANT_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<TenantRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenTenantJobInput): Promise<OpenTenantJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseTenantJobInput): Promise<CloseTenantJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitTenantRequestInput): Promise<SubmitTenantRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerFinding(input: RegisterTenantFindingInput): Promise<RegisterTenantFindingResult> {
    const result = await this.delegate.registerFinding(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetTenantResultInput): Promise<GetTenantResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: TenantStatsInput): Promise<TenantStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
