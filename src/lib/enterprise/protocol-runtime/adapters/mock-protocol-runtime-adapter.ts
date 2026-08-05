/**
 * MockProtocolRuntimeAdapter — C-07 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem SOAP. Sem REST. Sem gRPC. Sem mensageria. Sem resolução funcional.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
  toProtocolCapabilities,
} from "../ports/capabilities";
import type { ProtocolRuntimePort } from "../ports/protocol-runtime-port";
import type {
  GetProtocolProfileInput,
  GetProtocolProfileResult,
  ListProtocolProfilesInput,
  ListProtocolProfilesResult,
  PrepareProtocolProfileInput,
  PrepareProtocolProfileResult,
  ProtocolRuntimeCapabilities,
  ProtocolRuntimeEnterpriseDeps,
  ProtocolRuntimeHealth,
  ProtocolRuntimeInfo,
  ProtocolRuntimeProviderId,
  ProtocolRuntimeProviderMetadata,
  ProtocolStatsInput,
  ProtocolStatsResult,
  ResolveProtocolInput,
  ResolveProtocolResult,
} from "../ports/types";
import type { ProtocolRuntimeStore } from "../store";
import { InMemoryProtocolRuntimeStore } from "../store";
import { DefaultProtocolRuntimeAdapter } from "./default-protocol-runtime-adapter";

export const MOCK_PROTOCOL_RUNTIME_ADAPTER_ID = "mock-deterministic-protocol-runtime";
export const DEFAULT_MOCK_PROTOCOL_RUNTIME_VERSION = "1.0.0";

export type MockProtocolRuntimeAdapterOptions = {
  provider?: Extract<ProtocolRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ProtocolRuntimeStore;
  enterpriseDeps?: ProtocolRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<ProtocolRuntimeProviderId, "mock" | "test">,
): ProtocolRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Protocol Runtime" : "Mock Protocol Runtime",
    version: DEFAULT_MOCK_PROTOCOL_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Protocol Runtime mock — no concrete protocols, no network.",
  };
}

export class MockProtocolRuntimeAdapter implements ProtocolRuntimePort {
  readonly providerId: Extract<ProtocolRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: ProtocolRuntimeProviderMetadata;
  private readonly delegate: DefaultProtocolRuntimeAdapter;

  constructor(options: MockProtocolRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Protocol Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultProtocolRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryProtocolRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): ProtocolRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ProtocolRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_PROTOCOL_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareProfile: true,
      supportsGetProfile: true,
      supportsListProfiles: true,
      supportsResolveProtocol: true,
      supportsStats: true,
      supportsCanonicalProtocolProfile: true,
      supportsProtocolResolver: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesBatchRuntimePort: true,
      usesAuthorizationRuntimePort: true,
      usesOperatorRuntimePort: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      runtimeReady: true,
      soapImplemented: false,
      restImplemented: false,
      grpcImplemented: false,
      messagingImplemented: false,
      protocolResolutionImplemented: false,
      httpImplemented: false,
      tlsImplemented: false,
      authenticationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toProtocolCapabilities(DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): ProtocolRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "PROTOCOL_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ProtocolRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareProfile(input: PrepareProtocolProfileInput): Promise<PrepareProtocolProfileResult> {
    const result = await this.delegate.prepareProfile(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getProfile(input: GetProtocolProfileInput): Promise<GetProtocolProfileResult> {
    const result = await this.delegate.getProfile(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listProfiles(input?: ListProtocolProfilesInput): Promise<ListProtocolProfilesResult> {
    const result = await this.delegate.listProfiles(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async resolveProtocol(input: ResolveProtocolInput): Promise<ResolveProtocolResult> {
    const result = await this.delegate.resolveProtocol(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ProtocolStatsInput): Promise<ProtocolStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
