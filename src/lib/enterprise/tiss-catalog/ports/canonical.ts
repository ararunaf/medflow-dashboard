/**
 * Modelos canônicos do Enterprise TISS Canonical Catalog — TISS-02.
 *
 * Única fonte oficial de conhecimento TISS da plataforma.
 * Sem lógica de operadora, XML, ANS, regras ou integração HTTP.
 * Variação futura exclusivamente via configuração / Rule Packs / Profiles.
 */

/** Status estrutural genérico — sem semântica de negócio. */
export type CanonicalTISSCatalogStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived"
  | "unknown"
  | (string & {});

/** Kind discriminador das entradas do catálogo. */
export type CanonicalTISSCatalogEntryKind =
  | "version"
  | "guide-type"
  | "procedure-type"
  | "procedure-group"
  | "domain"
  | "profile"
  | "vocabulary-entry"
  | "reference"
  | "metadata"
  | "catalog"
  | "statistics";

/** Base estrutural compartilhada. */
export type CanonicalTISSCatalogEntryBase = {
  id: string;
  code: string;
  name: string;
  description?: string;
  status?: CanonicalTISSCatalogStatus;
  version?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  createdAt?: string;
  updatedAt?: string;
};

/** Versão TISS canônica (exemplo mínimo — sem branching por versão). */
export type CanonicalTISSVersion = CanonicalTISSCatalogEntryBase & {
  kind: "canonical-tiss-version";
  entryKind: "version";
  /** Rótulo estrutural opaco (ex.: "4.01.00") — nunca usado em if/switch de comportamento. */
  versionLabel?: string;
  releasedAt?: string;
};

/** Tipo de guia canônico. */
export type CanonicalTISSGuideType = CanonicalTISSCatalogEntryBase & {
  kind: "canonical-tiss-guide-type";
  entryKind: "guide-type";
  category?: string;
  domainCode?: string;
};

/** Tipo de procedimento canônico. */
export type CanonicalTISSProcedureType = CanonicalTISSCatalogEntryBase & {
  kind: "canonical-tiss-procedure-type";
  entryKind: "procedure-type";
  groupCode?: string;
  category?: string;
};

/** Grupo de procedimento canônico. */
export type CanonicalTISSProcedureGroup = CanonicalTISSCatalogEntryBase & {
  kind: "canonical-tiss-procedure-group";
  entryKind: "procedure-group";
  category?: string;
};

/** Domínio canônico TISS. */
export type CanonicalTISSDomain = CanonicalTISSCatalogEntryBase & {
  kind: "canonical-tiss-domain";
  entryKind: "domain";
  category?: string;
};

/**
 * Perfil canônico TISS no catálogo (conhecimento estrutural).
 * Distinto de CanonicalTISSProfileReference (TISS-01 Provider).
 */
export type CanonicalTISSProfile = CanonicalTISSCatalogEntryBase & {
  kind: "canonical-tiss-catalog-profile";
  entryKind: "profile";
  domainCode?: string;
  guideTypeCode?: string;
  versionCode?: string;
};

/**
 * Metadados canônicos do catálogo.
 * Distinto de CanonicalTISSMetadata de operação (TISS-01 Provider).
 */
export type CanonicalTISSMetadata = {
  kind: "canonical-tiss-catalog-metadata";
  entryKind: "metadata";
  catalogId: string;
  namespace?: string;
  channel?: string;
  correlationId?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Entrada de vocabulário canônico (estrutura — sem catálogo TUSS completo). */
export type CanonicalTISSVocabularyEntry = CanonicalTISSCatalogEntryBase & {
  kind: "canonical-tiss-vocabulary-entry";
  entryKind: "vocabulary-entry";
  category?: string;
  domainCode?: string;
  conceptCode?: string;
};

/** Referência canônica opaca entre entradas do catálogo. */
export type CanonicalTISSReference = {
  kind: "canonical-tiss-reference";
  entryKind: "reference";
  id: string;
  referenceType?: string;
  sourceKind?: CanonicalTISSCatalogEntryKind;
  sourceCode?: string;
  targetKind?: CanonicalTISSCatalogEntryKind;
  targetCode?: string;
  description?: string;
};

/** Estatísticas estruturais do catálogo. */
export type CanonicalTISSCatalogStatistics = {
  kind: "canonical-tiss-catalog-statistics";
  entryKind: "statistics";
  catalogId: string;
  versionCount: number;
  guideTypeCount: number;
  procedureTypeCount: number;
  procedureGroupCount: number;
  domainCount: number;
  profileCount: number;
  vocabularyEntryCount: number;
  referenceCount: number;
  totalEntries: number;
};

/**
 * Agregado canônico do catálogo TISS.
 * Fonte oficial única de conhecimento TISS da plataforma.
 */
export type CanonicalTISSCatalog = {
  kind: "canonical-tiss-catalog";
  entryKind: "catalog";
  catalogId: string;
  name: string;
  description?: string;
  status?: CanonicalTISSCatalogStatus;
  versions: readonly CanonicalTISSVersion[];
  guideTypes: readonly CanonicalTISSGuideType[];
  procedureTypes: readonly CanonicalTISSProcedureType[];
  procedureGroups: readonly CanonicalTISSProcedureGroup[];
  domains: readonly CanonicalTISSDomain[];
  profiles: readonly CanonicalTISSProfile[];
  vocabulary: readonly CanonicalTISSVocabularyEntry[];
  references: readonly CanonicalTISSReference[];
  metadata?: CanonicalTISSMetadata;
  statistics: CanonicalTISSCatalogStatistics;
};
