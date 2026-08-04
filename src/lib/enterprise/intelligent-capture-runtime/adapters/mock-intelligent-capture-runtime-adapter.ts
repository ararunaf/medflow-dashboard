/**
 * MockIntelligentCaptureRuntimeAdapter — F3-CAP-04.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem OCR. Sem IA. Sem captura. Sem leitura de arquivos.
 */
import {
  DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
  toCanonicalCaptureCapabilities,
} from "../ports/capabilities";
import type { IntelligentCaptureRuntimePort } from "../ports/intelligent-capture-runtime-port";
import type {
  CloseCaptureRequestInput,
  CloseCaptureRequestResult,
  DiscoverCaptureSourcesInput,
  DiscoverCaptureSourcesResult,
  EnvelopeCaptureInput,
  EnvelopeCaptureResult,
  IntelligentCaptureRuntimeEnterpriseDeps,
  IntelligentCaptureRuntimeHealth,
  IntelligentCaptureRuntimeInfo,
  IntelligentCaptureRuntimePortCapabilities,
  IntelligentCaptureRuntimeProviderId,
  IntelligentCaptureRuntimeProviderMetadata,
  OpenCaptureRequestInput,
  OpenCaptureRequestResult,
  RegisterCaptureSourceInput,
  RegisterCaptureSourceResult,
  RouteCaptureInput,
  RouteCaptureResult,
  CaptureStatsInput,
  CaptureStatsResult,
  UnregisterCaptureSourceInput,
  UnregisterCaptureSourceResult,
} from "../ports/types";
import type { IntelligentCaptureRuntimeStore } from "../store";
import { DefaultIntelligentCaptureRuntimeAdapter } from "./default-intelligent-capture-runtime-adapter";

export const MOCK_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID = "mock-deterministic-intelligent-capture";
export const DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_VERSION = "1.0.0";

export type MockIntelligentCaptureRuntimeAdapterOptions = {
  provider?: Extract<IntelligentCaptureRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: IntelligentCaptureRuntimeStore;
  enterpriseDeps?: IntelligentCaptureRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<IntelligentCaptureRuntimeProviderId, "mock" | "test">,
): IntelligentCaptureRuntimeProviderMetadata {
  return {
    name:
      providerId === "test"
        ? "Test Intelligent Capture Runtime"
        : "Mock Intelligent Capture Runtime",
    version: DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Intelligent Capture Runtime mock — no network, no OCR, no AI, no automatic capture.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockIntelligentCaptureRuntimeAdapter implements IntelligentCaptureRuntimePort {
  readonly providerId: Extract<IntelligentCaptureRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: IntelligentCaptureRuntimeProviderMetadata;
  private readonly delegate: DefaultIntelligentCaptureRuntimeAdapter;

  constructor(options: MockIntelligentCaptureRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Intelligent Capture Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultIntelligentCaptureRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
    });
  }

  getStore(): IntelligentCaptureRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): IntelligentCaptureRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES },
      canonical: toCanonicalCaptureCapabilities(
        DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalCapture: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      usesOCRRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      runtimeReady: true,
      scannerIntegrationImplemented: false,
      watchFolderIntegrationImplemented: false,
      uploadIntegrationImplemented: false,
      capturePipelineImplemented: false,
      documentRoutingImplemented: false,
      automaticSelectionImplemented: false,
      automaticCaptureImplemented: false,
      ocrPipelineImplemented: false,
      classificationPipelineImplemented: false,
      processingPipelineImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): IntelligentCaptureRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "INTELLIGENT_CAPTURE_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<IntelligentCaptureRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async registerSource(input: RegisterCaptureSourceInput): Promise<RegisterCaptureSourceResult> {
    const result = await this.delegate.registerSource(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregisterSource(
    input: UnregisterCaptureSourceInput,
  ): Promise<UnregisterCaptureSourceResult> {
    const result = await this.delegate.unregisterSource(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async discoverSources(
    input?: DiscoverCaptureSourcesInput,
  ): Promise<DiscoverCaptureSourcesResult> {
    const result = await this.delegate.discoverSources(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async openRequest(input: OpenCaptureRequestInput): Promise<OpenCaptureRequestResult> {
    const result = await this.delegate.openRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeRequest(input: CloseCaptureRequestInput): Promise<CloseCaptureRequestResult> {
    const result = await this.delegate.closeRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async route(input: RouteCaptureInput): Promise<RouteCaptureResult> {
    const result = await this.delegate.route(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async envelope(input: EnvelopeCaptureInput): Promise<EnvelopeCaptureResult> {
    const result = await this.delegate.envelope(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: CaptureStatsInput): Promise<CaptureStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
