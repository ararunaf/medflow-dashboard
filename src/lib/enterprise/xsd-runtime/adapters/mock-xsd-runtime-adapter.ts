/**
 * MockXSDRuntimeAdapter — TISS-09.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XSD oficial. Sem validação real. Sem XML TISS/ANS. Sem operadoras. Sem banco.
 */
import {
  DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES,
  toCanonicalXSDCapabilities,
} from "../ports/capabilities";
import type { XSDRuntimePort } from "../ports/xsd-runtime-port";
import type {
  GetCanonicalXSDResultInput,
  GetCanonicalXSDResultResult,
  ListCanonicalXSDResultsInput,
  ListCanonicalXSDResultsResult,
  PrepareCanonicalXSDInput,
  PrepareCanonicalXSDResult,
  XSDRuntimeHealth,
  XSDRuntimeInfo,
  XSDRuntimePortCapabilities,
  XSDRuntimeProviderId,
  XSDRuntimeProviderMetadata,
} from "../ports/types";
import type { XSDRuntimeStore } from "../store";
import { DefaultXSDRuntimeAdapter } from "./default-xsd-runtime-adapter";

export const MOCK_XSD_RUNTIME_ADAPTER_ID = "mock-deterministic-xsd";
export const DEFAULT_MOCK_XSD_RUNTIME_VERSION = "1.0.0";

export type MockXSDRuntimeAdapterOptions = {
  provider?: Extract<XSDRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: XSDRuntimeStore;
};

function mockMetadata(
  providerId: Extract<XSDRuntimeProviderId, "mock" | "test">,
): XSDRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test XSD Runtime" : "Mock XSD Runtime",
    version: DEFAULT_MOCK_XSD_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process XSD Runtime mock — no network, no official XSD, no real validation, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockXSDRuntimeAdapter implements XSDRuntimePort {
  readonly providerId: Extract<XSDRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: XSDRuntimeProviderMetadata;
  private readonly delegate: DefaultXSDRuntimeAdapter;

  constructor(options: MockXSDRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} XSD Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultXSDRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
    });
  }

  getStore(): XSDRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): XSDRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_XSD_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXSDCapabilities(DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES),
      supportsCanonicalXsd: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      runtimeReady: true,
      officialXsdLoaded: false,
      realXsdLoaded: false,
      realValidationAvailable: false,
      officialNamespacesLoaded: false,
      officialSchemasLoaded: false,
      schemaParsingEnabled: false,
      schemaValidationEnabled: false,
      implementsOfficialXsd: false,
      implementsXsdValidation: false,
      implementsRealXmlValidation: false,
      implementsOperatorDispatch: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): XSDRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XSD_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XSDRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepare(input: PrepareCanonicalXSDInput): Promise<PrepareCanonicalXSDResult> {
    const result = await this.delegate.prepare(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetCanonicalXSDResultInput): Promise<GetCanonicalXSDResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listResults(input?: ListCanonicalXSDResultsInput): Promise<ListCanonicalXSDResultsResult> {
    const result = await this.delegate.listResults(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
