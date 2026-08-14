/**
 * MockComplianceRuntimeAdapter — S3-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem identidade real. Sem criptografia. Sem regras TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalComplianceCapabilities,
} from "../ports/capabilities";
import type { ComplianceRuntimePort } from "../ports/compliance-runtime-port";
import type {
  ComplianceRuntimeCapabilities,
  ComplianceRuntimeEnterpriseDeps,
  ComplianceRuntimeHealth,
  ComplianceRuntimeInfo,
  ComplianceRuntimeProviderId,
  ComplianceRuntimeProviderMetadata,
  ComplianceStatsInput,
  ComplianceStatsResult,
  CloseComplianceJobInput,
  CloseComplianceJobResult,
  GetComplianceResultInput,
  GetComplianceResultResult,
  OpenComplianceJobInput,
  OpenComplianceJobResult,
  RegisterComplianceFindingInput,
  RegisterComplianceFindingResult,
  SubmitComplianceRequestInput,
  SubmitComplianceRequestResult,
} from "../ports/types";
import type { ComplianceRuntimeStore } from "../store";
import { InMemoryComplianceRuntimeStore } from "../store";
import { DefaultComplianceRuntimeAdapter } from "./default-compliance-runtime-adapter";

export const MOCK_COMPLIANCE_RUNTIME_ADAPTER_ID = "mock-deterministic-compliance-runtime";
export const DEFAULT_MOCK_COMPLIANCE_RUNTIME_VERSION = "1.0.0";

export type MockComplianceRuntimeAdapterOptions = {
  provider?: Extract<ComplianceRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ComplianceRuntimeStore;
  enterpriseDeps?: ComplianceRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<ComplianceRuntimeProviderId, "mock" | "test">,
): ComplianceRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Compliance Runtime" : "Mock Compliance Runtime",
    version: DEFAULT_MOCK_COMPLIANCE_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Compliance Runtime mock — no network, no real compliance, no cryptography.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockComplianceRuntimeAdapter implements ComplianceRuntimePort {
  readonly providerId: Extract<ComplianceRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: ComplianceRuntimeProviderMetadata;
  private readonly delegate: DefaultComplianceRuntimeAdapter;

  constructor(options: MockComplianceRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Compliance Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultComplianceRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryComplianceRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): ComplianceRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ComplianceRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_COMPLIANCE_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalCompliance: true,
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
      complianceEngineImplemented: false,
      lgpdImplemented: false,
      privacyImplemented: false,
      dataClassificationImplemented: false,
      consentManagementImplemented: false,
      auditComplianceImplemented: false,
      retentionImplemented: false,
      chainOfCustodyImplemented: false,
      digitalSignatureImplemented: false,
      encryptionImplemented: false,
      hsmImplemented: false,
      keyVaultImplemented: false,
      siemImplemented: false,
      openTelemetryImplemented: false,
      businessRulesImplemented: false,
      tissComplianceImplemented: false,
      operatorComplianceImplemented: false,
      automaticComplianceImplemented: false,
      complianceSuggestionsImplemented: false,
      complianceJustificationImplemented: false,
      complianceScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
      engine: { ...DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalComplianceCapabilities(
        DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): ComplianceRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "COMPLIANCE_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ComplianceRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenComplianceJobInput): Promise<OpenComplianceJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseComplianceJobInput): Promise<CloseComplianceJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitComplianceRequestInput): Promise<SubmitComplianceRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerFinding(
    input: RegisterComplianceFindingInput,
  ): Promise<RegisterComplianceFindingResult> {
    const result = await this.delegate.registerFinding(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetComplianceResultInput): Promise<GetComplianceResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ComplianceStatsInput): Promise<ComplianceStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
