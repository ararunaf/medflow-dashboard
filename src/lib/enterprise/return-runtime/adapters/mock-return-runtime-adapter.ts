/**
 * MockReturnRuntimeAdapter — C-08 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem processamento de retorno. Sem correlação automática. Sem reconciliação.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES,
  toReturnCapabilities,
} from "../ports/capabilities";
import type { ReturnRuntimePort } from "../ports/return-runtime-port";
import type {
  CorrelateReturnInput,
  CorrelateReturnResult,
  GetReturnInput,
  GetReturnResult,
  ListReturnsInput,
  ListReturnsResult,
  PrepareReturnInput,
  PrepareReturnResult,
  ReturnRuntimeCapabilities,
  ReturnRuntimeEnterpriseDeps,
  ReturnRuntimeHealth,
  ReturnRuntimeInfo,
  ReturnRuntimeProviderId,
  ReturnRuntimeProviderMetadata,
  ReturnStatsInput,
  ReturnStatsResult,
} from "../ports/types";
import type { ReturnRuntimeStore } from "../store";
import { InMemoryReturnRuntimeStore } from "../store";
import { DefaultReturnRuntimeAdapter } from "./default-return-runtime-adapter";

export const MOCK_RETURN_RUNTIME_ADAPTER_ID = "mock-deterministic-return-runtime";
export const DEFAULT_MOCK_RETURN_RUNTIME_VERSION = "1.0.0";

export type MockReturnRuntimeAdapterOptions = {
  provider?: Extract<ReturnRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ReturnRuntimeStore;
  enterpriseDeps?: ReturnRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<ReturnRuntimeProviderId, "mock" | "test">,
): ReturnRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Return Runtime" : "Mock Return Runtime",
    version: DEFAULT_MOCK_RETURN_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Return Runtime mock — no return processing, no automatic correlation, no network.",
  };
}

export class MockReturnRuntimeAdapter implements ReturnRuntimePort {
  readonly providerId: Extract<ReturnRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: ReturnRuntimeProviderMetadata;
  private readonly delegate: DefaultReturnRuntimeAdapter;

  constructor(options: MockReturnRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Return Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultReturnRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryReturnRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): ReturnRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ReturnRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_RETURN_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareReturn: true,
      supportsGetReturn: true,
      supportsListReturns: true,
      supportsCorrelateReturn: true,
      supportsStats: true,
      supportsCanonicalReturnManifest: true,
      supportsReturnCorrelation: true,
      supportsReturnStateMachine: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesProtocolRuntimePort: true,
      usesBatchRuntimePort: true,
      usesAuthorizationRuntimePort: true,
      usesOperatorRuntimePort: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesAuditRuntimePort: true,
      runtimeReady: true,
      returnProcessingImplemented: false,
      automaticCorrelationImplemented: false,
      statusUpdateImplemented: false,
      reconciliationImplemented: false,
      workflowIntegrationImplemented: false,
      xmlParserImplemented: false,
      soapImplemented: false,
      operatorCommunicationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toReturnCapabilities(DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): ReturnRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "RETURN_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ReturnRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareReturn(input: PrepareReturnInput): Promise<PrepareReturnResult> {
    const result = await this.delegate.prepareReturn(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getReturn(input: GetReturnInput): Promise<GetReturnResult> {
    const result = await this.delegate.getReturn(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listReturns(input?: ListReturnsInput): Promise<ListReturnsResult> {
    const result = await this.delegate.listReturns(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async correlateReturn(input: CorrelateReturnInput): Promise<CorrelateReturnResult> {
    const result = await this.delegate.correlateReturn(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ReturnStatsInput): Promise<ReturnStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
