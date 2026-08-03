/**
 * MockXMLRuntimeAdapter — TISS-04.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XML real. Sem operadoras. Sem banco.
 */
import { createRulePackEnginePort } from "../../rule-pack-engine/providers/create-rule-pack-engine-port";
import { createTISSCatalogPort } from "../../tiss-catalog/providers/create-tiss-catalog-port";
import { createXMLGenerationRuntimePort } from "../../xml-generation-runtime/providers/create-xml-generation-runtime-port";
import {
  DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES,
  toCanonicalXMLProviderCapabilities,
} from "../ports/capabilities";
import type { XMLRuntimePort } from "../ports/xml-runtime-port";
import type {
  CancelXMLInput,
  CancelXMLResult,
  GenerateXMLInput,
  GenerateXMLResult,
  GetXMLGenerationInput,
  GetXMLGenerationResult,
  ListXMLGenerationsInput,
  ListXMLGenerationsResult,
  ValidateXMLInput,
  ValidateXMLResult,
  XMLRuntimeEnterpriseDeps,
  XMLRuntimeHealth,
  XMLRuntimeInfo,
  XMLRuntimePortCapabilities,
  XMLRuntimeProviderId,
  XMLRuntimeProviderMetadata,
} from "../ports/types";
import type { XMLRuntimeStore } from "../store";
import { DefaultXMLRuntimeAdapter } from "./default-xml-runtime-adapter";

export const MOCK_XML_RUNTIME_ADAPTER_ID = "mock-deterministic-xml-runtime";
export const DEFAULT_MOCK_XML_RUNTIME_VERSION = "1.0.0";

export type MockXMLRuntimeAdapterOptions = {
  provider?: Extract<XMLRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: XMLRuntimeStore;
  enterpriseDeps?: XMLRuntimeEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<XMLRuntimeProviderId, "mock" | "test">,
): XMLRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test XML Runtime" : "Mock XML Runtime",
    version: DEFAULT_MOCK_XML_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process XML Runtime mock — no network, no real XML, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockXMLRuntimeAdapter implements XMLRuntimePort {
  readonly providerId: Extract<XMLRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: XMLRuntimeProviderMetadata;
  private readonly delegate: DefaultXMLRuntimeAdapter;

  constructor(options: MockXMLRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} XML Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    const catalogPort = createTISSCatalogPort({ provider: "mock" });
    const generationRuntime = createXMLGenerationRuntimePort({ provider: "mock" });
    const enterpriseDeps =
      options.enterpriseDeps ??
      ({
        getTISSCatalogPort: () => catalogPort,
        getRulePackEnginePort: () =>
          createRulePackEnginePort({
            provider: "mock",
            enterpriseDeps: { getTISSCatalogPort: () => catalogPort },
          }),
        getXMLGenerationRuntimePort: () => generationRuntime,
      } satisfies XMLRuntimeEnterpriseDeps);

    this.delegate = new DefaultXMLRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps,
    });
  }

  getStore(): XMLRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): XMLRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_XML_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES },
      canonical: toCanonicalXMLProviderCapabilities(DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES),
      supportsCanonicalResult: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      consumesTISSCatalogPort: true,
      consumesRulePackEnginePort: true,
      consumesXMLGenerationRuntimePort: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
    };
  }

  providerInfo(): XMLRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<XMLRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
    };
  }

  async generate(input: GenerateXMLInput): Promise<GenerateXMLResult> {
    const result = await this.delegate.generate(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async validate(input: ValidateXMLInput): Promise<ValidateXMLResult> {
    const result = await this.delegate.validate(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async cancel(input: CancelXMLInput): Promise<CancelXMLResult> {
    const result = await this.delegate.cancel(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getGeneration(input: GetXMLGenerationInput): Promise<GetXMLGenerationResult> {
    const result = await this.delegate.getGeneration(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listGenerations(input?: ListXMLGenerationsInput): Promise<ListXMLGenerationsResult> {
    const result = await this.delegate.listGenerations(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
