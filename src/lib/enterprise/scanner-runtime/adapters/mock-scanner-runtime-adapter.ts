/**
 * MockScannerRuntimeAdapter — F3-CAP-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem Scanner real. Sem TWAIN/WIA/ISIS. Sem Drivers. Sem banco.
 */
import {
  DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES,
  toCanonicalScannerCapabilities,
} from "../ports/capabilities";
import type { ScannerRuntimePort } from "../ports/scanner-runtime-port";
import type {
  AcquireScannerInput,
  AcquireScannerResult,
  CloseScannerSessionInput,
  CloseScannerSessionResult,
  DiscoverScannersInput,
  DiscoverScannersResult,
  OpenScannerSessionInput,
  OpenScannerSessionResult,
  RegisterScannerInput,
  RegisterScannerResult,
  ScannerRuntimeEnterpriseDeps,
  ScannerRuntimeHealth,
  ScannerRuntimeInfo,
  ScannerRuntimePortCapabilities,
  ScannerRuntimeProviderId,
  ScannerRuntimeProviderMetadata,
  ScannerStatsInput,
  ScannerStatsResult,
  UnregisterScannerInput,
  UnregisterScannerResult,
} from "../ports/types";
import type { ScannerRuntimeStore } from "../store";
import { DefaultScannerRuntimeAdapter } from "./default-scanner-runtime-adapter";

export const MOCK_SCANNER_RUNTIME_ADAPTER_ID = "mock-deterministic-scanner";
export const DEFAULT_MOCK_SCANNER_RUNTIME_VERSION = "1.0.0";

export type MockScannerRuntimeAdapterOptions = {
  provider?: Extract<ScannerRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ScannerRuntimeStore;
  enterpriseDeps?: ScannerRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<ScannerRuntimeProviderId, "mock" | "test">,
): ScannerRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Scanner Runtime" : "Mock Scanner Runtime",
    version: DEFAULT_MOCK_SCANNER_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Scanner Runtime mock — no network, no real scanner, no drivers.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockScannerRuntimeAdapter implements ScannerRuntimePort {
  readonly providerId: Extract<ScannerRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: ScannerRuntimeProviderMetadata;
  private readonly delegate: DefaultScannerRuntimeAdapter;

  constructor(options: MockScannerRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Scanner Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultScannerRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
    });
  }

  getStore(): ScannerRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ScannerRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_SCANNER_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalScannerCapabilities(DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES),
      supportsCanonicalScanner: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesCaptureEngineRuntimePort: true,
      usesOCRRuntimePort: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      usesTISSRuntimePort: true,
      runtimeReady: true,
      scannerImplemented: false,
      twainImplemented: false,
      wiaImplemented: false,
      isisImplemented: false,
      networkScannerImplemented: false,
      driverImplemented: false,
      captureImplemented: false,
      implementsTwain: false,
      implementsWia: false,
      implementsIsis: false,
      implementsUsb: false,
      implementsNetworkScanner: false,
      implementsWatchFolder: false,
      implementsOcr: false,
      implementsUpload: false,
      implementsHttp: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): ScannerRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SCANNER_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<ScannerRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async register(input: RegisterScannerInput): Promise<RegisterScannerResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async unregister(input: UnregisterScannerInput): Promise<UnregisterScannerResult> {
    const result = await this.delegate.unregister(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async discover(input?: DiscoverScannersInput): Promise<DiscoverScannersResult> {
    const result = await this.delegate.discover(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async openSession(input: OpenScannerSessionInput): Promise<OpenScannerSessionResult> {
    const result = await this.delegate.openSession(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeSession(input: CloseScannerSessionInput): Promise<CloseScannerSessionResult> {
    const result = await this.delegate.closeSession(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async acquire(input: AcquireScannerInput): Promise<AcquireScannerResult> {
    const result = await this.delegate.acquire(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ScannerStatsInput): Promise<ScannerStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
