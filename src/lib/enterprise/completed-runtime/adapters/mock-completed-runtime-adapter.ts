/**
 * MockCompletedRuntimeAdapter — A10-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem completedoria real. Sem IA. Sem regras TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalCompletedCapabilities,
} from "../ports/capabilities";
import type { CompletedRuntimePort } from "../ports/completed-runtime-port";
import type {
  CompletedRuntimeCapabilities,
  CompletedRuntimeEnterpriseDeps,
  CompletedRuntimeHealth,
  CompletedRuntimeInfo,
  CompletedRuntimeProviderId,
  CompletedRuntimeProviderMetadata,
  CompletedStatsInput,
  CompletedStatsResult,
  CloseCompletedJobInput,
  CloseCompletedJobResult,
  GetCompletedResultInput,
  GetCompletedResultResult,
  OpenCompletedJobInput,
  OpenCompletedJobResult,
  RegisterCompletedFindingInput,
  RegisterCompletedFindingResult,
  SubmitCompletedRequestInput,
  SubmitCompletedRequestResult,
} from "../ports/types";
import type { CompletedRuntimeStore } from "../store";
import { InMemoryCompletedRuntimeStore } from "../store";
import { DefaultCompletedRuntimeAdapter } from "./default-completed-runtime-adapter";

export const MOCK_COMPLETED_RUNTIME_ADAPTER_ID = "mock-deterministic-completed-runtime";
export const DEFAULT_MOCK_COMPLETED_RUNTIME_VERSION = "1.0.0";

export type MockCompletedRuntimeAdapterOptions = {
  provider?: Extract<CompletedRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: CompletedRuntimeStore;
  enterpriseDeps?: CompletedRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<CompletedRuntimeProviderId, "mock" | "test">,
): CompletedRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Completed Runtime" : "Mock Completed Runtime",
    version: DEFAULT_MOCK_COMPLETED_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description: "Deterministic in-process Completed Runtime mock — no network, no real completed.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockCompletedRuntimeAdapter implements CompletedRuntimePort {
  readonly providerId: Extract<CompletedRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: CompletedRuntimeProviderMetadata;
  private readonly delegate: DefaultCompletedRuntimeAdapter;

  constructor(options: MockCompletedRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Completed Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultCompletedRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryCompletedRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): CompletedRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): CompletedRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_COMPLETED_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalCompleted: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAIOrchestrationRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      runtimeReady: true,
      completedEngineImplemented: false,
      businessRulesImplemented: false,
      tissCompletedImplemented: false,
      operatorCompletedImplemented: false,
      automaticCompletedImplemented: false,
      completedSuggestionsImplemented: false,
      completedJustificationImplemented: false,
      completedScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
      engine: { ...DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalCompletedCapabilities(
        DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): CompletedRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "COMPLETED_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<CompletedRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenCompletedJobInput): Promise<OpenCompletedJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseCompletedJobInput): Promise<CloseCompletedJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitCompletedRequestInput): Promise<SubmitCompletedRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerFinding(
    input: RegisterCompletedFindingInput,
  ): Promise<RegisterCompletedFindingResult> {
    const result = await this.delegate.registerFinding(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetCompletedResultInput): Promise<GetCompletedResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: CompletedStatsInput): Promise<CompletedStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
