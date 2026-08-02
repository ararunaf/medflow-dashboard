/**
 * MockTISSProviderAdapter — TISS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XML. Sem operadoras. Sem banco/Storage/OCR.
 */
import { DEFAULT_MOCK_TISS_PROVIDER_CAPABILITIES } from "../ports/capabilities";
import type { TISSProviderPort } from "../ports/tiss-provider-port";
import type {
  TISSProcessInput,
  TISSProviderConfigurationValidation,
  TISSProviderHealth,
  TISSProviderId,
  TISSProviderInfo,
  TISSProviderMetadata,
  TISSProviderOperationResult,
  TISSProviderPortCapabilities,
} from "../ports/types";
import { DefaultTISSProviderAdapter } from "./default-tiss-provider-adapter";

export const MOCK_TISS_PROVIDER_ADAPTER_ID = "mock-deterministic-tiss";
export const DEFAULT_MOCK_TISS_PROVIDER_VERSION = "1.0.0";

export type MockTISSProviderAdapterOptions = {
  provider?: Extract<TISSProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
};

function mockMetadata(providerId: Extract<TISSProviderId, "mock" | "test">): TISSProviderMetadata {
  return {
    name: providerId === "test" ? "Test TISS Provider" : "Mock TISS Provider",
    version: DEFAULT_MOCK_TISS_PROVIDER_VERSION,
    vendor: "medicflow-enterprise",
    description: "Deterministic in-process TISS mock — no network, no XML, no operators.",
  };
}

/**
 * Mock adapter — delega process ao Default em modo estrutural.
 */
export class MockTISSProviderAdapter implements TISSProviderPort {
  readonly providerId: Extract<TISSProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: TISSProviderMetadata;
  private readonly delegate: DefaultTISSProviderAdapter;

  constructor(options: MockTISSProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} TISS provider ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);
    this.delegate = new DefaultTISSProviderAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
    });
  }

  capabilities(): TISSProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_TISS_PROVIDER_ADAPTER_ID,
      tiss: { ...DEFAULT_MOCK_TISS_PROVIDER_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsStructuralProcess: true,
      supportsResolveProfile: true,
      supportsResolveProvider: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsClinicalValidation: false,
    };
  }

  providerInfo(): TISSProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TISS",
      capabilities: { ...DEFAULT_MOCK_TISS_PROVIDER_CAPABILITIES },
    };
  }

  async health(): Promise<TISSProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy ? "ready" : "unhealthy",
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<TISSProviderConfigurationValidation> {
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: "Mock TISS provider não requer configuração externa.",
    };
  }

  async process(input: TISSProcessInput): Promise<TISSProviderOperationResult> {
    const result = await this.delegate.process(input);
    return {
      ...result,
      provider: this.providerId,
      simulated: true,
    };
  }
}
