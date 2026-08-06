/**
 * MockXMLValidationRuntimeAdapter — C-02 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem validação XML. Sem XSD. Sem parser. Sem correção automática. Sem SOAP.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  toXMLValidationCapabilities,
} from "../ports/capabilities";
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type {
  CorrectXMLInput,
  CorrectXMLResult,
  GenerateXMLValidationReportInput,
  GenerateXMLValidationReportResult,
  GetXMLValidationResultInput,
  ValidateGenericXMLInput,
  ValidateGenericXMLResult,
  GetXMLValidationResultResult,
  ListXMLValidationResultsInput,
  ListXMLValidationResultsResult,
  RepairXMLInput,
  RepairXMLResult,
  ValidateBusinessInput,
  ValidateBusinessResult,
  ValidateNamespaceInput,
  ValidateNamespaceResult,
  ValidateOperatorInput,
  ValidateOperatorResult,
  ValidateVersionInput,
  ValidateVersionResult,
  ValidateXMLInput,
  ValidateXMLResult,
  ValidateXSDInput,
  ValidateXSDResult,
  XMLValidationRuntimeCapabilities,
  XMLValidationRuntimeEnterpriseDeps,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimeProviderId,
  XMLValidationRuntimeProviderMetadata,
  XMLValidationStatsInput,
  XMLValidationStatsResult,
} from "../ports/types";
import type { XMLValidationRuntimeStore } from "../store";
import { InMemoryXMLValidationRuntimeStore } from "../store";
import { DefaultXMLValidationRuntimeAdapter } from "./default-xml-validation-runtime-adapter";

export const MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID = "mock-deterministic-xml-validation-runtime";
/** Alias TISS-08. */
export const MOCK_XML_VALIDATION_ADAPTER_ID = MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID;
export const DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION = "1.0.0";

export type MockXMLValidationRuntimeAdapterOptions = {
  provider?: Extract<XMLValidationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: XMLValidationRuntimeStore;
  enterpriseDeps?: XMLValidationRuntimeEnterpriseDeps;
  now?: () => string;
};

/** Alias TISS-08. */
export type MockXMLValidationAdapterOptions = MockXMLValidationRuntimeAdapterOptions;

function mockMetadata(
  providerId: Extract<XMLValidationRuntimeProviderId, "mock" | "test">,
): XMLValidationRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test XML Validation Runtime" : "Mock XML Validation Runtime",
    version: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process XML Validation Runtime mock — no network, no real XML validation.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockXMLValidationRuntimeAdapter implements XMLValidationRuntimePort {
  readonly providerId: Extract<XMLValidationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: XMLValidationRuntimeProviderMetadata;
  private readonly delegate: DefaultXMLValidationRuntimeAdapter;

  constructor(options: MockXMLValidationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} XML Validation Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultXMLValidationRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryXMLValidationRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): XMLValidationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): XMLValidationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsValidate: true,
      supportsGetResult: true,
      supportsListResults: true,
      supportsStats: true,
      supportsCanonicalValidation: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesXMLTISSRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesAIOrchestrationRuntimePort: true,
      validationEngineReady: true,
      runtimeReady: true,
      /** D-11 — Generic XML Validation funcional. */
      xmlValidationImplemented: true,
      xsdValidationImplemented: true,
      namespaceValidationImplemented: true,
      schemaSelectionImplemented: false,
      versionValidationImplemented: true,
      businessValidationImplemented: true,
      operatorValidationImplemented: true,
      xmlRepairImplemented: true,
      automaticCorrectionImplemented: true,
      validationReportImplemented: true,
      implementsOfficialXsd: false,
      implementsXsdValidation: true,
      implementsRealXmlValidation: false,
      implementsOfficialTissValidation: false,
      implementsOfficialAnsValidation: false,
      implementsOperatorDispatch: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
      engine: { ...DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toXMLValidationCapabilities(
        DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): XMLValidationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_VALIDATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<XMLValidationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      validationEngineReady: true,
      runtimeReady: true,
    };
  }

  async validate(input: ValidateXMLInput): Promise<ValidateXMLResult> {
    const result = await this.delegate.validate(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async validateXsd(input: ValidateXSDInput): Promise<ValidateXSDResult> {
    const result = await this.delegate.validateXsd(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async validateNamespace(input: ValidateNamespaceInput): Promise<ValidateNamespaceResult> {
    const result = await this.delegate.validateNamespace(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async validateVersion(input: ValidateVersionInput): Promise<ValidateVersionResult> {
    const result = await this.delegate.validateVersion(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async validateBusiness(input: ValidateBusinessInput): Promise<ValidateBusinessResult> {
    const result = await this.delegate.validateBusiness(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async validateOperator(input: ValidateOperatorInput): Promise<ValidateOperatorResult> {
    const result = await this.delegate.validateOperator(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async repairXML(input: RepairXMLInput): Promise<RepairXMLResult> {
    const result = await this.delegate.repairXML(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async correctXML(input: CorrectXMLInput): Promise<CorrectXMLResult> {
    const result = await this.delegate.correctXML(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async generateXMLValidationReport(
    input: GenerateXMLValidationReportInput,
  ): Promise<GenerateXMLValidationReportResult> {
    const result = await this.delegate.generateXMLValidationReport(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async validateGenericXML(input: ValidateGenericXMLInput): Promise<ValidateGenericXMLResult> {
    const result = await this.delegate.validateGenericXML(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetXMLValidationResultInput): Promise<GetXMLValidationResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listResults(
    input?: ListXMLValidationResultsInput,
  ): Promise<ListXMLValidationResultsResult> {
    const result = await this.delegate.listResults(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: XMLValidationStatsInput): Promise<XMLValidationStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}

/** Alias TISS-08. */
export const MockXMLValidationAdapter = MockXMLValidationRuntimeAdapter;
