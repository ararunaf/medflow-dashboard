/**
 * MockAutoFillRuntimeAdapter — F3-CAP-12.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem preenchimento automático. Sem geração de XML. Sem escrita em guias.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
  toAutoFillCapabilities,
} from "../ports/capabilities";
import type { AutoFillRuntimePort } from "../ports/auto-fill-runtime-port";
import type {
  AutoFillRuntimeCapabilities,
  AutoFillRuntimeEnterpriseDeps,
  AutoFillRuntimeHealth,
  AutoFillRuntimeInfo,
  AutoFillRuntimeProviderId,
  AutoFillRuntimeProviderMetadata,
  AutoFillStatsInput,
  AutoFillStatsResult,
  GetAutoFillResultInput,
  GetAutoFillResultResult,
  PrepareAutoFillInput,
  PrepareAutoFillResult,
} from "../ports/types";
import type { AutoFillRuntimeStore } from "../store";
import { InMemoryAutoFillRuntimeStore } from "../store";
import { DefaultAutoFillRuntimeAdapter } from "./default-auto-fill-runtime-adapter";

export const MOCK_AUTO_FILL_RUNTIME_ADAPTER_ID = "mock-deterministic-auto-fill-runtime";
export const DEFAULT_MOCK_AUTO_FILL_RUNTIME_VERSION = "1.0.0";

export type MockAutoFillRuntimeAdapterOptions = {
  provider?: Extract<AutoFillRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: AutoFillRuntimeStore;
  enterpriseDeps?: AutoFillRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<AutoFillRuntimeProviderId, "mock" | "test">,
): AutoFillRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Auto-Fill Runtime" : "Mock Auto-Fill Runtime",
    version: DEFAULT_MOCK_AUTO_FILL_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Auto-Fill Runtime mock — no network, no functional auto-fill.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockAutoFillRuntimeAdapter implements AutoFillRuntimePort {
  readonly providerId: Extract<AutoFillRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: AutoFillRuntimeProviderMetadata;
  private readonly delegate: DefaultAutoFillRuntimeAdapter;

  constructor(options: MockAutoFillRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Auto-Fill Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultAutoFillRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryAutoFillRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): AutoFillRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): AutoFillRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_AUTO_FILL_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareAutoFill: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalAutoFill: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesAIOrchestrationRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      runtimeReady: true,
      autoFillEngineImplemented: false,
      guideGenerationImplemented: false,
      fieldPopulationImplemented: false,
      templatePopulationImplemented: false,
      operatorPopulationImplemented: false,
      xmlPopulationImplemented: false,
      validationIntegrationImplemented: false,
      auditIntegrationImplemented: false,
      qualityIntegrationImplemented: false,
      automaticCompletionImplemented: false,
      engine: { ...DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toAutoFillCapabilities(DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): AutoFillRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUTO_FILL_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AutoFillRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareAutoFill(input: PrepareAutoFillInput): Promise<PrepareAutoFillResult> {
    const result = await this.delegate.prepareAutoFill(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetAutoFillResultInput): Promise<GetAutoFillResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: AutoFillStatsInput): Promise<AutoFillStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
