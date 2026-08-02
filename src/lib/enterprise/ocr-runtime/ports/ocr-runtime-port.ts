/**
 * OCRRuntimePort — contrato único do OCR Runtime (DIP-03).
 *
 * Application / Enterprise Runtime / Capture Engine Runtime dependem
 * exclusivamente desta interface para coordenação estrutural de OCR.
 *
 * Fluxo obrigatório (sem implementação paralela / sem OCR real):
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCRRuntimePort → Canonical Execution Orchestrator
 *     → OCR Provider Adapter → Provider futuro
 *
 * NÃO executa OCR. NÃO extrai texto. NÃO interpreta documentos.
 * NÃO conecta Azure / Google Vision / Textract / Tesseract.
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
} from "./types";

export interface OCRRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: OCRRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<OCRRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo (OCR tecnológico = FALSE). */
  capabilities(): OCRRuntimeCapabilities;

  /**
   * Coordena estruturalmente uma sessão OCR via Orchestrator + OCR Provider Adapter.
   * NÃO executa OCR. NÃO invoca extração real no Provider Adapter.
   */
  coordinateOcr(input: CoordinateOCRInput): Promise<CoordinateOCRResult>;

  /** Obtém sessão OCR por id. */
  getSession(input: GetOCRRuntimeSessionInput): Promise<GetOCRRuntimeSessionResult>;

  /** Lista sessões OCR (filtros estruturais opcionais). */
  listSessions(input?: ListOCRRuntimeSessionsInput): Promise<ListOCRRuntimeSessionsResult>;

  /** Lista referências estruturais a providers futuros (sem conexão). */
  listProviderReferences(): Promise<ListOCRProviderReferencesResult>;
}
