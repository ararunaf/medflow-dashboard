/**
 * DocumentSearchRuntimePort — contrato único do Document Search Runtime (DIP-06).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime / OCR Runtime /
 * Document Classification Runtime / Storage Manager Runtime dependem
 * exclusivamente desta interface para coordenação estrutural de pesquisa documental.
 *
 * Fluxo obrigatório (sem implementação paralela / sem busca real):
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → Storage Manager Runtime → DocumentSearchRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Search Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * NÃO busca documentos. NÃO indexa.
 * NÃO integra Elasticsearch / OpenSearch / PostgreSQL FTS / Vector DB / Azure AI Search.
 * NÃO implementa embeddings, RAG ou IA.
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
} from "./types";

export interface DocumentSearchRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentSearchRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<DocumentSearchRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo (search tecnológico = FALSE). */
  capabilities(): DocumentSearchRuntimeCapabilities;

  /**
   * Coordena estruturalmente uma sessão de search via Orchestrator + Storage Manager Runtime.
   * NÃO busca documentos. NÃO invoca Search Provider real. NÃO indexa.
   */
  coordinateSearch(input: CoordinateSearchInput): Promise<CoordinateSearchResult>;

  /** Obtém sessão de search por id. */
  getSession(
    input: GetDocumentSearchRuntimeSessionInput,
  ): Promise<GetDocumentSearchRuntimeSessionResult>;

  /** Lista sessões de search (filtros estruturais opcionais). */
  listSessions(
    input?: ListDocumentSearchRuntimeSessionsInput,
  ): Promise<ListDocumentSearchRuntimeSessionsResult>;

  /** Lista referências estruturais a Search Providers futuros (sem conexão). */
  listProviderReferences(): Promise<ListSearchProviderReferencesResult>;
}
