/**
 * OCRRuntimePort — contrato único do Enterprise OCR Runtime (F3-CAP-05 + DIP-03 / OCR-01 preservado).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime dependem
 * exclusivamente desta interface para orquestração estrutural OCR e para
 * coordenação/execução real via OCRProviderPort.
 *
 * Fluxo estrutural (F3-CAP-05):
 *   Produto → Enterprise Runtime → OCRRuntimePort
 *     → Adapter → OCR Runtime Store → OCRResult
 *
 * Fluxo DIP-03 / OCR-01 preservado:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCRRuntimePort → Canonical Execution Orchestrator
 *     → OCRProviderPort → AzureDocumentIntelligenceAdapter → Azure
 *
 * F3-CAP-05: infraestrutura canônica estrutural apenas. Sem OCR real neste
 * módulo. NÃO contém HTTP Azure. NÃO interpreta documentos. NÃO conhece TISS.
 */
import type {
  CloseOCRJobInput,
  CloseOCRJobResult,
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRResultInput,
  GetOCRResultResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRRuntimeCapabilities,
  OCRRuntimeHealth,
  OCRRuntimeInfo,
  OCRRuntimeProviderId,
  OCRStatsInput,
  OCRStatsResult,
  OpenOCRJobInput,
  OpenOCRJobResult,
  ProcessOCRInput,
  ProcessOCRResult,
  RegisterOCRDocumentInput,
  RegisterOCRDocumentResult,
  SubmitOCRRequestInput,
  SubmitOCRRequestResult,
} from "./types";

export interface OCRRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: OCRRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-05 — operações estruturais canônicas (nunca executam OCR real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de OCR. NÃO inicia OCR real. NÃO lê arquivos. */
  openJob(input: OpenOCRJobInput): Promise<OpenOCRJobResult>;

  /** Fecha job estrutural de OCR. NÃO interrompe OCR real (não há OCR real). */
  closeJob(input: CloseOCRJobInput): Promise<CloseOCRJobResult>;

  /** Cria request estrutural de OCR dentro de um job. NÃO dispara engine real. */
  submitRequest(input: SubmitOCRRequestInput): Promise<SubmitOCRRequestResult>;

  /** Registra referência estrutural de documento. NÃO lê bytes/páginas reais. */
  registerDocument(input: RegisterOCRDocumentInput): Promise<RegisterOCRDocumentResult>;

  /** Obtém resultado estrutural por job/request/documento. NÃO extrai texto real. */
  getResult(input: GetOCRResultInput): Promise<GetOCRResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-05). */
  stats(input?: OCRStatsInput): Promise<OCRStatsResult>;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<OCRRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): OCRRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-05). */
  providerInfo(): OCRRuntimeInfo;

  // -------------------------------------------------------------------------
  // DIP-03 / OCR-01 — coordenação e execução real preservadas (Capture Engine
  // Runtime e OCR Provider Adapter dependem destes métodos).
  // -------------------------------------------------------------------------

  /**
   * Coordena estruturalmente uma sessão OCR via Orchestrator + OCR Provider Adapter.
   * Sem bytes: coordenação (health/capabilities). Não dispara Azure sem process().
   */
  coordinateOcr(input: CoordinateOCRInput): Promise<CoordinateOCRResult>;

  /**
   * Executa OCR real exclusivamente via OCRProviderPort.process().
   * Retorna Canonical OCR Result com ProcessingOutput EPC-13 quando ok.
   */
  process(input: ProcessOCRInput): Promise<ProcessOCRResult>;

  /** Obtém sessão OCR por id. */
  getSession(input: GetOCRRuntimeSessionInput): Promise<GetOCRRuntimeSessionResult>;

  /** Lista sessões OCR (filtros estruturais opcionais). */
  listSessions(input?: ListOCRRuntimeSessionsInput): Promise<ListOCRRuntimeSessionsResult>;

  /** Lista referências a providers (HTTP somente no Adapter do Port). */
  listProviderReferences(): Promise<ListOCRProviderReferencesResult>;
}
