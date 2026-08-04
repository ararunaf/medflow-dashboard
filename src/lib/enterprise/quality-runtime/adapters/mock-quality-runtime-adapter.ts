/**
 * MockQualityRuntimeAdapter — F3-CAP-13.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem avaliação automática. Sem score funcional. Sem decisão automática.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
  toQualityCapabilities,
} from "../ports/capabilities";
import type { QualityRuntimePort } from "../ports/quality-runtime-port";
import type {
  QualityRuntimeCapabilities,
  QualityRuntimeEnterpriseDeps,
  QualityRuntimeHealth,
  QualityRuntimeInfo,
  QualityRuntimeProviderId,
  QualityRuntimeProviderMetadata,
  QualityStatsInput,
  QualityStatsResult,
  GetQualityResultInput,
  GetQualityResultResult,
  PrepareQualityAssessmentInput,
  PrepareQualityAssessmentResult,
} from "../ports/types";
import type { QualityRuntimeStore } from "../store";
import { InMemoryQualityRuntimeStore } from "../store";
import { DefaultQualityRuntimeAdapter } from "./default-quality-runtime-adapter";

export const MOCK_QUALITY_RUNTIME_ADAPTER_ID = "mock-deterministic-quality-runtime";
export const DEFAULT_MOCK_QUALITY_RUNTIME_VERSION = "1.0.0";

export type MockQualityRuntimeAdapterOptions = {
  provider?: Extract<QualityRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: QualityRuntimeStore;
  enterpriseDeps?: QualityRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<QualityRuntimeProviderId, "mock" | "test">,
): QualityRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Quality Runtime" : "Mock Quality Runtime",
    version: DEFAULT_MOCK_QUALITY_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Quality Runtime mock — no network, no functional quality assessment.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockQualityRuntimeAdapter implements QualityRuntimePort {
  readonly providerId: Extract<QualityRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: QualityRuntimeProviderMetadata;
  private readonly delegate: DefaultQualityRuntimeAdapter;

  constructor(options: MockQualityRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Quality Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultQualityRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryQualityRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): QualityRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): QualityRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_QUALITY_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareQualityAssessment: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalQuality: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAutoFillRuntimePort: true,
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
      qualityEngineImplemented: false,
      qualityScoreImplemented: false,
      ocrQualityImplemented: false,
      classificationQualityImplemented: false,
      extractionQualityImplemented: false,
      validationQualityImplemented: false,
      mappingQualityImplemented: false,
      autoFillQualityImplemented: false,
      auditQualityImplemented: false,
      approvalDecisionImplemented: false,
      engine: { ...DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toQualityCapabilities(DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): QualityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "QUALITY_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<QualityRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareQualityAssessment(
    input: PrepareQualityAssessmentInput,
  ): Promise<PrepareQualityAssessmentResult> {
    const result = await this.delegate.prepareQualityAssessment(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetQualityResultInput): Promise<GetQualityResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: QualityStatsInput): Promise<QualityStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
