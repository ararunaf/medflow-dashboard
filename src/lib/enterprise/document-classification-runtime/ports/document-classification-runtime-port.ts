/**
 * DocumentClassificationRuntimePort — contrato único do Enterprise Document Classification
 * Runtime (F3-CAP-06 + DIP-04 / CLASS-01 preservado).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime / OCR Runtime dependem
 * exclusivamente desta interface para orquestração estrutural de classificação e
 * para coordenação/execução real via DocumentClassificationProviderPort.
 *
 * Fluxo estrutural (F3-CAP-06):
 *   Produto → Enterprise Runtime → DocumentClassificationRuntimePort
 *     → Adapter → Document Classification Runtime Store → DocumentClassificationResult
 *
 * Fluxo DIP-04 / CLASS-01 preservado:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → DocumentClassificationProviderPort
 *     → DefaultDocumentClassificationAdapter → Classification Provider
 *
 * F3-CAP-06: infraestrutura canônica estrutural apenas. Sem IA. Sem ML. Sem LLM.
 * Sem OCR real. Sem template matching. Sem roteamento automático. Sem visão
 * computacional neste módulo. NÃO conhece TISS.
 */
import type {
  ClassificationStatsInput,
  ClassificationStatsResult,
  ClassifyDocumentInput,
  ClassifyDocumentResult,
  CloseClassificationJobInput,
  CloseClassificationJobResult,
  CoordinateClassificationInput,
  CoordinateClassificationResult,
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeHealth,
  DocumentClassificationRuntimeInfo,
  DocumentClassificationRuntimeProviderId,
  GetClassificationResultInput,
  GetClassificationResultResult,
  GetDocumentClassificationRuntimeSessionInput,
  GetDocumentClassificationRuntimeSessionResult,
  ListDocumentClassificationProviderReferencesResult,
  ListDocumentClassificationRuntimeSessionsInput,
  ListDocumentClassificationRuntimeSessionsResult,
  OpenClassificationJobInput,
  OpenClassificationJobResult,
  RegisterClassificationDocumentInput,
  RegisterClassificationDocumentResult,
  SubmitClassificationRequestInput,
  SubmitClassificationRequestResult,
} from "./types";

export interface DocumentClassificationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentClassificationRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-06 — operações estruturais canônicas (nunca executam classificação real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de classificação. NÃO inicia classificação real. */
  openJob(input: OpenClassificationJobInput): Promise<OpenClassificationJobResult>;

  /** Fecha job estrutural de classificação. NÃO interrompe classificação real. */
  closeJob(input: CloseClassificationJobInput): Promise<CloseClassificationJobResult>;

  /** Cria request estrutural de classificação dentro de um job. NÃO dispara classificador real. */
  submitRequest(
    input: SubmitClassificationRequestInput,
  ): Promise<SubmitClassificationRequestResult>;

  /** Registra referência estrutural de documento. NÃO lê conteúdo real. */
  registerDocument(
    input: RegisterClassificationDocumentInput,
  ): Promise<RegisterClassificationDocumentResult>;

  /** Obtém resultado estrutural por job/request/documento. NÃO classifica de fato. */
  getResult(input: GetClassificationResultInput): Promise<GetClassificationResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-06). */
  stats(input?: ClassificationStatsInput): Promise<ClassificationStatsResult>;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<DocumentClassificationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentClassificationRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-06). */
  providerInfo(): DocumentClassificationRuntimeInfo;

  // -------------------------------------------------------------------------
  // DIP-04 / CLASS-01 — coordenação e execução real preservadas (Capture Engine
  // Runtime / OCR Runtime dependem destes métodos).
  // -------------------------------------------------------------------------

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
