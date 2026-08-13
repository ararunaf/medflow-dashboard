/**
 * MockAuthorizationRuntimeAdapter — S3-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem identidade real. Sem criptografia. Sem regras TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalAuthorizationCapabilities,
} from "../ports/capabilities";
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type {
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeEnterpriseDeps,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeProviderId,
  AuthorizationRuntimeProviderMetadata,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  CloseAuthorizationJobInput,
  CloseAuthorizationJobResult,
  GetAuthorizationResultInput,
  GetAuthorizationResultResult,
  OpenAuthorizationJobInput,
  OpenAuthorizationJobResult,
  RegisterAuthorizationFindingInput,
  RegisterAuthorizationFindingResult,
  SubmitAuthorizationRequestInput,
  SubmitAuthorizationRequestResult,
} from "../ports/types";
import type { AuthorizationRuntimeStore } from "../store";
import { InMemoryAuthorizationRuntimeStore } from "../store";
import { DefaultAuthorizationRuntimeAdapter } from "./default-authorization-runtime-adapter";

export const MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID = "mock-deterministic-authorization-runtime";
export const DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION = "1.0.0";

export type MockAuthorizationRuntimeAdapterOptions = {
  provider?: Extract<AuthorizationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: AuthorizationRuntimeStore;
  enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<AuthorizationRuntimeProviderId, "mock" | "test">,
): AuthorizationRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Authorization Runtime" : "Mock Authorization Runtime",
    version: DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Authorization Runtime mock — no network, no real authorization, no cryptography.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockAuthorizationRuntimeAdapter implements AuthorizationRuntimePort {
  readonly providerId: Extract<AuthorizationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: AuthorizationRuntimeProviderMetadata;
  private readonly delegate: DefaultAuthorizationRuntimeAdapter;

  constructor(options: MockAuthorizationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Authorization Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultAuthorizationRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryAuthorizationRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): AuthorizationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): AuthorizationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalAuthorization: true,
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
      authorizationEngineImplemented: false,
      businessRulesImplemented: false,
      tissAuthorizationImplemented: false,
      operatorAuthorizationImplemented: false,
      automaticAuthorizationImplemented: false,
      authorizationSuggestionsImplemented: false,
      authorizationJustificationImplemented: false,
      authorizationScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
      engine: { ...DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalAuthorizationCapabilities(
        DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): AuthorizationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUTHORIZATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AuthorizationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenAuthorizationJobInput): Promise<OpenAuthorizationJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseAuthorizationJobInput): Promise<CloseAuthorizationJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(
    input: SubmitAuthorizationRequestInput,
  ): Promise<SubmitAuthorizationRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerFinding(
    input: RegisterAuthorizationFindingInput,
  ): Promise<RegisterAuthorizationFindingResult> {
    const result = await this.delegate.registerFinding(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetAuthorizationResultInput): Promise<GetAuthorizationResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: AuthorizationStatsInput): Promise<AuthorizationStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
