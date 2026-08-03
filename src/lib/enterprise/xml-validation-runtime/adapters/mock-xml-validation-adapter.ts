/**
 * MockXMLValidationAdapter — TISS-08.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XSD oficial. Sem validação real. Sem XML TISS/ANS. Sem operadoras. Sem banco.
 */
import {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES,
  toCanonicalXMLValidationCapabilities,
} from "../ports/capabilities";
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type {
  GetCanonicalXMLValidationResultInput,
  GetCanonicalXMLValidationResultResult,
  ListCanonicalXMLValidationResultsInput,
  ListCanonicalXMLValidationResultsResult,
  ValidateCanonicalXMLInput,
  ValidateCanonicalXMLResult,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimePortCapabilities,
  XMLValidationRuntimeProviderId,
  XMLValidationRuntimeProviderMetadata,
} from "../ports/types";
import type { XMLValidationRuntimeStore } from "../store";
import { DefaultXMLValidationAdapter } from "./default-xml-validation-adapter";

export const MOCK_XML_VALIDATION_ADAPTER_ID = "mock-deterministic-xml-validation";
export const DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION = "1.0.0";

export type MockXMLValidationAdapterOptions = {
  provider?: Extract<XMLValidationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: XMLValidationRuntimeStore;
};

function mockMetadata(
  providerId: Extract<XMLValidationRuntimeProviderId, "mock" | "test">,
): XMLValidationRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test XML Validation Runtime" : "Mock XML Validation Runtime",
    version: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process XML Validation Runtime mock — no network, no official XSD, no real validation, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockXMLValidationAdapter implements XMLValidationRuntimePort {
  readonly providerId: Extract<XMLValidationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: XMLValidationRuntimeProviderMetadata;
  private readonly delegate: DefaultXMLValidationAdapter;

  constructor(options: MockXMLValidationAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} XML Validation Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultXMLValidationAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
    });
  }

  getStore(): XMLValidationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): XMLValidationRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_XML_VALIDATION_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLValidationCapabilities(
        DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES,
      ),
      supportsCanonicalValidation: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      validationEngineReady: true,
      implementsOfficialXsd: false,
      implementsXsdValidation: false,
      implementsRealXmlValidation: false,
      implementsOfficialTissValidation: false,
      implementsOfficialAnsValidation: false,
      implementsOperatorDispatch: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): XMLValidationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_VALIDATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLValidationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      validationEngineReady: true,
    };
  }

  async validate(input: ValidateCanonicalXMLInput): Promise<ValidateCanonicalXMLResult> {
    const result = await this.delegate.validate(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(
    input: GetCanonicalXMLValidationResultInput,
  ): Promise<GetCanonicalXMLValidationResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listResults(
    input?: ListCanonicalXMLValidationResultsInput,
  ): Promise<ListCanonicalXMLValidationResultsResult> {
    const result = await this.delegate.listResults(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
