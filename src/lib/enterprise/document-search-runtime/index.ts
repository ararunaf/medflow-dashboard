/**
 * Enterprise Document Search Runtime — Document Intelligence Platform (DIP-06).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → Storage Manager Runtime → DocumentSearchRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Search Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * DIP-06: infraestrutura oficial de coordenação de pesquisa documental —
 * sem busca real, sem indexação, sem vetores, sem embeddings, sem RAG, sem IA,
 * sem Providers externos, sem consultas reais.
 */
export type {
  CanonicalSearchCapabilities,
  CanonicalSearchConfiguration,
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
