/**
 * MockSearchProviderAdapter — SEARCH-01.
 *
 * Implementação totalmente determinística in-memory.
 * Sem HTTP. Sem Elastic/OpenSearch/Azure Search. Sem Supabase/S3/FS.
 */
import { createStorageProviderPort } from "../../storage-provider/providers/create-storage-provider-port";
import { DEFAULT_MOCK_SEARCH_PROVIDER_CAPABILITIES } from "../ports/capabilities";
import type { SearchProviderPort } from "../ports/search-provider-port";
import type { CanonicalSearchDocument } from "../ports/canonical";
import type {
  SearchProcessInput,
  SearchProviderConfigurationValidation,
  SearchProviderHealth,
  SearchProviderId,
  SearchProviderInfo,
  SearchProviderMetadata,
  SearchProviderOperationResult,
  SearchProviderPortCapabilities,
} from "../ports/types";
import { DefaultSearchProviderAdapter } from "./default-search-provider-adapter";

export const MOCK_SEARCH_PROVIDER_ADAPTER_ID = "mock-deterministic-search";
export const DEFAULT_MOCK_SEARCH_PROVIDER_VERSION = "1.0.0";

export type MockSearchProviderAdapterOptions = {
  provider?: Extract<SearchProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  seedDocuments?: readonly CanonicalSearchDocument[];
};

function mockMetadata(
  providerId: Extract<SearchProviderId, "mock" | "test">,
): SearchProviderMetadata {
  return {
    name: providerId === "test" ? "Test Search Provider" : "Mock Search Provider",
    version: DEFAULT_MOCK_SEARCH_PROVIDER_VERSION,
    vendor: "medicflow-enterprise",
    description: "Deterministic in-process search mock — no network, no external search engine.",
  };
}

/**
 * Mock adapter — delega busca ao Default com Storage mock in-memory.
 */
export class MockSearchProviderAdapter implements SearchProviderPort {
  readonly providerId: Extract<SearchProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: SearchProviderMetadata;
  private readonly delegate: DefaultSearchProviderAdapter;

  constructor(options: MockSearchProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} search provider ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);
    this.delegate = new DefaultSearchProviderAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      storageProviderPort: createStorageProviderPort({ provider: "mock" }),
      seedDocuments: options.seedDocuments,
    });
  }

  capabilities(): SearchProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_SEARCH_PROVIDER_ADAPTER_ID,
      search: { ...DEFAULT_MOCK_SEARCH_PROVIDER_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsStorageProviderBackend: true,
      supportsSearchById: true,
      supportsSearchByDocument: true,
      supportsSearchByPatient: true,
      supportsSearchByMetadata: true,
      supportsSearchByTenant: true,
      supportsSearchByCompetencia: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsExternalSearchEngine: false,
      implementsElasticsearch: false,
      implementsOpenSearch: false,
      implementsAzureSearch: false,
    };
  }

  providerInfo(): SearchProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_SEARCH",
      capabilities: { ...DEFAULT_MOCK_SEARCH_PROVIDER_CAPABILITIES },
    };
  }

  async health(): Promise<SearchProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy ? "ready" : "unhealthy",
      storageProviderOk: true,
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<SearchProviderConfigurationValidation> {
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: "Mock search provider não requer configuração externa.",
    };
  }

  async indexDocument(document: CanonicalSearchDocument) {
    return this.delegate.indexDocument(document);
  }

  async search(input: SearchProcessInput): Promise<SearchProviderOperationResult> {
    const result = await this.delegate.search(input);
    return {
      ...result,
      provider: this.providerId,
      simulated: true,
    };
  }
}
