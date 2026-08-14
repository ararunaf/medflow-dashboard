/**
 * MockGovernanceRuntimeAdapter — S6-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem identidade real. Sem criptografia. Sem regras TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalGovernanceCapabilities,
} from "../ports/capabilities";
import type { GovernanceRuntimePort } from "../ports/governance-runtime-port";
import type {
  GovernanceRuntimeCapabilities,
  GovernanceRuntimeEnterpriseDeps,
  GovernanceRuntimeHealth,
  GovernanceRuntimeInfo,
  GovernanceRuntimeProviderId,
  GovernanceRuntimeProviderMetadata,
  GovernanceStatsInput,
  GovernanceStatsResult,
  CloseGovernanceJobInput,
  CloseGovernanceJobResult,
  GetGovernanceResultInput,
  GetGovernanceResultResult,
  OpenGovernanceJobInput,
  OpenGovernanceJobResult,
  RegisterGovernanceFindingInput,
  RegisterGovernanceFindingResult,
  SubmitGovernanceRequestInput,
  SubmitGovernanceRequestResult,
} from "../ports/types";
import type { GovernanceRuntimeStore } from "../store";
import { InMemoryGovernanceRuntimeStore } from "../store";
import { DefaultGovernanceRuntimeAdapter } from "./default-governance-runtime-adapter";

export const MOCK_GOVERNANCE_RUNTIME_ADAPTER_ID = "mock-deterministic-governance-runtime";
export const DEFAULT_MOCK_GOVERNANCE_RUNTIME_VERSION = "1.0.0";

export type MockGovernanceRuntimeAdapterOptions = {
  provider?: Extract<GovernanceRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: GovernanceRuntimeStore;
  enterpriseDeps?: GovernanceRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<GovernanceRuntimeProviderId, "mock" | "test">,
): GovernanceRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Governance Runtime" : "Mock Governance Runtime",
    version: DEFAULT_MOCK_GOVERNANCE_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Governance Runtime mock — no network, no real governance, no cryptography.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockGovernanceRuntimeAdapter implements GovernanceRuntimePort {
  readonly providerId: Extract<GovernanceRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: GovernanceRuntimeProviderMetadata;
  private readonly delegate: DefaultGovernanceRuntimeAdapter;

  constructor(options: MockGovernanceRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Governance Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultGovernanceRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryGovernanceRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): GovernanceRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): GovernanceRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_GOVERNANCE_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalGovernance: true,
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
      governanceEngineImplemented: false,
      lgpdImplemented: false,
      privacyImplemented: false,
      dataClassificationImplemented: false,
      consentManagementImplemented: false,
      auditGovernanceImplemented: false,
      retentionImplemented: false,
      chainOfCustodyImplemented: false,
      digitalSignatureImplemented: false,
      encryptionImplemented: false,
      hsmImplemented: false,
      keyVaultImplemented: false,
      siemImplemented: false,
      openTelemetryImplemented: false,
      businessRulesImplemented: false,
      tissGovernanceImplemented: false,
      operatorGovernanceImplemented: false,
      automaticGovernanceImplemented: false,
      governanceSuggestionsImplemented: false,
      governanceJustificationImplemented: false,
      governanceScoreImplemented: false,
      governanceImplemented: false,
      automaticCorrectionImplemented: false,
      engine: { ...DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalGovernanceCapabilities(
        DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): GovernanceRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "GOVERNANCE_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<GovernanceRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenGovernanceJobInput): Promise<OpenGovernanceJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseGovernanceJobInput): Promise<CloseGovernanceJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitGovernanceRequestInput): Promise<SubmitGovernanceRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerFinding(
    input: RegisterGovernanceFindingInput,
  ): Promise<RegisterGovernanceFindingResult> {
    const result = await this.delegate.registerFinding(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetGovernanceResultInput): Promise<GetGovernanceResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: GovernanceStatsInput): Promise<GovernanceStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
