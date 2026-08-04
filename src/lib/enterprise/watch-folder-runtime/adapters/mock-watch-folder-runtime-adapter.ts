/**
 * MockWatchFolderRuntimeAdapter — F3-CAP-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem Watch Folder real. Sem FileSystemWatcher. Sem Polling. Sem banco.
 */
import {
  DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES,
  toCanonicalWatchFolderCapabilities,
} from "../ports/capabilities";
import type { WatchFolderRuntimePort } from "../ports/watch-folder-runtime-port";
import type {
  ObserveWatchFolderInput,
  ObserveWatchFolderResult,
  CloseWatchFolderSessionInput,
  CloseWatchFolderSessionResult,
  DiscoverWatchFoldersInput,
  DiscoverWatchFoldersResult,
  OpenWatchFolderSessionInput,
  OpenWatchFolderSessionResult,
  RegisterWatchFolderInput,
  RegisterWatchFolderResult,
  WatchFolderRuntimeEnterpriseDeps,
  WatchFolderRuntimeHealth,
  WatchFolderRuntimeInfo,
  WatchFolderRuntimePortCapabilities,
  WatchFolderRuntimeProviderId,
  WatchFolderRuntimeProviderMetadata,
  WatchFolderStatsInput,
  WatchFolderStatsResult,
  UnregisterWatchFolderInput,
  UnregisterWatchFolderResult,
} from "../ports/types";
import type { WatchFolderRuntimeStore } from "../store";
import { DefaultWatchFolderRuntimeAdapter } from "./default-watch-folder-runtime-adapter";

export const MOCK_WATCH_FOLDER_RUNTIME_ADAPTER_ID = "mock-deterministic-watch-folder";
export const DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_VERSION = "1.0.0";

export type MockWatchFolderRuntimeAdapterOptions = {
  provider?: Extract<WatchFolderRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: WatchFolderRuntimeStore;
  enterpriseDeps?: WatchFolderRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<WatchFolderRuntimeProviderId, "mock" | "test">,
): WatchFolderRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Watch Folder Runtime" : "Mock Watch Folder Runtime",
    version: DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Watch Folder Runtime mock — no network, no real watch folder, no FileSystemWatcher.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockWatchFolderRuntimeAdapter implements WatchFolderRuntimePort {
  readonly providerId: Extract<WatchFolderRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: WatchFolderRuntimeProviderMetadata;
  private readonly delegate: DefaultWatchFolderRuntimeAdapter;

  constructor(options: MockWatchFolderRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Watch Folder Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultWatchFolderRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
    });
  }

  getStore(): WatchFolderRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): WatchFolderRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalWatchFolderCapabilities(DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES),
      supportsCanonicalWatchFolder: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesScannerRuntimePort: true,
      usesCaptureEngineRuntimePort: true,
      usesOCRRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      runtimeReady: true,
      localWatchImplemented: false,
      networkWatchImplemented: false,
      uncImplemented: false,
      smbImplemented: false,
      azureFilesImplemented: false,
      pollingImplemented: false,
      fileSystemWatcherImplemented: false,
      recursiveWatchImplemented: false,
      changeNotificationImplemented: false,
      automaticImportImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): WatchFolderRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "WATCH_FOLDER_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<WatchFolderRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async register(input: RegisterWatchFolderInput): Promise<RegisterWatchFolderResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregister(input: UnregisterWatchFolderInput): Promise<UnregisterWatchFolderResult> {
    const result = await this.delegate.unregister(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async discover(input?: DiscoverWatchFoldersInput): Promise<DiscoverWatchFoldersResult> {
    const result = await this.delegate.discover(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async openSession(input: OpenWatchFolderSessionInput): Promise<OpenWatchFolderSessionResult> {
    const result = await this.delegate.openSession(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeSession(input: CloseWatchFolderSessionInput): Promise<CloseWatchFolderSessionResult> {
    const result = await this.delegate.closeSession(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async observe(input: ObserveWatchFolderInput): Promise<ObserveWatchFolderResult> {
    const result = await this.delegate.observe(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: WatchFolderStatsInput): Promise<WatchFolderStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
