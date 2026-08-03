/**
 * MockXMLSerializerAdapter — TISS-06.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XML TISS/ANS real. Sem operadoras. Sem banco.
 */
import {
  DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES,
  toCanonicalXMLSerializerProviderCapabilities,
} from "../ports/capabilities";
import type { XMLSerializerRuntimePort } from "../ports/xml-serializer-runtime-port";
import type {
  GetCanonicalXMLSerializeResultInput,
  GetCanonicalXMLSerializeResultResult,
  ListCanonicalXMLSerializeResultsInput,
  ListCanonicalXMLSerializeResultsResult,
  SerializeCanonicalXMLInput,
  SerializeCanonicalXMLResult,
  XMLSerializerRuntimeHealth,
  XMLSerializerRuntimeInfo,
  XMLSerializerRuntimePortCapabilities,
  XMLSerializerRuntimeProviderId,
  XMLSerializerRuntimeProviderMetadata,
} from "../ports/types";
import type { XMLSerializerRuntimeStore } from "../store";
import { DefaultXMLSerializerAdapter } from "./default-xml-serializer-adapter";

export const MOCK_XML_SERIALIZER_ADAPTER_ID = "mock-deterministic-xml-serializer";
export const DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_VERSION = "1.0.0";

export type MockXMLSerializerAdapterOptions = {
  provider?: Extract<XMLSerializerRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: XMLSerializerRuntimeStore;
};

function mockMetadata(
  providerId: Extract<XMLSerializerRuntimeProviderId, "mock" | "test">,
): XMLSerializerRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test XML Serializer Runtime" : "Mock XML Serializer Runtime",
    version: DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process XML Serializer Runtime mock — no network, no TISS/ANS XML, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockXMLSerializerAdapter implements XMLSerializerRuntimePort {
  readonly providerId: Extract<XMLSerializerRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: XMLSerializerRuntimeProviderMetadata;
  private readonly delegate: DefaultXMLSerializerAdapter;

  constructor(options: MockXMLSerializerAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} XML Serializer Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultXMLSerializerAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
    });
  }

  getStore(): XMLSerializerRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): XMLSerializerRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_XML_SERIALIZER_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLSerializerProviderCapabilities(
        DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalXmlString: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealTissXml: false,
      implementsRealAnsXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsXsdValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): XMLSerializerRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_SERIALIZER_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLSerializerRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
    };
  }

  async serialize(input: SerializeCanonicalXMLInput): Promise<SerializeCanonicalXMLResult> {
    const result = await this.delegate.serialize(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(
    input: GetCanonicalXMLSerializeResultInput,
  ): Promise<GetCanonicalXMLSerializeResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listResults(
    input?: ListCanonicalXMLSerializeResultsInput,
  ): Promise<ListCanonicalXMLSerializeResultsResult> {
    const result = await this.delegate.listResults(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
