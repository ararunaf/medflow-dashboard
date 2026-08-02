/**
 * DocumentClassificationRuntimePort — contrato único do Classification Runtime (DIP-04 / CLASS-01).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime / OCR Runtime dependem
 * exclusivamente desta interface para coordenação e classificação documental.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → DocumentClassificationProviderPort
 *     → DefaultDocumentClassificationAdapter → Classification Provider
 *
 * NÃO usa IA/LLM/ML/embeddings.
 * Classificação real exclusivamente via DocumentClassificationProviderPort.
 */
import type {
  ClassifyDocumentInput,
  ClassifyDocumentResult,
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

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentClassificationRuntimeCapabilities;

  /**
   * Coordena estruturalmente uma sessão de classificação via Orchestrator + Provider health.
   * NÃO executa classify() — execução real via classify().
   */
  coordinateClassification(
    input: CoordinateClassificationInput,
  ): Promise<CoordinateClassificationResult>;

  /**
   * Executa classificação real via DocumentClassificationProviderPort.classify().
   * Consome exclusivamente resultado OCR (texto/estrutura).
   */
  classify(input: ClassifyDocumentInput): Promise<ClassifyDocumentResult>;

  /** Obtém sessão de classificação por id. */
  getSession(
    input: GetDocumentClassificationRuntimeSessionInput,
  ): Promise<GetDocumentClassificationRuntimeSessionResult>;

  /** Lista sessões de classificação (filtros estruturais opcionais). */
  listSessions(
    input?: ListDocumentClassificationRuntimeSessionsInput,
  ): Promise<ListDocumentClassificationRuntimeSessionsResult>;

  /** Lista referências a Classification Providers (sem conexão externa). */
  listProviderReferences(): Promise<ListDocumentClassificationProviderReferencesResult>;
}
