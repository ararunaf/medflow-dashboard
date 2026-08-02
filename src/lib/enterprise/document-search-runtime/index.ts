/**
 * Enterprise Document Search Runtime — Document Intelligence Platform (DIP-06).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → Storage Manager Runtime → DocumentSearchRuntimePort
 *     → Canonical Execution Orchestrator
 *     → SearchProviderPort → DefaultSearchProviderAdapter (SEARCH-01)
 *     → StorageProviderPort → Backend oficial
 *
 * DIP-06 / SEARCH-01: infraestrutura oficial de pesquisa documental —
 * busca exclusivamente via SearchProviderPort; sem motores externos diretos.
 */
export type {
  CanonicalSearchCapabilities,
  CanonicalSearchConfiguration,
  CanonicalSearchDocument,
  CanonicalSearchIdentity,
  CanonicalSearchMetadata,
  CanonicalSearchProviderReference,
  CanonicalSearchProviderReferenceId,
  CanonicalSearchReference,
  CanonicalSearchRequest,
  CanonicalSearchResult,
  CanonicalSearchSession,
  CoordinateSearchInput,
  CoordinateSearchResult,
  DocumentSearchRuntimeCapabilities,
  DocumentSearchRuntimeEnterpriseDeps,
  DocumentSearchRuntimeHealth,
  DocumentSearchRuntimePort,
  DocumentSearchRuntimeProviderId,
  DocumentSearchRuntimeProviderOptions,
  DocumentSearchRuntimeSessionStatus,
  GetDocumentSearchRuntimeSessionInput,
  GetDocumentSearchRuntimeSessionResult,
  ListDocumentSearchRuntimeSessionsInput,
  ListDocumentSearchRuntimeSessionsResult,
  ListSearchProviderReferencesResult,
  RuntimeSearchInput,
  RuntimeSearchResult,
} from "./ports";

export {
  STRUCTURAL_SEARCH_PROVIDER_REFERENCES,
  createDocumentSearchRuntimeSessionId,
  resetAllDocumentSearchRuntimeIdSequences,
  resetDocumentSearchRuntimeSessionIdSequence,
  resolveStructuralSearchProviderReference,
} from "./ports";

export {
  DEFAULT_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID,
  DefaultDocumentSearchRuntimeAdapter,
  MOCK_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID,
  MockDocumentSearchRuntimeAdapter,
  STRUCTURAL_SEARCH_PROVIDER_ADAPTER_ID,
  type DefaultDocumentSearchRuntimeAdapterOptions,
  type MockDocumentSearchRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_DOCUMENT_SEARCH_RUNTIME_STORE_ID,
  InMemoryDocumentSearchRuntimeStore,
  type InMemoryDocumentSearchRuntimeStoreOptions,
  type DocumentSearchRuntimeStore,
  type StoredDocumentSearchRuntimeSession,
} from "./store";

export {
  DocumentSearchRuntimeFactory,
  createDocumentSearchRuntimeFactory,
  type DocumentSearchRuntimeFactoryOptions,
} from "./factory";

export { createDocumentSearchRuntimePort } from "./providers";

export {
  getDocumentSearchRuntimeHealthSummary,
  type DocumentSearchRuntimeHealthSummary,
} from "./demo";
