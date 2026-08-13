/**
 * MockIdentityRuntimeAdapter — S2-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem identidade real. Sem criptografia. Sem regras TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalIdentityCapabilities,
} from "../ports/capabilities";
import type { IdentityRuntimePort } from "../ports/identity-runtime-port";
import type {
  IdentityRuntimeCapabilities,
  IdentityRuntimeHealth,
  IdentityRuntimeInfo,
  IdentityRuntimeProviderId,
  IdentityRuntimeProviderMetadata,
  IdentityStatsInput,
  IdentityStatsResult,
  CloseIdentityJobInput,
  CloseIdentityJobResult,
  GetIdentityResultInput,
  GetIdentityResultResult,
  OpenIdentityJobInput,
  OpenIdentityJobResult,
  RegisterIdentityFindingInput,
  RegisterIdentityFindingResult,
  SubmitIdentityRequestInput,
  SubmitIdentityRequestResult,
} from "../ports/types";
import type { IdentityRuntimeStore } from "../store";
import { InMemoryIdentityRuntimeStore } from "../store";
import { DefaultIdentityRuntimeAdapter } from "./default-identity-runtime-adapter";

export const MOCK_IDENTITY_RUNTIME_ADAPTER_ID = "mock-deterministic-identity-runtime";
export const DEFAULT_MOCK_IDENTITY_RUNTIME_VERSION = "1.0.0";

export type MockIdentityRuntimeAdapterOptions = {
  provider?: Extract<IdentityRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: IdentityRuntimeStore;
  enterpriseDeps?: Record<string, never>;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<IdentityRuntimeProviderId, "mock" | "test">,
): IdentityRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Identity Runtime" : "Mock Identity Runtime",
    version: DEFAULT_MOCK_IDENTITY_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Identity Runtime mock — no network, no real identity, no cryptography.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockIdentityRuntimeAdapter implements IdentityRuntimePort {
  readonly providerId: Extract<IdentityRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: IdentityRuntimeProviderMetadata;
  private readonly delegate: DefaultIdentityRuntimeAdapter;

  constructor(options: MockIdentityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Identity Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultIdentityRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryIdentityRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): IdentityRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): IdentityRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_IDENTITY_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalIdentity: true,
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
      identityEngineImplemented: false,
      businessRulesImplemented: false,
      tissIdentityImplemented: false,
      operatorIdentityImplemented: false,
      automaticIdentityImplemented: false,
      identitySuggestionsImplemented: false,
      identityJustificationImplemented: false,
      identityScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
      engine: { ...DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalIdentityCapabilities(DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): IdentityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "IDENTITY_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<IdentityRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenIdentityJobInput): Promise<OpenIdentityJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseIdentityJobInput): Promise<CloseIdentityJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitIdentityRequestInput): Promise<SubmitIdentityRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerFinding(
    input: RegisterIdentityFindingInput,
  ): Promise<RegisterIdentityFindingResult> {
    const result = await this.delegate.registerFinding(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetIdentityResultInput): Promise<GetIdentityResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: IdentityStatsInput): Promise<IdentityStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
