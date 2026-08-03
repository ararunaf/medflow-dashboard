/**
 * MockTISSCatalogAdapter — TISS-02.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XML. Sem operadoras. Sem banco.
 */
import { DEFAULT_MOCK_TISS_CATALOG_CAPABILITIES } from "../ports/capabilities";
import type { TISSCatalogPort } from "../ports/tiss-catalog-port";
import type {
  GetByCodeInput,
  GetCatalogInput,
  GetCatalogResult,
  GetDomainResult,
  GetGuideTypeResult,
  GetProcedureGroupResult,
  GetProcedureTypeResult,
  GetProfileResult,
  GetStatisticsInput,
  GetStatisticsResult,
  GetVersionResult,
  GetVocabularyEntryResult,
  ListCatalogEntriesInput,
  ListDomainsResult,
  ListGuideTypesResult,
  ListProcedureGroupsResult,
  ListProcedureTypesResult,
  ListProfilesResult,
  ListVersionsResult,
  ListVocabularyResult,
  ResolveReferenceInput,
  ResolveReferenceResult,
  TISSCatalogHealth,
  TISSCatalogInfo,
  TISSCatalogPortCapabilities,
  TISSCatalogProviderId,
  TISSCatalogProviderMetadata,
} from "../ports/types";
import type { TISSCatalogStore } from "../store";
import { DefaultTISSCatalogAdapter } from "./default-tiss-catalog-adapter";

export const MOCK_TISS_CATALOG_ADAPTER_ID = "mock-deterministic-tiss-catalog";
export const DEFAULT_MOCK_TISS_CATALOG_VERSION = "1.0.0";

export type MockTISSCatalogAdapterOptions = {
  provider?: Extract<TISSCatalogProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: TISSCatalogStore;
};

function mockMetadata(
  providerId: Extract<TISSCatalogProviderId, "mock" | "test">,
): TISSCatalogProviderMetadata {
  return {
    name: providerId === "test" ? "Test TISS Catalog" : "Mock TISS Catalog",
    version: DEFAULT_MOCK_TISS_CATALOG_VERSION,
    vendor: "medicflow-enterprise",
    description: "Deterministic in-process TISS catalog mock — no network, no XML, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockTISSCatalogAdapter implements TISSCatalogPort {
  readonly providerId: Extract<TISSCatalogProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: TISSCatalogProviderMetadata;
  private readonly delegate: DefaultTISSCatalogAdapter;

  constructor(options: MockTISSCatalogAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} TISS catalog ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);
    this.delegate = new DefaultTISSCatalogAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
    });
  }

  getStore(): TISSCatalogStore {
    return this.delegate.getStore();
  }

  capabilities(): TISSCatalogPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_TISS_CATALOG_ADAPTER_ID,
      catalog: { ...DEFAULT_MOCK_TISS_CATALOG_CAPABILITIES },
      supportsCanonicalCatalog: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
    };
  }

  providerInfo(): TISSCatalogInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TISS_CATALOG",
      capabilities: { ...DEFAULT_MOCK_TISS_CATALOG_CAPABILITIES },
    };
  }

  async health(): Promise<TISSCatalogHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
    };
  }

  async getCatalog(input?: GetCatalogInput): Promise<GetCatalogResult> {
    const result = await this.delegate.getCatalog(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getVersion(input: GetByCodeInput): Promise<GetVersionResult> {
    const result = await this.delegate.getVersion(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listVersions(input?: ListCatalogEntriesInput): Promise<ListVersionsResult> {
    const result = await this.delegate.listVersions(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getGuideType(input: GetByCodeInput): Promise<GetGuideTypeResult> {
    const result = await this.delegate.getGuideType(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listGuideTypes(input?: ListCatalogEntriesInput): Promise<ListGuideTypesResult> {
    const result = await this.delegate.listGuideTypes(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getProcedureType(input: GetByCodeInput): Promise<GetProcedureTypeResult> {
    const result = await this.delegate.getProcedureType(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listProcedureTypes(input?: ListCatalogEntriesInput): Promise<ListProcedureTypesResult> {
    const result = await this.delegate.listProcedureTypes(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getProcedureGroup(input: GetByCodeInput): Promise<GetProcedureGroupResult> {
    const result = await this.delegate.getProcedureGroup(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listProcedureGroups(input?: ListCatalogEntriesInput): Promise<ListProcedureGroupsResult> {
    const result = await this.delegate.listProcedureGroups(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getDomain(input: GetByCodeInput): Promise<GetDomainResult> {
    const result = await this.delegate.getDomain(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listDomains(input?: ListCatalogEntriesInput): Promise<ListDomainsResult> {
    const result = await this.delegate.listDomains(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getProfile(input: GetByCodeInput): Promise<GetProfileResult> {
    const result = await this.delegate.getProfile(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listProfiles(input?: ListCatalogEntriesInput): Promise<ListProfilesResult> {
    const result = await this.delegate.listProfiles(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getVocabularyEntry(input: GetByCodeInput): Promise<GetVocabularyEntryResult> {
    const result = await this.delegate.getVocabularyEntry(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listVocabulary(input?: ListCatalogEntriesInput): Promise<ListVocabularyResult> {
    const result = await this.delegate.listVocabulary(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getStatistics(input?: GetStatisticsInput): Promise<GetStatisticsResult> {
    const result = await this.delegate.getStatistics(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async resolveReference(input: ResolveReferenceInput): Promise<ResolveReferenceResult> {
    const result = await this.delegate.resolveReference(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
