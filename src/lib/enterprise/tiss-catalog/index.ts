/**
 * Enterprise TISS Canonical Catalog — Ports & Adapters (TISS-02).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime → TISS Catalog Runtime
 *     → TISSCatalogPort → DefaultTISSCatalogAdapter → InMemoryTISSCatalog
 *
 * TISS-02: única fonte oficial de conhecimento TISS da plataforma.
 * Sem XML real. Sem envio a operadoras. Sem validações clínicas/ANS.
 * Sem regras de negócio. Sem acesso direto ao Catalog Store.
 * Sem lógica específica de operadora / contrato / tenant / cliente / versão.
 */
export type {
  CanonicalTISSCatalog,
  CanonicalTISSCatalogEntryBase,
  CanonicalTISSCatalogEntryKind,
  CanonicalTISSCatalogStatistics,
  CanonicalTISSCatalogStatus,
  CanonicalTISSDomain,
  CanonicalTISSGuideType,
  CanonicalTISSMetadata,
  CanonicalTISSProcedureGroup,
  CanonicalTISSProcedureType,
  CanonicalTISSProfile,
  CanonicalTISSReference,
  CanonicalTISSVersion,
  CanonicalTISSVocabularyEntry,
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
  TISSCatalogCapabilities,
  TISSCatalogHealth,
  TISSCatalogInfo,
  TISSCatalogOperationEnvelope,
  TISSCatalogOperationalControls,
  TISSCatalogOptions,
  TISSCatalogPort,
  TISSCatalogPortCapabilities,
  TISSCatalogProviderId,
  TISSCatalogProviderMetadata,
  TISSCatalogRegistration,
  TISSCatalogStatus,
  TISSCatalogStructuredLog,
  TISSCatalogTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_TISS_CATALOG_CAPABILITIES,
  DEFAULT_TISS_CATALOG_CAPABILITIES,
  createTISSCatalogEntryId,
  createTISSCatalogRequestId,
  defineTISSCatalogCapabilities,
  emptyTISSCatalogCapabilities,
  resetTISSCatalogEntryIdSequence,
} from "./ports";

export {
  DEFAULT_TISS_CATALOG_ADAPTER_ID,
  DEFAULT_TISS_CATALOG_VERSION,
  DEFAULT_MOCK_TISS_CATALOG_VERSION,
  DefaultTISSCatalogAdapter,
  EnterpriseTISSCatalogAdapter,
  MOCK_TISS_CATALOG_ADAPTER_ID,
  MockTISSCatalogAdapter,
  type DefaultTISSCatalogAdapterOptions,
  type MockTISSCatalogAdapterOptions,
} from "./adapters";

export {
  TISSCatalogFactory,
  createTISSCatalogFactory,
  type TISSCatalogFactoryOptions,
} from "./factory";

export {
  BUILTIN_TISS_CATALOG_PROVIDER_COUNT,
  TISSCatalogRegistry,
  createDefaultTISSCatalogRegistry,
  type TISSCatalogRegistrySnapshot,
} from "./registry";

export {
  DEFAULT_TISS_CATALOG_ID,
  IN_MEMORY_TISS_CATALOG_STORE_ID,
  InMemoryTISSCatalog,
  MINIMAL_TISS_CATALOG_DOMAINS,
  MINIMAL_TISS_CATALOG_GUIDE_TYPES,
  MINIMAL_TISS_CATALOG_METADATA,
  MINIMAL_TISS_CATALOG_PROCEDURE_GROUPS,
  MINIMAL_TISS_CATALOG_PROCEDURE_TYPES,
  MINIMAL_TISS_CATALOG_PROFILES,
  MINIMAL_TISS_CATALOG_REFERENCES,
  MINIMAL_TISS_CATALOG_VERSIONS,
  MINIMAL_TISS_CATALOG_VOCABULARY,
  type InMemoryTISSCatalogOptions,
  type TISSCatalogStore,
} from "./store";

export { TISSCatalogProvider, createTISSCatalogPort, getTISSCatalogFactory } from "./providers";

export { getTISSCatalogHealthSummary, type TISSCatalogHealthSummary } from "./demo";
