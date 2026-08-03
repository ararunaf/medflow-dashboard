/**
 * Tipos vendor-agnósticos do Enterprise TISS Canonical Catalog — TISS-02.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime → TISS Catalog Runtime
 *     → TISSCatalogPort → Catalog Adapter → Catalog Store
 *
 * Sem XML. Sem operadoras. Sem regras. Sem acesso direto ao store.
 */
import type {
  CanonicalTISSCatalog,
  CanonicalTISSCatalogStatistics,
  CanonicalTISSDomain,
  CanonicalTISSGuideType,
  CanonicalTISSProcedureGroup,
  CanonicalTISSProcedureType,
  CanonicalTISSProfile,
  CanonicalTISSReference,
  CanonicalTISSVersion,
  CanonicalTISSVocabularyEntry,
} from "./canonical";
import type { TISSCatalogCapabilities } from "./capabilities";

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
} from "./canonical";
export type { TISSCatalogCapabilities };

/** Provedores / mecanismos do TISS Catalog. */
export type TISSCatalogProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type TISSCatalogStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type TISSCatalogTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type TISSCatalogStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: TISSCatalogProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type TISSCatalogHealth = {
  ok: boolean;
  provider: TISSCatalogProviderId;
  latencyMs?: number;
  message?: string;
  status?: TISSCatalogStatus;
  storedEntryCount?: number;
};

/** Capacidades do adapter no nível do Port. */
export type TISSCatalogPortCapabilities = {
  provider: TISSCatalogProviderId;
  adapterId: string;
  catalog: TISSCatalogCapabilities;
  supportsCanonicalCatalog: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  implementsRealXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
};

/** Metadados estáveis do provedor. */
export type TISSCatalogProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type TISSCatalogInfo = {
  providerId: TISSCatalogProviderId;
  metadata: TISSCatalogProviderMetadata;
  status: TISSCatalogStatus;
  providerType: "TISS_CATALOG";
  capabilities: TISSCatalogCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type TISSCatalogOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Entrada de leitura por código canônico. */
export type GetByCodeInput = TISSCatalogOperationalControls & {
  code: string;
};

/** Entrada de listagem estrutural. */
export type ListCatalogEntriesInput = TISSCatalogOperationalControls & {
  status?: string;
  tag?: string;
  codePrefix?: string;
  category?: string;
};

/** Envelope comum de resultado operacional. */
export type TISSCatalogOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: TISSCatalogProviderId;
  telemetry: TISSCatalogTelemetry;
  logs?: readonly TISSCatalogStructuredLog[];
  simulated?: boolean;
};

export type GetCatalogInput = TISSCatalogOperationalControls;
export type GetCatalogResult = TISSCatalogOperationEnvelope & {
  catalog?: CanonicalTISSCatalog;
};

export type GetVersionResult = TISSCatalogOperationEnvelope & {
  entry?: CanonicalTISSVersion;
};
export type ListVersionsResult = TISSCatalogOperationEnvelope & {
  entries: readonly CanonicalTISSVersion[];
};

export type GetGuideTypeResult = TISSCatalogOperationEnvelope & {
  entry?: CanonicalTISSGuideType;
};
export type ListGuideTypesResult = TISSCatalogOperationEnvelope & {
  entries: readonly CanonicalTISSGuideType[];
};

export type GetProcedureTypeResult = TISSCatalogOperationEnvelope & {
  entry?: CanonicalTISSProcedureType;
};
export type ListProcedureTypesResult = TISSCatalogOperationEnvelope & {
  entries: readonly CanonicalTISSProcedureType[];
};

export type GetProcedureGroupResult = TISSCatalogOperationEnvelope & {
  entry?: CanonicalTISSProcedureGroup;
};
export type ListProcedureGroupsResult = TISSCatalogOperationEnvelope & {
  entries: readonly CanonicalTISSProcedureGroup[];
};

export type GetDomainResult = TISSCatalogOperationEnvelope & {
  entry?: CanonicalTISSDomain;
};
export type ListDomainsResult = TISSCatalogOperationEnvelope & {
  entries: readonly CanonicalTISSDomain[];
};

export type GetProfileResult = TISSCatalogOperationEnvelope & {
  entry?: CanonicalTISSProfile;
};
export type ListProfilesResult = TISSCatalogOperationEnvelope & {
  entries: readonly CanonicalTISSProfile[];
};

export type GetVocabularyEntryResult = TISSCatalogOperationEnvelope & {
  entry?: CanonicalTISSVocabularyEntry;
};
export type ListVocabularyResult = TISSCatalogOperationEnvelope & {
  entries: readonly CanonicalTISSVocabularyEntry[];
};

export type GetStatisticsInput = TISSCatalogOperationalControls;
export type GetStatisticsResult = TISSCatalogOperationEnvelope & {
  statistics?: CanonicalTISSCatalogStatistics;
};

export type ResolveReferenceInput = TISSCatalogOperationalControls & {
  referenceId?: string;
  sourceCode?: string;
  targetCode?: string;
};
export type ResolveReferenceResult = TISSCatalogOperationEnvelope & {
  references: readonly CanonicalTISSReference[];
};

/** Opções de resolução do TISSCatalogPort. */
export type TISSCatalogOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-02).
   */
  provider?: TISSCatalogProviderId;
};

/** Entrada de registro no TISSCatalogRegistry. */
export type TISSCatalogRegistration = {
  providerId: TISSCatalogProviderId;
  name: string;
  version: string;
  status: TISSCatalogStatus;
  adapterId: string;
  vendor: string;
  capabilities: TISSCatalogCapabilities;
  description?: string;
};
