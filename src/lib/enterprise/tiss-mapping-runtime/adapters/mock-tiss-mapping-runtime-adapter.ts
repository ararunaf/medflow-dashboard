/**
 * MockTISSMappingRuntimeAdapter — F3-CAP-11.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem mapeamento funcional. Sem operadoras. Sem XML.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalMappingCapabilities,
} from "../ports/capabilities";
import type { TISSMappingRuntimePort } from "../ports/tiss-mapping-runtime-port";
import type {
  GetTISSMappingResultInput,
  GetTISSMappingResultResult,
  PrepareTISSMappingInput,
  PrepareTISSMappingResult,
  TISSMappingRuntimeCapabilities,
  TISSMappingRuntimeEnterpriseDeps,
  TISSMappingRuntimeHealth,
  TISSMappingRuntimeInfo,
  TISSMappingRuntimeProviderId,
  TISSMappingRuntimeProviderMetadata,
  TISSMappingStatsInput,
  TISSMappingStatsResult,
} from "../ports/types";
import type { TISSMappingRuntimeStore } from "../store";
import { InMemoryTISSMappingRuntimeStore } from "../store";
import { DefaultTISSMappingRuntimeAdapter } from "./default-tiss-mapping-runtime-adapter";

export const MOCK_TISS_MAPPING_RUNTIME_ADAPTER_ID = "mock-deterministic-tiss-mapping-runtime";
export const DEFAULT_MOCK_TISS_MAPPING_RUNTIME_VERSION = "1.0.0";

export type MockTISSMappingRuntimeAdapterOptions = {
  provider?: Extract<TISSMappingRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: TISSMappingRuntimeStore;
  enterpriseDeps?: TISSMappingRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<TISSMappingRuntimeProviderId, "mock" | "test">,
): TISSMappingRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test TISS Mapping Runtime" : "Mock TISS Mapping Runtime",
    version: DEFAULT_MOCK_TISS_MAPPING_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process TISS Mapping Runtime mock — no network, no functional mapping.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockTISSMappingRuntimeAdapter implements TISSMappingRuntimePort {
  readonly providerId: Extract<TISSMappingRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: TISSMappingRuntimeProviderMetadata;
  private readonly delegate: DefaultTISSMappingRuntimeAdapter;

  constructor(options: MockTISSMappingRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} TISS Mapping Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultTISSMappingRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryTISSMappingRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): TISSMappingRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): TISSMappingRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_TISS_MAPPING_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareMapping: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalMapping: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAIOrchestrationRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      runtimeReady: true,
      mappingEngineImplemented: false,
      operatorMappingImplemented: false,
      templateMappingImplemented: false,
      canonicalModelImplemented: false,
      guideTransformationImplemented: false,
      fieldNormalizationImplemented: false,
      tissVersionMappingImplemented: false,
      layoutMappingImplemented: false,
      xmlMappingImplemented: false,
      autoFillPreparationImplemented: false,
      engine: { ...DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalMappingCapabilities(
        DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): TISSMappingRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TISS_MAPPING_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<TISSMappingRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareMapping(input: PrepareTISSMappingInput): Promise<PrepareTISSMappingResult> {
    const result = await this.delegate.prepareMapping(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetTISSMappingResultInput): Promise<GetTISSMappingResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: TISSMappingStatsInput): Promise<TISSMappingStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
