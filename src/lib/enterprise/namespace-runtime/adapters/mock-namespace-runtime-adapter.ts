/**
 * MockNamespaceRuntimeAdapter — TISS-10.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem namespace oficial. Sem resolução real. Sem XML TISS/ANS. Sem operadoras. Sem banco.
 */
import {
  DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES,
  toCanonicalNamespaceCapabilities,
} from "../ports/capabilities";
import type { NamespaceRuntimePort } from "../ports/namespace-runtime-port";
import type {
  GetCanonicalNamespaceResultInput,
  GetCanonicalNamespaceResultResult,
  ListCanonicalNamespaceResultsInput,
  ListCanonicalNamespaceResultsResult,
  PrepareCanonicalNamespaceInput,
  PrepareCanonicalNamespaceResult,
  NamespaceRuntimeHealth,
  NamespaceRuntimeInfo,
  NamespaceRuntimePortCapabilities,
  NamespaceRuntimeProviderId,
  NamespaceRuntimeProviderMetadata,
} from "../ports/types";
import type { NamespaceRuntimeStore } from "../store";
import { DefaultNamespaceRuntimeAdapter } from "./default-namespace-runtime-adapter";

export const MOCK_NAMESPACE_RUNTIME_ADAPTER_ID = "mock-deterministic-namespace";
export const DEFAULT_MOCK_NAMESPACE_RUNTIME_VERSION = "1.0.0";

export type MockNamespaceRuntimeAdapterOptions = {
  provider?: Extract<NamespaceRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: NamespaceRuntimeStore;
};

function mockMetadata(
  providerId: Extract<NamespaceRuntimeProviderId, "mock" | "test">,
): NamespaceRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Namespace Runtime" : "Mock Namespace Runtime",
    version: DEFAULT_MOCK_NAMESPACE_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process Namespace Runtime mock — no network, no official namespace, no real resolution, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockNamespaceRuntimeAdapter implements NamespaceRuntimePort {
  readonly providerId: Extract<NamespaceRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: NamespaceRuntimeProviderMetadata;
  private readonly delegate: DefaultNamespaceRuntimeAdapter;

  constructor(options: MockNamespaceRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Namespace Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultNamespaceRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
    });
  }

  getStore(): NamespaceRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): NamespaceRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_NAMESPACE_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES },
      canonical: toCanonicalNamespaceCapabilities(DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES),
      supportsCanonicalNamespace: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      runtimeReady: true,
      officialNamespacesLoaded: false,
      realNamespacesLoaded: false,
      namespaceResolutionEnabled: false,
      namespaceValidationEnabled: false,
      officialAnsNamespacesLoaded: false,
      officialTissNamespacesLoaded: false,
      implementsOfficialNamespaces: false,
      implementsNamespaceValidation: false,
      implementsRealNamespaceResolution: false,
      implementsOperatorDispatch: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): NamespaceRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "NAMESPACE_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<NamespaceRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepare(input: PrepareCanonicalNamespaceInput): Promise<PrepareCanonicalNamespaceResult> {
    const result = await this.delegate.prepare(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(
    input: GetCanonicalNamespaceResultInput,
  ): Promise<GetCanonicalNamespaceResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listResults(
    input?: ListCanonicalNamespaceResultsInput,
  ): Promise<ListCanonicalNamespaceResultsResult> {
    const result = await this.delegate.listResults(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
