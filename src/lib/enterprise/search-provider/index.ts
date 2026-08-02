/**
 * Enterprise Search Provider — Ports & Adapters (SEARCH-01).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Runtime
 *     → Document Search Runtime → SearchProviderPort
 *     → DefaultSearchProviderAdapter → StorageProviderPort → Backend oficial
 *
 * SEARCH-01: Search Provider oficial storage-backed.
 * Sem Elastic. Sem OpenSearch. Sem Azure Search.
 * Sem acesso direto a Supabase / S3 / filesystem / banco.
 */
export type {
  CanonicalSearchDocument,
  CanonicalSearchMetadata,
  CanonicalSearchMode,
  CanonicalSearchRequest,
  CanonicalSearchResult,
  SearchProcessInput,
  SearchProviderCapabilities,
  SearchProviderConfigurationValidation,
  SearchProviderHealth,
  SearchProviderId,
  SearchProviderInfo,
  SearchProviderMetadata,
  SearchProviderOperationResult,
  SearchProviderOptions,
  SearchProviderPort,
  SearchProviderPortCapabilities,
  SearchProviderRegistration,
  SearchProviderStatus,
  SearchProviderStructuredLog,
  SearchProviderTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_SEARCH_PROVIDER_CAPABILITIES,
  DEFAULT_SEARCH_PROVIDER_CAPABILITIES,
  createSearchProviderRequestId,
  defineSearchProviderCapabilities,
  emptySearchProviderCapabilities,
} from "./ports";

export {
  DEFAULT_SEARCH_PROVIDER_ADAPTER_ID,
  DEFAULT_SEARCH_PROVIDER_VERSION,
  DEFAULT_MOCK_SEARCH_PROVIDER_VERSION,
  DefaultSearchProviderAdapter,
  MOCK_SEARCH_PROVIDER_ADAPTER_ID,
  MockSearchProviderAdapter,
  StorageBackedSearchProviderAdapter,
  createInMemorySearchCatalog,
  type DefaultSearchProviderAdapterOptions,
  type InMemorySearchCatalog,
  type MockSearchProviderAdapterOptions,
} from "./adapters";

export {
  SearchProviderFactory,
  createSearchProviderFactory,
  type SearchProviderFactoryOptions,
} from "./factory";

export {
  BUILTIN_SEARCH_PROVIDER_COUNT,
  SearchProviderRegistry,
  createDefaultSearchProviderRegistry,
  type SearchProviderRegistrySnapshot,
} from "./registry";

export { createSearchProviderPort, getSearchProviderFactory } from "./providers";

export { getSearchProviderHealthSummary, type SearchProviderHealthSummary } from "./demo";
