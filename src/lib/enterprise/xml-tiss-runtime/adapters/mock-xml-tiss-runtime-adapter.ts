/**
 * MockXMLTISSRuntimeAdapter — C-01 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem geração de XML. Sem serialização. Sem parser. Sem XSD. Sem SOAP.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
  toXMLCapabilities,
} from "../ports/capabilities";
import type { XMLTISSRuntimePort } from "../ports/xml-tiss-runtime-port";
import type {
  XMLTISSRuntimeCapabilities,
  XMLTISSRuntimeEnterpriseDeps,
  XMLTISSRuntimeHealth,
  XMLTISSRuntimeInfo,
  XMLTISSRuntimeProviderId,
  XMLTISSRuntimeProviderMetadata,
  XMLStatsInput,
  XMLStatsResult,
  GetXMLResultInput,
  GetXMLResultResult,
  PrepareXMLDocumentInput,
  PrepareXMLDocumentResult,
} from "../ports/types";
import type { XMLTISSRuntimeStore } from "../store";
import { InMemoryXMLTISSRuntimeStore } from "../store";
import { DefaultXMLTISSRuntimeAdapter } from "./default-xml-tiss-runtime-adapter";

export const MOCK_XML_TISS_RUNTIME_ADAPTER_ID = "mock-deterministic-xml-tiss-runtime";
export const DEFAULT_MOCK_XML_TISS_RUNTIME_VERSION = "1.0.0";

export type MockXMLTISSRuntimeAdapterOptions = {
  provider?: Extract<XMLTISSRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: XMLTISSRuntimeStore;
  enterpriseDeps?: XMLTISSRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<XMLTISSRuntimeProviderId, "mock" | "test">,
): XMLTISSRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test XML TISS Runtime" : "Mock XML TISS Runtime",
    version: DEFAULT_MOCK_XML_TISS_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process XML TISS Runtime mock — no network, no functional XML generation.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockXMLTISSRuntimeAdapter implements XMLTISSRuntimePort {
  readonly providerId: Extract<XMLTISSRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: XMLTISSRuntimeProviderMetadata;
  private readonly delegate: DefaultXMLTISSRuntimeAdapter;

  constructor(options: MockXMLTISSRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} XML TISS Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultXMLTISSRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryXMLTISSRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): XMLTISSRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): XMLTISSRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_XML_TISS_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareXMLDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalXMLTISS: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesAIOrchestrationRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      runtimeReady: true,
      xmlGenerationImplemented: false,
      xmlSerializationImplemented: false,
      xmlParsingImplemented: false,
      xmlValidationImplemented: false,
      xmlSigningImplemented: false,
      xmlCompressionImplemented: false,
      batchXmlGenerationImplemented: false,
      soapIntegrationImplemented: false,
      operatorIntegrationImplemented: false,
      schemaValidationImplemented: false,
      engine: { ...DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toXMLCapabilities(DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): XMLTISSRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_TISS_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<XMLTISSRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareXMLDocument(input: PrepareXMLDocumentInput): Promise<PrepareXMLDocumentResult> {
    const result = await this.delegate.prepareXMLDocument(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetXMLResultInput): Promise<GetXMLResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: XMLStatsInput): Promise<XMLStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
