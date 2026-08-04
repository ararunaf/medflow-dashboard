/**
 * MockOperatorRuntimeAdapter — C-04 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem operadoras reais. Sem autenticação. Sem SOAP/XML/REST funcional.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
  toOperatorCapabilities,
} from "../ports/capabilities";
import type { OperatorRuntimePort } from "../ports/operator-runtime-port";
import type {
  GetOperatorProfileInput,
  GetOperatorProfileResult,
  ListOperatorProfilesInput,
  ListOperatorProfilesResult,
  OperatorRuntimeCapabilities,
  OperatorRuntimeEnterpriseDeps,
  OperatorRuntimeHealth,
  OperatorRuntimeInfo,
  OperatorRuntimeProviderId,
  OperatorRuntimeProviderMetadata,
  OperatorStatsInput,
  OperatorStatsResult,
  PrepareOperatorProfileInput,
  PrepareOperatorProfileResult,
} from "../ports/types";
import type { OperatorRuntimeStore } from "../store";
import { InMemoryOperatorRuntimeStore } from "../store";
import { DefaultOperatorRuntimeAdapter } from "./default-operator-runtime-adapter";

export const MOCK_OPERATOR_RUNTIME_ADAPTER_ID = "mock-deterministic-operator-runtime";
export const DEFAULT_MOCK_OPERATOR_RUNTIME_VERSION = "1.0.0";

export type MockOperatorRuntimeAdapterOptions = {
  provider?: Extract<OperatorRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: OperatorRuntimeStore;
  enterpriseDeps?: OperatorRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<OperatorRuntimeProviderId, "mock" | "test">,
): OperatorRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Operator Runtime" : "Mock Operator Runtime",
    version: DEFAULT_MOCK_OPERATOR_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description: "Deterministic in-process Operator Runtime mock — no real operators, no network.",
  };
}

export class MockOperatorRuntimeAdapter implements OperatorRuntimePort {
  readonly providerId: Extract<OperatorRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: OperatorRuntimeProviderMetadata;
  private readonly delegate: DefaultOperatorRuntimeAdapter;

  constructor(options: MockOperatorRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Operator Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultOperatorRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryOperatorRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): OperatorRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): OperatorRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_OPERATOR_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareProfile: true,
      supportsGetProfile: true,
      supportsListProfiles: true,
      supportsStats: true,
      supportsCanonicalOperator: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      runtimeReady: true,
      operatorImplemented: false,
      operatorCapabilityProfileImplemented: false,
      operatorAuthenticationImplemented: false,
      operatorCommunicationImplemented: false,
      soapFunctionalImplemented: false,
      xmlFunctionalImplemented: false,
      restImplemented: false,
      authorizationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toOperatorCapabilities(DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): OperatorRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "OPERATOR_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<OperatorRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareProfile(input: PrepareOperatorProfileInput): Promise<PrepareOperatorProfileResult> {
    const result = await this.delegate.prepareProfile(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getProfile(input: GetOperatorProfileInput): Promise<GetOperatorProfileResult> {
    const result = await this.delegate.getProfile(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listProfiles(input?: ListOperatorProfilesInput): Promise<ListOperatorProfilesResult> {
    const result = await this.delegate.listProfiles(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: OperatorStatsInput): Promise<OperatorStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
