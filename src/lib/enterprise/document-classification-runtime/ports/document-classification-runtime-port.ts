/**
 * DocumentClassificationRuntimePort — contrato único do Classification Runtime (DIP-04).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime / OCR Runtime dependem
 * exclusivamente desta interface para coordenação estrutural de classificação.
 *
 * Fluxo obrigatório (sem implementação paralela / sem classificação real):
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Classification Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * NÃO executa classificação. NÃO usa IA/LLM/ML/embeddings.
 * NÃO usa OCR para classificação. NÃO aplica regras ou heurísticas.
 * NÃO identifica automaticamente tipos documentais.
 */
import type {
  CoordinateClassificationInput,
  CoordinateClassificationResult,
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeHealth,
  DocumentClassificationRuntimeProviderId,
  GetDocumentClassificationRuntimeSessionInput,
  GetDocumentClassificationRuntimeSessionResult,
  ListDocumentClassificationProviderReferencesResult,
  ListDocumentClassificationRuntimeSessionsInput,
  ListDocumentClassificationRuntimeSessionsResult,
} from "./types";

export interface DocumentClassificationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentClassificationRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<DocumentClassificationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo (classificação tecnológica = FALSE). */
  capabilities(): DocumentClassificationRuntimeCapabilities;

  /**
   * Coordena estruturalmente uma sessão de classificação via Orchestrator + OCR Runtime.
   * NÃO executa classificação. NÃO invoca Classification Provider real.
   */
  coordinateClassification(
    input: CoordinateClassificationInput,
  ): Promise<CoordinateClassificationResult>;

  /** Obtém sessão de classificação por id. */
  getSession(
    input: GetDocumentClassificationRuntimeSessionInput,
  ): Promise<GetDocumentClassificationRuntimeSessionResult>;

  /** Lista sessões de classificação (filtros estruturais opcionais). */
  listSessions(
    input?: ListDocumentClassificationRuntimeSessionsInput,
  ): Promise<ListDocumentClassificationRuntimeSessionsResult>;

  /** Lista referências estruturais a Classification Providers futuros (sem conexão). */
  listProviderReferences(): Promise<ListDocumentClassificationProviderReferencesResult>;
}
