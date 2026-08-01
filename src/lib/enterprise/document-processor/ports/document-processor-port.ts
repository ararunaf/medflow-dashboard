/**
 * DocumentProcessorPort — contrato único de Document Processing Foundation (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-13: fundação arquitetural genérica de processamento documental.
 * NÃO implementa OCR. NÃO implementa IA. NÃO implementa parser XML/PDF.
 * NÃO implementa Barcode/QRCode. NÃO implementa TISS. NÃO implementa Workflow.
 *
 * Todo Processor futuro produz exatamente o mesmo modelo canônico de saída.
 * O restante do Enterprise nunca conhece a tecnologia de processamento.
 */
import type {
  DocumentProcessorCapabilities,
  DocumentProcessorHealth,
  DocumentProcessorProviderId,
  GetProcessingInput,
  GetProcessingResult,
  ListProcessingsInput,
  ListProcessingsResult,
  ProcessInput,
  ProcessResult,
} from "./types";

export interface DocumentProcessorPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentProcessorProviderId;

  /** Verificação leve de prontidão (sem alterar processings). */
  health(): Promise<DocumentProcessorHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentProcessorCapabilities;

  /**
   * Registra / materializa um processamento canônico (in-memory).
   * NÃO executa OCR, IA, parsers ou I/O externo.
   */
  process(input: ProcessInput): Promise<ProcessResult>;

  /** Obtém um processamento por ProcessingId. */
  getProcessing(input: GetProcessingInput): Promise<GetProcessingResult>;

  /** Lista processings (filtros estruturais opcionais). */
  listProcessings(input?: ListProcessingsInput): Promise<ListProcessingsResult>;
}
