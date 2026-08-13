/**
 * MockSecurityRuntimeAdapter — S1-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem segurança real. Sem criptografia. Sem regras TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalSecurityCapabilities,
} from "../ports/capabilities";
import type { SecurityRuntimePort } from "../ports/security-runtime-port";
import type {
  SecurityRuntimeCapabilities,
  SecurityRuntimeHealth,
  SecurityRuntimeInfo,
  SecurityRuntimeProviderId,
  SecurityRuntimeProviderMetadata,
  SecurityStatsInput,
  SecurityStatsResult,
  CloseSecurityJobInput,
  CloseSecurityJobResult,
  GetSecurityResultInput,
  GetSecurityResultResult,
  OpenSecurityJobInput,
  OpenSecurityJobResult,
  RegisterSecurityFindingInput,
  RegisterSecurityFindingResult,
  SubmitSecurityRequestInput,
  SubmitSecurityRequestResult,
} from "../ports/types";
import type { SecurityRuntimeStore } from "../store";
import { InMemorySecurityRuntimeStore } from "../store";
import { DefaultSecurityRuntimeAdapter } from "./default-security-runtime-adapter";

export const MOCK_SECURITY_RUNTIME_ADAPTER_ID = "mock-deterministic-security-runtime";
export const DEFAULT_MOCK_SECURITY_RUNTIME_VERSION = "1.0.0";

export type MockSecurityRuntimeAdapterOptions = {
  provider?: Extract<SecurityRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: SecurityRuntimeStore;
  enterpriseDeps?: Record<string, never>;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<SecurityRuntimeProviderId, "mock" | "test">,
): SecurityRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Security Runtime" : "Mock Security Runtime",
    version: DEFAULT_MOCK_SECURITY_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Security Runtime mock — no network, no real security, no cryptography.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockSecurityRuntimeAdapter implements SecurityRuntimePort {
  readonly providerId: Extract<SecurityRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: SecurityRuntimeProviderMetadata;
  private readonly delegate: DefaultSecurityRuntimeAdapter;

  constructor(options: MockSecurityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Security Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultSecurityRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemorySecurityRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): SecurityRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): SecurityRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_SECURITY_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalSecurity: true,
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
      securityEngineImplemented: false,
      businessRulesImplemented: false,
      tissSecurityImplemented: false,
      operatorSecurityImplemented: false,
      automaticSecurityImplemented: false,
      securitySuggestionsImplemented: false,
      securityJustificationImplemented: false,
      securityScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
      engine: { ...DEFAULT_MOCK_SECURITY_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalSecurityCapabilities(DEFAULT_MOCK_SECURITY_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): SecurityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SECURITY_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_SECURITY_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<SecurityRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenSecurityJobInput): Promise<OpenSecurityJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseSecurityJobInput): Promise<CloseSecurityJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitSecurityRequestInput): Promise<SubmitSecurityRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerFinding(
    input: RegisterSecurityFindingInput,
  ): Promise<RegisterSecurityFindingResult> {
    const result = await this.delegate.registerFinding(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetSecurityResultInput): Promise<GetSecurityResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: SecurityStatsInput): Promise<SecurityStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
