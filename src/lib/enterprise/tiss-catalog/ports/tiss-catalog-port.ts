/**
 * TISSCatalogPort — contrato único do Enterprise TISS Canonical Catalog (TISS-02).
 *
 * Application / TISS Runtime / TISS Catalog Runtime dependem exclusivamente desta interface.
 * Nenhum acesso direto ao Catalog Store é permitido.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime → TISS Catalog Runtime
 *     → TISSCatalogPort → Catalog Adapter → Catalog Store
 *
 * TISS-02: catálogo canônico apenas — sem XML / operadoras / regras / ANS.
 */
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
} from "./types";

export interface TISSCatalogPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: TISSCatalogProviderId;

  /** Obtém o agregado canônico do catálogo. */
  getCatalog(input?: GetCatalogInput): Promise<GetCatalogResult>;

  getVersion(input: GetByCodeInput): Promise<GetVersionResult>;
  listVersions(input?: ListCatalogEntriesInput): Promise<ListVersionsResult>;

  getGuideType(input: GetByCodeInput): Promise<GetGuideTypeResult>;
  listGuideTypes(input?: ListCatalogEntriesInput): Promise<ListGuideTypesResult>;

  getProcedureType(input: GetByCodeInput): Promise<GetProcedureTypeResult>;
  listProcedureTypes(input?: ListCatalogEntriesInput): Promise<ListProcedureTypesResult>;

  getProcedureGroup(input: GetByCodeInput): Promise<GetProcedureGroupResult>;
  listProcedureGroups(input?: ListCatalogEntriesInput): Promise<ListProcedureGroupsResult>;

  getDomain(input: GetByCodeInput): Promise<GetDomainResult>;
  listDomains(input?: ListCatalogEntriesInput): Promise<ListDomainsResult>;

  getProfile(input: GetByCodeInput): Promise<GetProfileResult>;
  listProfiles(input?: ListCatalogEntriesInput): Promise<ListProfilesResult>;

  getVocabularyEntry(input: GetByCodeInput): Promise<GetVocabularyEntryResult>;
  listVocabulary(input?: ListCatalogEntriesInput): Promise<ListVocabularyResult>;

  getStatistics(input?: GetStatisticsInput): Promise<GetStatisticsResult>;

  resolveReference(input: ResolveReferenceInput): Promise<ResolveReferenceResult>;

  health(): Promise<TISSCatalogHealth>;
  capabilities(): TISSCatalogPortCapabilities;
  providerInfo(): TISSCatalogInfo;
}
