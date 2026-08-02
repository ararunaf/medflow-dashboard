/**
 * Tipos vendor-agnósticos do Document Search Runtime — DIP-06.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → Storage Manager Runtime → DocumentSearchRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Search Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * Este componente NÃO busca documentos. NÃO indexa.
 * NÃO integra Elasticsearch/OpenSearch/PostgreSQL FTS/Vector DB/Azure AI Search.
 * Coordena estruturalmente via Ports oficiais.
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { StorageManagerRuntimePort } from "../../storage-manager-runtime/ports/storage-manager-runtime-port";
import type {
  CanonicalSearchProviderReference,
  CanonicalSearchProviderReferenceId,
  CanonicalSearchRequest,
  CanonicalSearchResult,
  CanonicalSearchSession,
  DocumentSearchRuntimeSessionStatus,
} from "./models";

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
  DocumentSearchRuntimeSessionStatus,
} from "./models";

/** Provedores / mecanismos do Document Search Runtime (adapters do Port). */
export type DocumentSearchRuntimeProviderId = "default" | "mock" | "test";

/** Resultado de health check. */
export type DocumentSearchRuntimeHealth = {
  ok: boolean;
  provider: DocumentSearchRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  enterpriseOrchestratorOk?: boolean;
  storageManagerRuntimeOk?: boolean;
  realSearchAvailable: false;
  realIndexingAvailable: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Capacidades tecnológicas de search permanecem FALSE — nenhuma é executada.
 */
export type DocumentSearchRuntimeCapabilities = {
  provider: DocumentSearchRuntimeProviderId;
  adapterId: string;
  supportsCoordinateSearch: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesStorageManagerRuntime: boolean;
  usesDocumentClassificationRuntime: boolean;
  usesOCRRuntime: boolean;
  usesCaptureEngineRuntime: boolean;
  /** Capacidades tecnológicas — informativas / FALSE (DIP-06). */
  supportsKeywordSearch: false;
  supportsMetadataSearch: false;
  supportsFullTextSearch: false;
  supportsSemanticSearch: false;
  supportsVectorSearch: false;
  supportsBatchSearch: false;
  supportsRanking: false;
  supportsFacetedSearch: false;
  implementsRealSearch: false;
  implementsIndexing: false;
  implementsVectorSearch: false;
  implementsEmbeddings: false;
  implementsRAG: false;
  implementsAI: false;
  implementsExternalProviderCall: false;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type DocumentSearchRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  /**
   * Storage Manager Runtime (DIP-05) — hop anterior na cadeia estrutural.
   * NUNCA invocar storage real; apenas health / sessão estrutural.
   */
  getStorageManagerRuntimePort(): StorageManagerRuntimePort;
};

export type GetDocumentSearchRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetDocumentSearchRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalSearchSession;
  message?: string;
  code?: string;
};

export type ListDocumentSearchRuntimeSessionsInput = {
  status?: DocumentSearchRuntimeSessionStatus;
  documentId?: string;
  sessionId?: string;
  idPrefix?: string;
  captureRuntimeSessionId?: string;
  ocrRuntimeSessionId?: string;
  classificationRuntimeSessionId?: string;
  storageManagerRuntimeSessionId?: string;
};

export type ListDocumentSearchRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalSearchSession[];
  message?: string;
  code?: string;
};

export type ListSearchProviderReferencesResult = {
  ok: boolean;
  references: readonly CanonicalSearchProviderReference[];
};

/** Alias tipado da operação principal (coordenação estrutural — sem busca real). */
export type CoordinateSearchInput = CanonicalSearchRequest;
export type CoordinateSearchResult = CanonicalSearchResult;

/** Opções de resolução do DocumentSearchRuntimePort. */
export type DocumentSearchRuntimeProviderOptions = {
  provider?: DocumentSearchRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: DocumentSearchRuntimeEnterpriseDeps;
};

/** Catálogo estrutural de Search Providers futuros (sem conexão). */
export const STRUCTURAL_SEARCH_PROVIDER_REFERENCES: readonly CanonicalSearchProviderReference[] = [
  {
    kind: "canonical-search-provider-reference",
    providerReferenceId: "elasticsearch",
    displayName: "Elasticsearch",
    vendor: "Elastic",
    status: "structural-reference-only",
    implementsRealSearch: false,
    implementsIndexing: false,
    implementsKeywordSearch: false,
    implementsFullTextSearch: false,
    implementsVectorSearch: false,
    implementsSemanticSearch: false,
    connected: false,
  },
  {
    kind: "canonical-search-provider-reference",
    providerReferenceId: "opensearch",
    displayName: "OpenSearch",
    vendor: "OpenSearch Project",
    status: "structural-reference-only",
    implementsRealSearch: false,
    implementsIndexing: false,
    implementsKeywordSearch: false,
    implementsFullTextSearch: false,
    implementsVectorSearch: false,
    implementsSemanticSearch: false,
    connected: false,
  },
  {
    kind: "canonical-search-provider-reference",
    providerReferenceId: "postgresql-fts",
    displayName: "PostgreSQL Full Text Search",
    vendor: "PostgreSQL",
    status: "structural-reference-only",
    implementsRealSearch: false,
    implementsIndexing: false,
    implementsKeywordSearch: false,
    implementsFullTextSearch: false,
    implementsVectorSearch: false,
    implementsSemanticSearch: false,
    connected: false,
  },
  {
    kind: "canonical-search-provider-reference",
    providerReferenceId: "vector-database",
    displayName: "Vector Database",
    vendor: "Vector Database",
    status: "structural-reference-only",
    implementsRealSearch: false,
    implementsIndexing: false,
    implementsKeywordSearch: false,
    implementsFullTextSearch: false,
    implementsVectorSearch: false,
    implementsSemanticSearch: false,
    connected: false,
  },
  {
    kind: "canonical-search-provider-reference",
    providerReferenceId: "azure-ai-search",
    displayName: "Azure AI Search",
    vendor: "Microsoft Azure",
    status: "structural-reference-only",
    implementsRealSearch: false,
    implementsIndexing: false,
    implementsKeywordSearch: false,
    implementsFullTextSearch: false,
    implementsVectorSearch: false,
    implementsSemanticSearch: false,
    connected: false,
  },
  {
    kind: "canonical-search-provider-reference",
    providerReferenceId: "mock-search",
    displayName: "Mock Search",
    vendor: "MedicFlow Enterprise",
    status: "structural-reference-only",
    implementsRealSearch: false,
    implementsIndexing: false,
    implementsKeywordSearch: false,
    implementsFullTextSearch: false,
    implementsVectorSearch: false,
    implementsSemanticSearch: false,
    connected: false,
  },
] as const;

export function resolveStructuralSearchProviderReference(
  id?: CanonicalSearchProviderReferenceId,
): CanonicalSearchProviderReference {
  const found = STRUCTURAL_SEARCH_PROVIDER_REFERENCES.find((ref) => ref.providerReferenceId === id);
  return (
    found ??
    STRUCTURAL_SEARCH_PROVIDER_REFERENCES.find((ref) => ref.providerReferenceId === "mock-search")!
  );
}
