/**
 * Modelos canônicos do Search Provider — SEARCH-01.
 *
 * Únicos modelos canônicos de pesquisa documental:
 *   CanonicalSearchRequest
 *   CanonicalSearchResult
 *   CanonicalSearchDocument
 *   CanonicalSearchMetadata
 *
 * Sem modelos paralelos. Runtime e Provider compartilham estes tipos.
 */

/** Modo de busca canônico suportado pelo Search Provider. */
export type CanonicalSearchMode =
  | "by-id"
  | "by-document"
  | "by-patient"
  | "by-metadata"
  | "by-tenant"
  | "by-competencia";

/** Metadados canônicos de uma consulta / documento pesquisável. */
export type CanonicalSearchMetadata = {
  kind: "canonical-search-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  patientId?: string;
  competencia?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Documento canônico retornado por busca via SearchProviderPort. */
export type CanonicalSearchDocument = {
  kind: "canonical-search-document";
  documentId: string;
  patientId?: string;
  tenantRef?: string;
  competencia?: string;
  storageKey?: string;
  storageContainer?: string;
  documentKind?: string;
  title?: string;
  score?: number;
  metadata?: CanonicalSearchMetadata;
};

/** Pedido canônico de busca documental. */
export type CanonicalSearchRequest = {
  kind: "canonical-search-request";
  mode: CanonicalSearchMode;
  metadata: CanonicalSearchMetadata;
  documentId?: string;
  patientId?: string;
  tenantRef?: string;
  competencia?: string;
  /** Filtros livres de metadata (modo by-metadata). */
  metadataFilters?: Readonly<Record<string, string | number | boolean | null>>;
  query?: string;
  storageKey?: string;
  storageContainer?: string;
  documentKind?: string;
  limit?: number;
};

/** Resultado canônico de busca documental. */
export type CanonicalSearchResult = {
  kind: "canonical-search-result";
  ok: boolean;
  request?: CanonicalSearchRequest;
  documents: readonly CanonicalSearchDocument[];
  totalCount: number;
  metadata?: CanonicalSearchMetadata;
  requestId?: string;
  message?: string;
  code?: string;
  realSearchExecuted: boolean;
};
