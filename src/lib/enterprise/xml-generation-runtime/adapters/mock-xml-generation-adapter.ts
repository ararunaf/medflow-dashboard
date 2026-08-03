/**
 * MockXMLGenerationAdapter — TISS-05.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XML real. Sem operadoras. Sem banco.
 */
import {
  DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES,
  toCanonicalXMLGenerationProviderCapabilities,
} from "../ports/capabilities";
import type { XMLGenerationRuntimePort } from "../ports/xml-generation-runtime-port";
import type {
  GenerateCanonicalXMLInput,
  GenerateCanonicalXMLResult,
  GetCanonicalXMLResultInput,
  GetCanonicalXMLResultResult,
  ListCanonicalXMLResultsInput,
  ListCanonicalXMLResultsResult,
  XMLGenerationRuntimeHealth,
  XMLGenerationRuntimeInfo,
  XMLGenerationRuntimePortCapabilities,
  XMLGenerationRuntimeProviderId,
  XMLGenerationRuntimeProviderMetadata,
} from "../ports/types";
import type { XMLGenerationRuntimeStore } from "../store";
import { DefaultXMLGenerationAdapter } from "./default-xml-generation-adapter";

export const MOCK_XML_GENERATION_ADAPTER_ID = "mock-deterministic-xml-generation";
export const DEFAULT_MOCK_XML_GENERATION_RUNTIME_VERSION = "1.0.0";

export type MockXMLGenerationAdapterOptions = {
  provider?: Extract<XMLGenerationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: XMLGenerationRuntimeStore;
};

function mockMetadata(
  providerId: Extract<XMLGenerationRuntimeProviderId, "mock" | "test">,
): XMLGenerationRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test XML Generation Runtime" : "Mock XML Generation Runtime",
    version: DEFAULT_MOCK_XML_GENERATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process XML Generation Runtime mock — no network, no real XML, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockXMLGenerationAdapter implements XMLGenerationRuntimePort {
  readonly providerId: Extract<XMLGenerationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: XMLGenerationRuntimeProviderMetadata;
  private readonly delegate: DefaultXMLGenerationAdapter;

  constructor(options: MockXMLGenerationAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} XML Generation Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultXMLGenerationAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
    });
  }

  getStore(): XMLGenerationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): XMLGenerationRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_XML_GENERATION_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLGenerationProviderCapabilities(
        DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalStructure: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
    };
  }

  providerInfo(): XMLGenerationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_GENERATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLGenerationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
    };
  }

  async generate(input: GenerateCanonicalXMLInput): Promise<GenerateCanonicalXMLResult> {
    const result = await this.delegate.generate(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetCanonicalXMLResultInput): Promise<GetCanonicalXMLResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listResults(input?: ListCanonicalXMLResultsInput): Promise<ListCanonicalXMLResultsResult> {
    const result = await this.delegate.listResults(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
