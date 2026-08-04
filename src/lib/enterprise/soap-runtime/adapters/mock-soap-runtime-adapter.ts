/**
 * MockSOAPRuntimeAdapter — C-03 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem comunicação SOAP. Sem WSDL. Sem TLS. Sem certificado.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES,
  toSOAPCapabilities,
} from "../ports/capabilities";
import type { SOAPRuntimePort } from "../ports/soap-runtime-port";
import type {
  GetSOAPResponseInput,
  GetSOAPResponseResult,
  ListSOAPResponsesInput,
  ListSOAPResponsesResult,
  PrepareSOAPInput,
  PrepareSOAPResult,
  SOAPRuntimeCapabilities,
  SOAPRuntimeEnterpriseDeps,
  SOAPRuntimeHealth,
  SOAPRuntimeInfo,
  SOAPRuntimeProviderId,
  SOAPRuntimeProviderMetadata,
  SOAPStatsInput,
  SOAPStatsResult,
} from "../ports/types";
import type { SOAPRuntimeStore } from "../store";
import { InMemorySOAPRuntimeStore } from "../store";
import { DefaultSOAPRuntimeAdapter } from "./default-soap-runtime-adapter";

export const MOCK_SOAP_RUNTIME_ADAPTER_ID = "mock-deterministic-soap-runtime";
export const DEFAULT_MOCK_SOAP_RUNTIME_VERSION = "1.0.0";

export type MockSOAPRuntimeAdapterOptions = {
  provider?: Extract<SOAPRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: SOAPRuntimeStore;
  enterpriseDeps?: SOAPRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<SOAPRuntimeProviderId, "mock" | "test">,
): SOAPRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test SOAP Runtime" : "Mock SOAP Runtime",
    version: DEFAULT_MOCK_SOAP_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process SOAP Runtime mock — no network, no real SOAP communication.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockSOAPRuntimeAdapter implements SOAPRuntimePort {
  readonly providerId: Extract<SOAPRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: SOAPRuntimeProviderMetadata;
  private readonly delegate: DefaultSOAPRuntimeAdapter;

  constructor(options: MockSOAPRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} SOAP Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultSOAPRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemorySOAPRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): SOAPRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): SOAPRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_SOAP_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepare: true,
      supportsGetResponse: true,
      supportsListResponses: true,
      supportsStats: true,
      supportsCanonicalSOAP: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      runtimeReady: true,
      soapCommunicationImplemented: false,
      wsdlImplemented: false,
      soapEnvelopeImplemented: false,
      soapFaultImplemented: false,
      certificateImplemented: false,
      tlsImplemented: false,
      mtomImplemented: false,
      compressionImplemented: false,
      retryImplemented: false,
      operatorCommunicationImplemented: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsHttpEndpoint: false,
      knowsWsdl: false,
      engine: { ...DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toSOAPCapabilities(DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): SOAPRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SOAP_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<SOAPRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepare(input: PrepareSOAPInput): Promise<PrepareSOAPResult> {
    const result = await this.delegate.prepare(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResponse(input: GetSOAPResponseInput): Promise<GetSOAPResponseResult> {
    const result = await this.delegate.getResponse(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listResponses(input?: ListSOAPResponsesInput): Promise<ListSOAPResponsesResult> {
    const result = await this.delegate.listResponses(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: SOAPStatsInput): Promise<SOAPStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
