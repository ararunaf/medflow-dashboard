/**
 * DocumentExtractionRuntimePort — contrato único do Enterprise Document
 * Extraction Runtime (F3-CAP-07).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / documentos de extração.
 *
 * Fluxo estrutural (F3-CAP-07):
 *   Produto → Enterprise Runtime → DocumentExtractionRuntimePort
 *     → Adapter → Document Extraction Runtime Store → DocumentExtractionResult
 *
 * F3-CAP-07: infraestrutura canônica estrutural apenas. Sem extração real.
 * Sem OCR. Sem IA. Sem ML. Sem LLM. Sem Regex. Sem Template Matching.
 * Sem leitura de campos. Sem preenchimento de guias. Sem persistência.
 */
import type {
  CloseExtractionJobInput,
  CloseExtractionJobResult,
  DocumentExtractionRuntimeCapabilities,
  DocumentExtractionRuntimeHealth,
  DocumentExtractionRuntimeInfo,
  DocumentExtractionRuntimeProviderId,
  ExtractionStatsInput,
  ExtractionStatsResult,
  GetExtractionResultInput,
  GetExtractionResultResult,
  OpenExtractionJobInput,
  OpenExtractionJobResult,
  RegisterExtractionDocumentInput,
  RegisterExtractionDocumentResult,
  SubmitExtractionRequestInput,
  SubmitExtractionRequestResult,
} from "./types";

export interface DocumentExtractionRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentExtractionRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-07 — operações estruturais canônicas (nunca executam extração real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de extração. NÃO inicia extração real. NÃO lê arquivos. */
  openJob(input: OpenExtractionJobInput): Promise<OpenExtractionJobResult>;

  /** Fecha job estrutural de extração. NÃO interrompe extração real (não há). */
  closeJob(input: CloseExtractionJobInput): Promise<CloseExtractionJobResult>;

  /** Cria request estrutural de extração dentro de um job. NÃO dispara engine. */
  submitRequest(input: SubmitExtractionRequestInput): Promise<SubmitExtractionRequestResult>;

  /** Registra referência estrutural de documento. NÃO lê bytes/campos reais. */
  registerDocument(
    input: RegisterExtractionDocumentInput,
  ): Promise<RegisterExtractionDocumentResult>;

  /** Obtém resultado estrutural por job/request/documento. NÃO extrai campos. */
  getResult(input: GetExtractionResultInput): Promise<GetExtractionResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-07). */
  stats(input?: ExtractionStatsInput): Promise<ExtractionStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<DocumentExtractionRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentExtractionRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-07). */
  providerInfo(): DocumentExtractionRuntimeInfo;
}
