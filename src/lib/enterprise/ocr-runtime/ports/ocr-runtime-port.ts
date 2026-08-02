/**
 * OCRRuntimePort — contrato único do OCR Runtime (DIP-03 / OCR-01).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime dependem
 * exclusivamente desta interface para coordenação e execução OCR.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCRRuntimePort → Canonical Execution Orchestrator
 *     → OCRProviderPort → AzureDocumentIntelligenceAdapter → Azure
 *
 * NÃO contém HTTP Azure. NÃO interpreta documentos. NÃO conhece TISS.
 */
import type {
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRRuntimeCapabilities,
  OCRRuntimeHealth,
  OCRRuntimeProviderId,
  ProcessOCRInput,
  ProcessOCRResult,
} from "./types";

export interface OCRRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: OCRRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<OCRRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): OCRRuntimeCapabilities;

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
