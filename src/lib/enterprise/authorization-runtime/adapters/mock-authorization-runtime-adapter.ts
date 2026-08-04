/**
 * MockAuthorizationRuntimeAdapter — C-05 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem autorização funcional. Sem elegibilidade. Sem SOAP/XML/REST funcional.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  toAuthorizationCapabilities,
} from "../ports/capabilities";
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type {
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeEnterpriseDeps,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeProviderId,
  AuthorizationRuntimeProviderMetadata,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  GetAuthorizationInput,
  GetAuthorizationResult,
  ListAuthorizationsInput,
  ListAuthorizationsResult,
  PrepareAuthorizationInput,
  PrepareAuthorizationResult,
} from "../ports/types";
import type { AuthorizationRuntimeStore } from "../store";
import { InMemoryAuthorizationRuntimeStore } from "../store";
import { DefaultAuthorizationRuntimeAdapter } from "./default-authorization-runtime-adapter";

export const MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID = "mock-deterministic-authorization-runtime";
export const DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION = "1.0.0";

export type MockAuthorizationRuntimeAdapterOptions = {
  provider?: Extract<AuthorizationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: AuthorizationRuntimeStore;
  enterpriseDeps?: AuthorizationRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<AuthorizationRuntimeProviderId, "mock" | "test">,
): AuthorizationRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Authorization Runtime" : "Mock Authorization Runtime",
    version: DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Authorization Runtime mock — no functional authorization, no network.",
  };
}

export class MockAuthorizationRuntimeAdapter implements AuthorizationRuntimePort {
  readonly providerId: Extract<AuthorizationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: AuthorizationRuntimeProviderMetadata;
  private readonly delegate: DefaultAuthorizationRuntimeAdapter;

  constructor(options: MockAuthorizationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Authorization Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultAuthorizationRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryAuthorizationRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): AuthorizationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): AuthorizationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareAuthorization: true,
      supportsGetAuthorization: true,
      supportsListAuthorizations: true,
      supportsStats: true,
      supportsCanonicalAuthorization: true,
      supportsStrategySelection: true,
      supportsPolicyDrivenAuthorization: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesOperatorRuntimePort: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      runtimeReady: true,
      authorizationImplemented: false,
      eligibilityImplemented: false,
      attachmentAuthorizationImplemented: false,
      batchAuthorizationImplemented: false,
      statusPollingImplemented: false,
      preAuthorizationImplemented: false,
      soapFunctionalImplemented: false,
      xmlFunctionalImplemented: false,
      restImplemented: false,
      operatorCommunicationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      engine: { ...DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toAuthorizationCapabilities(
        DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): AuthorizationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUTHORIZATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AuthorizationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareAuthorization(
    input: PrepareAuthorizationInput,
  ): Promise<PrepareAuthorizationResult> {
    const result = await this.delegate.prepareAuthorization(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getAuthorization(input: GetAuthorizationInput): Promise<GetAuthorizationResult> {
    const result = await this.delegate.getAuthorization(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listAuthorizations(input?: ListAuthorizationsInput): Promise<ListAuthorizationsResult> {
    const result = await this.delegate.listAuthorizations(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: AuthorizationStatsInput): Promise<AuthorizationStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
