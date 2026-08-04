/**
 * MockUploadRuntimeAdapter — F3-CAP-03.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem Upload real. Sem FileSystemWatcher. Sem Polling. Sem banco.
 */
import {
  DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES,
  toCanonicalUploadCapabilities,
} from "../ports/capabilities";
import type { UploadRuntimePort } from "../ports/upload-runtime-port";
import type {
  ReceiveUploadInput,
  ReceiveUploadResult,
  CloseUploadSessionInput,
  CloseUploadSessionResult,
  DiscoverUploadsInput,
  DiscoverUploadsResult,
  OpenUploadSessionInput,
  OpenUploadSessionResult,
  RegisterUploadInput,
  RegisterUploadResult,
  UploadRuntimeEnterpriseDeps,
  UploadRuntimeHealth,
  UploadRuntimeInfo,
  UploadRuntimePortCapabilities,
  UploadRuntimeProviderId,
  UploadRuntimeProviderMetadata,
  UploadStatsInput,
  UploadStatsResult,
  UnregisterUploadInput,
  UnregisterUploadResult,
} from "../ports/types";
import type { UploadRuntimeStore } from "../store";
import { DefaultUploadRuntimeAdapter } from "./default-upload-runtime-adapter";

export const MOCK_UPLOAD_RUNTIME_ADAPTER_ID = "mock-deterministic-upload";
export const DEFAULT_MOCK_UPLOAD_RUNTIME_VERSION = "1.0.0";

export type MockUploadRuntimeAdapterOptions = {
  provider?: Extract<UploadRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: UploadRuntimeStore;
  enterpriseDeps?: UploadRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<UploadRuntimeProviderId, "mock" | "test">,
): UploadRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Upload Runtime" : "Mock Upload Runtime",
    version: DEFAULT_MOCK_UPLOAD_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Upload Runtime mock — no network, no real upload, no FileSystemWatcher.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockUploadRuntimeAdapter implements UploadRuntimePort {
  readonly providerId: Extract<UploadRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: UploadRuntimeProviderMetadata;
  private readonly delegate: DefaultUploadRuntimeAdapter;

  constructor(options: MockUploadRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Upload Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultUploadRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
    });
  }

  getStore(): UploadRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): UploadRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_UPLOAD_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES },
      canonical: toCanonicalUploadCapabilities(DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES),
      supportsCanonicalUpload: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesCaptureEngineRuntimePort: true,
      usesOCRRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      runtimeReady: true,
      webUploadImplemented: false,
      desktopUploadImplemented: false,
      mobileUploadImplemented: false,
      apiUploadImplemented: false,
      multipartImplemented: false,
      chunkedUploadImplemented: false,
      resumableUploadImplemented: false,
      azureBlobImplemented: false,
      supabaseStorageImplemented: false,
      s3Implemented: false,
      googleDriveImplemented: false,
      oneDriveImplemented: false,
      dropboxImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): UploadRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "UPLOAD_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<UploadRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async register(input: RegisterUploadInput): Promise<RegisterUploadResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregister(input: UnregisterUploadInput): Promise<UnregisterUploadResult> {
    const result = await this.delegate.unregister(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async discover(input?: DiscoverUploadsInput): Promise<DiscoverUploadsResult> {
    const result = await this.delegate.discover(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async openSession(input: OpenUploadSessionInput): Promise<OpenUploadSessionResult> {
    const result = await this.delegate.openSession(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeSession(input: CloseUploadSessionInput): Promise<CloseUploadSessionResult> {
    const result = await this.delegate.closeSession(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async receive(input: ReceiveUploadInput): Promise<ReceiveUploadResult> {
    const result = await this.delegate.receive(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: UploadStatsInput): Promise<UploadStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
