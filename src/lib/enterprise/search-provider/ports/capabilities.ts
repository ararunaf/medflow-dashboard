/**
 * SearchProviderCapabilities — capacidades declarativas (SEARCH-01).
 *
 * Apenas declaração estrutural. Sem Elastic/OpenSearch/Azure Search diretos.
 * Backend de documentos exclusivamente via StorageProviderPort.
 */

export type SearchProviderCapabilities = {
  supportedModes?: readonly string[];
  supportsSearchById?: boolean;
  supportsSearchByDocument?: boolean;
  supportsSearchByPatient?: boolean;
  supportsSearchByMetadata?: boolean;
  supportsSearchByTenant?: boolean;
  supportsSearchByCompetencia?: boolean;
  supportsCanonicalResult?: boolean;
  supportsStorageProviderBackend?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  implementsExternalSearchEngine?: false;
  implementsElasticsearch?: false;
  implementsOpenSearch?: false;
  implementsAzureSearch?: false;
};

export function emptySearchProviderCapabilities(): SearchProviderCapabilities {
  return {};
}

export function defineSearchProviderCapabilities(
  capabilities: SearchProviderCapabilities = {},
): SearchProviderCapabilities {
  return { ...capabilities };
}

export const DEFAULT_SEARCH_PROVIDER_CAPABILITIES: SearchProviderCapabilities = {
  supportedModes: [
    "by-id",
    "by-document",
    "by-patient",
    "by-metadata",
    "by-tenant",
    "by-competencia",
  ],
  supportsSearchById: true,
  supportsSearchByDocument: true,
  supportsSearchByPatient: true,
  supportsSearchByMetadata: true,
  supportsSearchByTenant: true,
  supportsSearchByCompetencia: true,
  supportsCanonicalResult: true,
  supportsStorageProviderBackend: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  implementsExternalSearchEngine: false,
  implementsElasticsearch: false,
  implementsOpenSearch: false,
  implementsAzureSearch: false,
};

export const DEFAULT_MOCK_SEARCH_PROVIDER_CAPABILITIES: SearchProviderCapabilities = {
  ...DEFAULT_SEARCH_PROVIDER_CAPABILITIES,
};
