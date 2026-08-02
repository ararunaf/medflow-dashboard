/**
 * Modelos canônicos do Document Search Runtime — DIP-06.
 *
 * Representação estrutural da sessão de pesquisa documental na
 * Document Intelligence Platform.
 * Sem busca real. Sem indexação. Sem Elasticsearch/OpenSearch/PostgreSQL FTS.
 * Sem vetores. Sem embeddings. Sem RAG. Sem IA. Sem Providers reais.
 */

/** Status estrutural da sessão de search no Runtime. */
export type DocumentSearchRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "coordinated"
  | "deferred"
  | "failed";

/** Identidade canônica do documento na pesquisa (referências opacas). */
export type CanonicalSearchIdentity = {
  kind: "canonical-search-identity";
  documentId: string;
  documentKind?: string;
  version?: string;
};

/** Metadados canônicos estruturais da sessão de search. */
export type CanonicalSearchMetadata = {
  kind: "canonical-search-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Referência canônica opaca a artefatos Enterprise / produto / hops anteriores. */
export type CanonicalSearchReference = {
  kind: "canonical-search-reference";
  storageKey?: string;
  storageContainer?: string;
  storageProvider?: string;
  metadataId?: string;
  metadataNamespace?: string;
  intakeId?: string;
  executionId?: string;
  captureRuntimeSessionId?: string;
  captureExecutionId?: string;
  /** DIP-03 — referência estrutural à sessão OCR Runtime (sem OCR real). */
  ocrRuntimeSessionId?: string;
  ocrExecutionId?: string;
  /** DIP-04 — referência estrutural à sessão Classification Runtime (sem classificação real). */
  classificationRuntimeSessionId?: string;
  classificationExecutionId?: string;
  /** DIP-05 — referência estrutural à sessão Storage Manager Runtime (sem armazenamento real). */
  storageManagerRuntimeSessionId?: string;
  storageExecutionId?: string;
  /** Referência estrutural ao Search Provider futuro (nunca executado). */
  providerReferenceId?: CanonicalSearchProviderReferenceId;
};

/**
 * Capacidades canônicas tecnológicas do Document Search Runtime (modelo de domínio).
 * Todas FALSE / informativas — nenhuma capacidade é executada (DIP-06).
 */
export type CanonicalSearchCapabilities = {
  kind: "canonical-search-capabilities";
  supportsKeywordSearch: false;
  supportsMetadataSearch: false;
  supportsFullTextSearch: false;
  supportsSemanticSearch: false;
  supportsVectorSearch: false;
  supportsBatchSearch: false;
  supportsRanking: false;
  supportsFacetedSearch: false;
  declared?: readonly string[];
};

/** Configuração canônica estrutural do search (sem busca). */
export type CanonicalSearchConfiguration = {
  kind: "canonical-search-configuration";
  /** Provider futuro referenciado estruturalmente — sem bind / sem HTTP / sem query. */
  preferredProviderReference?: CanonicalSearchProviderReferenceId;
  queryHint?: string;
  channel?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | (string & {});
  notes?: string;
};

/**
 * Referências estruturais a Search Providers futuros.
 * NÃO são implementações. NÃO conectam serviços externos. NÃO executam busca.
 */
export type CanonicalSearchProviderReferenceId =
  | "elasticsearch"
  | "opensearch"
  | "postgresql-fts"
  | "vector-database"
  | "azure-ai-search"
  | "mock-search";

/** Descritor estrutural de um Search Provider futuro. */
export type CanonicalSearchProviderReference = {
  kind: "canonical-search-provider-reference";
  providerReferenceId: CanonicalSearchProviderReferenceId;
  displayName: string;
  vendor: string;
  status: "structural-reference-only";
  implementsRealSearch: false;
  implementsIndexing: false;
  implementsKeywordSearch: false;
  implementsFullTextSearch: false;
  implementsVectorSearch: false;
  implementsSemanticSearch: false;
  connected: false;
};

/** Pedido canônico de coordenação de search via Runtime. */
export type CanonicalSearchRequest = {
  kind: "canonical-search-request";
  identity: CanonicalSearchIdentity;
  metadata: CanonicalSearchMetadata;
  reference?: CanonicalSearchReference;
  capabilities?: CanonicalSearchCapabilities;
  configuration?: CanonicalSearchConfiguration;
  structuralNotes?: string;
};

/** Sessão canônica de Document Search Runtime. */
export type CanonicalSearchSession = {
  kind: "canonical-search-session";
  runtimeSessionId: string;
  status: DocumentSearchRuntimeSessionStatus;
  request: CanonicalSearchRequest;
  executionId?: string;
  providerReferenceId?: CanonicalSearchProviderReferenceId;
  searchProviderAdapterId?: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
  errors?: readonly string[];
  /** Sempre false nesta sprint — coordenação sem busca. */
  realSearchExecuted?: false;
  /** Sempre false nesta sprint — sem indexação. */
  realIndexingExecuted?: false;
};

/** Resultado canônico da coordenação via Document Search Runtime. */
export type CanonicalSearchResult = {
  kind: "canonical-search-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalSearchSession;
  executionId?: string;
  providerReferenceId?: CanonicalSearchProviderReferenceId;
  message?: string;
  code?: string;
  /** Sempre false nesta sprint. */
  realSearchExecuted?: false;
  /** Sempre false nesta sprint. */
  realIndexingExecuted?: false;
};
