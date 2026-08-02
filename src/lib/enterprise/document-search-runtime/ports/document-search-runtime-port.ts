/**
 * DocumentSearchRuntimePort — contrato único do Document Search Runtime (DIP-06 / SEARCH-01).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime dependem
 * exclusivamente desta interface para pesquisa documental.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → Storage Manager Runtime → DocumentSearchRuntimePort
 *     → Canonical Execution Orchestrator
 *     → SearchProviderPort → DefaultSearchProviderAdapter
 *     → StorageProviderPort → Backend oficial
 *
 * Busca real exclusivamente via SearchProviderPort.
 * NÃO integra Elastic / OpenSearch / Azure Search / Supabase / S3 / FS diretamente.
 */
import type {
  CoordinateSearchInput,
  CoordinateSearchResult,
  DocumentSearchRuntimeCapabilities,
  DocumentSearchRuntimeHealth,
  DocumentSearchRuntimeProviderId,
  GetDocumentSearchRuntimeSessionInput,
  GetDocumentSearchRuntimeSessionResult,
  ListDocumentSearchRuntimeSessionsInput,
  ListDocumentSearchRuntimeSessionsResult,
  ListSearchProviderReferencesResult,
  RuntimeSearchInput,
  RuntimeSearchResult,
} from "./types";

export interface DocumentSearchRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentSearchRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<DocumentSearchRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentSearchRuntimeCapabilities;

  /**
   * Coordena uma sessão de search via Orchestrator + Storage Manager Runtime + SearchProviderPort.
   * Coordenação de cadeia (Capture path) — execução de busca via search().
   */
  coordinateSearch(input: CoordinateSearchInput): Promise<CoordinateSearchResult>;

  /**
   * Executa busca documental via SearchProviderPort.search() (SEARCH-01).
   * Único caminho autorizado para busca real.
   */
  search(input: RuntimeSearchInput): Promise<RuntimeSearchResult>;

  /** Obtém sessão de search por id. */
  getSession(
    input: GetDocumentSearchRuntimeSessionInput,
  ): Promise<GetDocumentSearchRuntimeSessionResult>;

  /** Lista sessões de search (filtros estruturais opcionais). */
  listSessions(
    input?: ListDocumentSearchRuntimeSessionsInput,
  ): Promise<ListDocumentSearchRuntimeSessionsResult>;

  /** Lista referências estruturais a Search Providers (catálogo + Port ativo). */
  listProviderReferences(): Promise<ListSearchProviderReferencesResult>;
}
