export type { DocumentSearchRuntimePort } from "./document-search-runtime-port";

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
} from "./types";

export {
  STRUCTURAL_SEARCH_PROVIDER_REFERENCES,
  resolveStructuralSearchProviderReference,
} from "./types";

export {
  createDocumentSearchRuntimeSessionId,
  resetAllDocumentSearchRuntimeIdSequences,
  resetDocumentSearchRuntimeSessionIdSequence,
} from "./identity";
