/**
 * MockXMLSchemaAdapter — TISS-07.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XSD oficial. Sem validação. Sem XML TISS/ANS. Sem operadoras. Sem banco.
 */
import {
  DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES,
  toCanonicalXMLSchemaCapabilities,
} from "../ports/capabilities";
import type { XMLSchemaRuntimePort } from "../ports/xml-schema-runtime-port";
import type {
  GetCanonicalXMLSchemaResultInput,
  GetCanonicalXMLSchemaResultResult,
  ListCanonicalXMLSchemaResultsInput,
  ListCanonicalXMLSchemaResultsResult,
  RegisterCanonicalXMLSchemaInput,
  RegisterCanonicalXMLSchemaResult,
  SelectCanonicalXMLSchemaInput,
  SelectCanonicalXMLSchemaResult,
  XMLSchemaRuntimeHealth,
  XMLSchemaRuntimeInfo,
  XMLSchemaRuntimePortCapabilities,
  XMLSchemaRuntimeProviderId,
  XMLSchemaRuntimeProviderMetadata,
} from "../ports/types";
import type { XMLSchemaRuntimeStore } from "../store";
import { DefaultXMLSchemaAdapter } from "./default-xml-schema-adapter";

export const MOCK_XML_SCHEMA_ADAPTER_ID = "mock-deterministic-xml-schema";
export const DEFAULT_MOCK_XML_SCHEMA_RUNTIME_VERSION = "1.0.0";

export type MockXMLSchemaAdapterOptions = {
  provider?: Extract<XMLSchemaRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: XMLSchemaRuntimeStore;
};

function mockMetadata(
  providerId: Extract<XMLSchemaRuntimeProviderId, "mock" | "test">,
): XMLSchemaRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test XML Schema Runtime" : "Mock XML Schema Runtime",
    version: DEFAULT_MOCK_XML_SCHEMA_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process XML Schema Runtime mock — no network, no official XSD, no validation, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockXMLSchemaAdapter implements XMLSchemaRuntimePort {
  readonly providerId: Extract<XMLSchemaRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: XMLSchemaRuntimeProviderMetadata;
  private readonly delegate: DefaultXMLSchemaAdapter;

  constructor(options: MockXMLSchemaAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} XML Schema Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultXMLSchemaAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
    });
  }

  getStore(): XMLSchemaRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): XMLSchemaRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_XML_SCHEMA_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLSchemaCapabilities(DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES),
      supportsCanonicalSchema: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      schemaSelectionImplemented: true,
      implementsOfficialXsd: false,
      implementsXsdValidation: false,
      implementsRealTissXml: false,
      implementsRealAnsXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): XMLSchemaRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_SCHEMA_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLSchemaRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
    };
  }

  async register(
    input: RegisterCanonicalXMLSchemaInput,
  ): Promise<RegisterCanonicalXMLSchemaResult> {
    const result = await this.delegate.register(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(
    input: GetCanonicalXMLSchemaResultInput,
  ): Promise<GetCanonicalXMLSchemaResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listResults(
    input?: ListCanonicalXMLSchemaResultsInput,
  ): Promise<ListCanonicalXMLSchemaResultsResult> {
    const result = await this.delegate.listResults(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async select(input: SelectCanonicalXMLSchemaInput): Promise<SelectCanonicalXMLSchemaResult> {
    const result = await this.delegate.select(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
